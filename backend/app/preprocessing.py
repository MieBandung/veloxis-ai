"""Document ingestion: turn an uploaded PNG/JPG/WEBP/PDF into images the model can read.

Two failure modes this layer exists to prevent:

1. Alpha flattening. `Image.convert("RGB")` on a transparent PNG/WEBP drops the alpha
   channel and keeps whatever RGB sits underneath -- usually zeros. A scanned document
   exported with transparency therefore became a solid black rectangle. Transparency is
   composited onto white instead.

2. Train/inference resolution mismatch. The Veloxis adapter was trained through a
   processor pinned to min_pixels=200704 / max_pixels=602112 (256-768 visual tokens).
   The base model's processor defaults to 3136 / 12845056, so a 300x300 document reached
   the model at ~121 visual tokens -- far below anything seen during training -- and the
   adapter produced unparseable output. Pages are normalised into the training budget
   here, with a good resampling filter, before the processor sees them.
"""

import io
import logging
import math
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger("veloxis.preprocessing")

# Guard against decompression-bomb images while still allowing large scans.
Image.MAX_IMAGE_PIXELS = 80_000_000

# Qwen2.5-VL: patch_size 14 * merge_size 2. Every side is a multiple of this.
IMAGE_FACTOR = 28

# Defaults matching the adapter's preprocessor_config.json. model.py overrides these
# with the values actually read from the loaded processor.
DEFAULT_MIN_PIXELS = 200_704
DEFAULT_MAX_PIXELS = 602_112

MAX_PDF_PAGES = 5
PDF_MAX_RENDER_SCALE = 4.0

class DocumentError(ValueError):
    """A document could not be turned into readable page images."""

def _round_to_factor(value: float, factor: int = IMAGE_FACTOR) -> int:
    return max(factor, int(round(value / factor)) * factor)

def flatten_transparency(image: Image.Image) -> Image.Image:
    """Composite any alpha channel onto white, then normalise the mode to RGB.

    Handles RGBA/LA directly, palette images carrying a `transparency` key, 16-bit
    scanner output (I/I;16), CMYK and 1-bit bitonal scans.
    """
    has_alpha = image.mode in ("RGBA", "LA") or (
        image.mode == "P" and "transparency" in image.info
    )

    if has_alpha:
        rgba = image.convert("RGBA")
        white = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        return Image.alpha_composite(white, rgba).convert("RGB")

    if image.mode in ("I", "I;16", "I;16B", "I;16L", "F"):
        # convert("RGB") clips these to 255; rescale down to 8-bit first.
        extrema = image.getextrema()
        peak = extrema[1] if isinstance(extrema, tuple) else 65535
        scale = 255.0 / peak if peak and peak > 255 else 1.0
        return image.point(lambda v: v * scale).convert("L").convert("RGB")

    if image.mode == "1":
        return image.convert("L").convert("RGB")

    return image.convert("RGB")

def normalize_page(
    image: Image.Image,
    min_pixels: int = DEFAULT_MIN_PIXELS,
    max_pixels: int = DEFAULT_MAX_PIXELS,
) -> Image.Image:
    """Correct orientation, flatten transparency, and fit the training pixel budget."""
    try:
        image = ImageOps.exif_transpose(image) or image
    except Exception:
        logger.debug("EXIF orientation could not be applied; using image as-is.")

    image = flatten_transparency(image)

    width, height = image.size
    if width < 1 or height < 1:
        raise DocumentError("Document page has no content.")

    pixels = width * height
    if pixels < min_pixels:
        ratio = math.sqrt(min_pixels / pixels)          # upscale a small document
    elif pixels > max_pixels:
        ratio = math.sqrt(max_pixels / pixels)          # downscale an oversized scan
    else:
        return image

    target = (_round_to_factor(width * ratio), _round_to_factor(height * ratio))
    logger.info("Normalising page %sx%s -> %sx%s for the model.", width, height, *target)
    return image.resize(target, Image.LANCZOS)

def _decode_image(file_bytes: bytes) -> Image.Image:
    try:
        Image.open(io.BytesIO(file_bytes)).verify()      # integrity check consumes the handle
        return Image.open(io.BytesIO(file_bytes))        # so reopen for real work
    except UnidentifiedImageError:
        raise DocumentError("The file is not a readable image.")
    except Image.DecompressionBombError:
        raise DocumentError("The image resolution is too large to process.")
    except Exception as e:
        raise DocumentError(f"The image file appears to be damaged ({e}).")

def _render_pdf(file_bytes: bytes, max_pixels: int) -> list[Image.Image]:
    try:
        import pypdfium2 as pdfium
    except ImportError:
        raise DocumentError("PDF support is unavailable on this server.")

    try:
        pdf = pdfium.PdfDocument(file_bytes)
    except Exception:
        raise DocumentError("The PDF could not be opened; it may be damaged or password-protected.")

    page_count = len(pdf)
    if page_count == 0:
        raise DocumentError("The PDF has no pages.")
    if page_count > MAX_PDF_PAGES:
        logger.info("PDF has %s pages; processing the first %s.", page_count, MAX_PDF_PAGES)

    pages: list[Image.Image] = []
    for index in range(min(page_count, MAX_PDF_PAGES)):
        page = pdf[index]
        # Render near the model's pixel budget instead of a fixed scale, so a small page
        # is not rendered too coarsely and an A0 drawing is not rendered enormous.
        width_pt, height_pt = page.get_size()
        if width_pt <= 0 or height_pt <= 0:
            raise DocumentError(f"Page {index + 1} of the PDF has no printable area.")
        scale = min(PDF_MAX_RENDER_SCALE, math.sqrt(max_pixels / (width_pt * height_pt)))
        pages.append(page.render(scale=max(1.0, scale)).to_pil())

    return pages

def load_document_pages(
    file_bytes: bytes,
    filename: str = "",
    content_type: str = "",
    min_pixels: int = DEFAULT_MIN_PIXELS,
    max_pixels: int = DEFAULT_MAX_PIXELS,
) -> list[Image.Image]:
    """Decode an upload into model-ready RGB pages. Raises DocumentError on bad input."""
    if not file_bytes:
        raise DocumentError("The uploaded file is empty.")

    is_pdf = (
        file_bytes[:5] == b"%PDF-"
        or filename.lower().endswith(".pdf")
        or content_type.lower() == "application/pdf"
    )

    raw_pages = _render_pdf(file_bytes, max_pixels) if is_pdf else [_decode_image(file_bytes)]
    return [normalize_page(page, min_pixels, max_pixels) for page in raw_pages]
