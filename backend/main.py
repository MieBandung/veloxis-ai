import os
import json
import base64
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

app = FastAPI(title="Veloxis AI Backend - OpenRouter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY if OPENROUTER_API_KEY else "dummy",
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Veloxis AI Backend"
    }
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Veloxis AI API Running (OpenRouter)"}

@app.post("/api/v1/extract")
async def extract_document(file: UploadFile = File(...)):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY belum dikonfigurasi di .env")

    try:
        image_bytes = await file.read()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        mime_type = file.content_type or "image/jpeg"

        prompt = """
        Kamu adalah sistem AI ekstraksi dokumen logistik.
        Ekstrak semua informasi dari gambar dokumen ini dan kembalikan HANYA format JSON murni.

        Skema JSON wajib:
        {
          "nomor_dokumen": "string",
          "jenis_dokumen": "Surat Jalan / Faktur / Invoice / Unknown",
          "nama_vendor": "string",
          "tanggal": "YYYY-MM-DD",
          "items": [
            {
              "sku": "string",
              "nama_barang": "string",
              "qty": 0,
              "satuan": "string",
              "berat_kg": 0.0
            }
          ]
        }
        """
        candidate_models = [
            "openrouter/free",
            "google/gemma-4-31b-it:free",
            "google/gemma-4-26b-a4b-it:free"
        ]

        response = None
        last_error = None

        for model_name in candidate_models:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ]
                )
                if response and response.choices and len(response.choices) > 0:
                    break
            except Exception as err:
                last_error = err
                continue

        if not response:
            raise HTTPException(status_code=500, detail=f"Gagal memproses via OpenRouter: {str(last_error)}")

        raw_text = response.choices[0].message.content
        clean_text = raw_text.replace("```json", "").replace("```", "").strip()
        parsed_json = json.loads(clean_text)

        return parsed_json

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses dokumen via OpenRouter: {str(e)}")