from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Veloxis AI Backend")

# Enable CORS agar Frontend Next.js dapat mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Veloxis AI API Running"}

@app.post("/api/v1/extract")
async def extract_document(file: UploadFile = File(...)):
    # Mock Response sementara sebelum dikoneksikan ke Vision-LLM
    return {
        "nomor_dokumen": "SJ/2026/08/001",
        "jenis_dokumen": "Surat Jalan",
        "nama_vendor": "PT Logistik Indonesia Express",
        "tanggal": "2026-08-08",
        "items": [
            {
                "sku": "SKU-GUDANG-01",
                "nama_barang": "Kardus Master Box",
                "qty": 200,
                "satuan": "Box",
                "berat_kg": 100.0
            }
        ]
    }