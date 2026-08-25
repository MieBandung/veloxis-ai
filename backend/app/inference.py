import json
import logging
import os
from typing import Any

from PIL import Image
from pydantic import ValidationError

from app.model import model_container
from app.preprocessing import DocumentError, load_document_pages
from app.schemas import ExtractionResult

logger = logging.getLogger("veloxis.inference")

PROMPT_TEXT = """Extract the logistics document into EXACTLY this JSON schema.

Rules:
- Return valid JSON only.
- Do not add commentary.
- Do not wrap the JSON in Markdown fences.
- Use null when a field is missing or cannot be read reliably.
- Do not invent information.
- Extract every item shown in the document.
- Preserve the meaning of the document.
- Use the exact field names and structure below.

{
  "nomor_dokumen": null,
  "jenis_dokumen": null,
  "nama_vendor": null,
  "nama_penerima": null,
  "tanggal": null,
  "items": [
    {
      "sku": null,
      "nama_barang": null,
      "qty": null,
      "satuan": null,
      "berat_kg": null
    }
  ],
  "grand_total": null
}"""

MOCK_RESULT = {
    "nomor_dokumen": "DEMO-001",
    "jenis_dokumen": "SURAT JALAN",
    "nama_vendor": "PT Demo",
    "nama_penerima": "PT Customer",
    "tanggal": "2026-08-22",
    "items": [
        {
            "sku": "SKU-DEMO-101",
            "nama_barang": "Barang Demo A",
            "qty": 5.0,
            "satuan": "pcs",
            "berat_kg": 1.25,
        }
    ],
    "grand_total": 150000.0,
}

HEADER_FIELDS = (
    "nomor_dokumen",
    "jenis_dokumen",
    "nama_vendor",
    "nama_penerima",
    "tanggal",
    "grand_total",
)

def extract_json_substring(text: str) -> str:
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        return text[start_idx : end_idx + 1]
    raise ValueError("No JSON object found in output.")

def _generate(image: Image.Image) -> dict:
    """Run one page through the model and return the parsed JSON object."""
    from qwen_vl_utils import process_vision_info

    model = model_container.model
    processor = model_container.processor

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "image": image,
                    # Pin the same budget the adapter was trained on, so qwen_vl_utils
                    # cannot fall back to the base model's much wider defaults.
                    "min_pixels": model_container.min_pixels,
                    "max_pixels": model_container.max_pixels,
                },
                {"type": "text", "text": PROMPT_TEXT},
            ],
        }
    ]

    text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    image_inputs, video_inputs = process_vision_info(messages)
    inputs = processor(
        text=[text],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    )
    inputs = inputs.to(model.device)

    generated_ids = model.generate(
        **inputs,
        max_new_tokens=int(os.getenv("MAX_NEW_TOKENS", "512")),
        do_sample=False,
        num_beams=1,
    )
    generated_ids_trimmed = [
        out_ids[len(in_ids) :] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
    ]
    output_text = processor.batch_decode(
        generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
    )[0]

    logger.debug("Raw Qwen model output: %s", output_text)
    return json.loads(extract_json_substring(output_text))

def merge_pages(pages: list[dict]) -> dict:
    """Fold multi-page results into one document: first non-null header wins, items concatenate."""
    if len(pages) == 1:
        return pages[0]

    merged: dict[str, Any] = {field: None for field in HEADER_FIELDS}
    merged["items"] = []
    for page in pages:
        for field in HEADER_FIELDS:
            if merged[field] in (None, "") and page.get(field) not in (None, ""):
                merged[field] = page[field]
        merged["items"].extend(page.get("items") or [])
    return merged

def run_inference(file_bytes: bytes, filename: str, content_type: str = "") -> dict:
    # Always decode first, including in mock mode, so the document error paths behave
    # identically whether or not a GPU is attached.
    # DocumentError propagates as-is: main.py maps it to a readable UNREADABLE_DOCUMENT.
    pages = load_document_pages(
        file_bytes,
        filename=filename,
        content_type=content_type,
        min_pixels=model_container.min_pixels,
        max_pixels=model_container.max_pixels,
    )

    if model_container.ai_mode == "mock":
        logger.info("Running mock extraction for file: %s (%s page(s))", filename, len(pages))
        return ExtractionResult.model_validate(MOCK_RESULT).model_dump()

    if not model_container.model or not model_container.processor:
        raise RuntimeError("Model or processor is not initialized.")

    logger.info("Extracting %s page(s) from %s", len(pages), filename)

    try:
        page_results = [_generate(page) for page in pages]
        return ExtractionResult.model_validate(merge_pages(page_results)).model_dump()

    except json.JSONDecodeError as err:
        logger.error("JSON parsing error: %s", err)
        raise ValueError("INVALID_MODEL_OUTPUT: Model output could not be parsed as valid JSON.")
    except ValidationError as err:
        # Must precede ValueError: pydantic's ValidationError subclasses it.
        logger.error("Pydantic validation error: %s", err)
        raise ValueError("INVALID_MODEL_OUTPUT: Model output does not conform to ExtractionResult schema.")
    except ValueError as err:
        # extract_json_substring found no JSON at all.
        logger.error("Model returned no JSON object: %s", err)
        raise ValueError("INVALID_MODEL_OUTPUT: Model output contained no JSON object.")
    except Exception as err:
        logger.error("Inference execution error: %s", err)
        raise RuntimeError(f"INFERENCE_FAILURE: {err}")
