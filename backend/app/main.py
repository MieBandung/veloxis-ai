import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.model import model_container
from app.inference import run_inference
from app.preprocessing import DocumentError

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("veloxis.main")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"}
ALLOWED_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".pdf")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Veloxis AI Backend...")
    model_container.load()
    yield
    logger.info("Shutting down Veloxis AI Backend...")

app = FastAPI(
    title="Veloxis AI Extraction Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "ok" if model_container.is_loaded else "loading",
        "model": model_container.base_model or os.getenv("BASE_MODEL", ""),
        "adapter": model_container.adapter_path or os.getenv("ADAPTER_PATH", ""),
        "ai_mode": model_container.ai_mode,
    }

def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    """Uniform error envelope. Messages stay free of stack traces and internals."""
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": {"code": code, "message": message}},
    )

@app.post("/extract")
@app.post("/api/v1/extract")
async def extract_document(file: UploadFile = File(...)):
    content_type = (file.content_type or "").lower()
    filename = file.filename or ""

    if content_type not in ALLOWED_MIME_TYPES and not filename.lower().endswith(ALLOWED_EXTENSIONS):
        return error_response(
            status.HTTP_400_BAD_REQUEST,
            "INVALID_FILE",
            "Unsupported file format. Only JPG, PNG, WEBP, and PDF are supported.",
        )

    try:
        file_bytes = await file.read()

        if not file_bytes:
            return error_response(
                status.HTTP_400_BAD_REQUEST, "EMPTY_FILE", "The uploaded file is empty."
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            return error_response(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                "FILE_TOO_LARGE",
                f"File size exceeds limit of {MAX_FILE_SIZE // (1024 * 1024)}MB.",
            )

        data = run_inference(file_bytes, filename or "uploaded_document", content_type)

        # Flattened fields are kept alongside `data` for backward compatibility.
        return {
            "success": True,
            "nomor_dokumen": data.get("nomor_dokumen"),
            "jenis_dokumen": data.get("jenis_dokumen"),
            "nama_vendor": data.get("nama_vendor"),
            "tanggal": data.get("tanggal"),
            "items": data.get("items", []),
            "data": data,
        }

    except DocumentError as e:
        # The file arrived intact but could not be turned into readable pages.
        logger.warning("Unreadable document %s: %s", filename, e)
        return error_response(status.HTTP_400_BAD_REQUEST, "UNREADABLE_DOCUMENT", str(e))

    except ValueError as e:
        message = str(e)
        if "INVALID_MODEL_OUTPUT" in message:
            logger.warning("Model output rejected for %s: %s", filename, message)
            return error_response(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "INVALID_MODEL_OUTPUT",
                "The document could not be read reliably enough to extract data.",
            )
        return error_response(status.HTTP_400_BAD_REQUEST, "INVALID_FILE", message)

    except RuntimeError as e:
        message = str(e)
        if "not initialized" in message:
            return error_response(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "MODEL_UNAVAILABLE",
                "The extraction model is not ready yet.",
            )
        logger.error("Inference failure for %s: %s", filename, message)
        return error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "INFERENCE_FAILURE",
            "Extraction failed while processing the document.",
        )

    except Exception as e:
        logger.error("Unexpected extract error: %s", e, exc_info=True)
        return error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            "An unexpected server error occurred during processing.",
        )
