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

@app.get("/health")
def health_check():
    return {
        "status": "ok" if model_container.is_loaded else "loading",
        "model": model_container.base_model or os.getenv("BASE_MODEL", ""),
        "adapter": model_container.adapter_path or os.getenv("ADAPTER_PATH", ""),
        "ai_mode": model_container.ai_mode,
    }

@app.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    # Validate MIME type
    content_type = (file.content_type or "").lower()
    filename = file.filename or ""
    if content_type not in ALLOWED_MIME_TYPES and not filename.lower().endswith(ALLOWED_EXTENSIONS):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {
                    "code": "INVALID_FILE",
                    "message": "Unsupported file format. Only JPG, PNG, WEBP, and PDF are supported."
                }
            }
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    "success": False,
                    "error": {
                        "code": "FILE_TOO_LARGE",
                        "message": f"File size exceeds limit of {MAX_FILE_SIZE // (1024*1024)}MB."
                    }
                }
            )

        data = run_inference(file_bytes, filename or "uploaded_image")
        return {
            "success": True,
            "data": data
        }

    except ValueError as e:
        err_msg = str(e)
        code = "INVALID_MODEL_OUTPUT" if "INVALID_MODEL_OUTPUT" in err_msg else "INVALID_FILE"
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR if code == "INVALID_MODEL_OUTPUT" else status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {
                    "code": code,
                    "message": err_msg.replace("INVALID_MODEL_OUTPUT: ", "")
                }
            }
        )
    except RuntimeError as e:
        err_msg = str(e)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if "not initialized" in err_msg else status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "MODEL_UNAVAILABLE" if "not initialized" in err_msg else "INFERENCE_FAILURE",
                    "message": err_msg.replace("INFERENCE_FAILURE: ", "")
                }
            }
        )
    except Exception as e:
        logger.error(f"Unexpected extract error: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred during processing."
                }
            }
        )
