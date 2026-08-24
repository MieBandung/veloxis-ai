# Veloxis Backend — AI Extraction Prototype

FastAPI backend service for extracting structured JSON from logistics documents using **Qwen2.5-VL-3B** fine-tuned with **Veloxis LoRA adapter**.

## Features

- **Endpoints**:
  - `GET /health` — Check backend status & active AI mode.
  - `POST /extract` — Upload a document (JPG, PNG, WEBP, PDF) and retrieve structured JSON (`ExtractionResult`).
- **`AI_MODE`**:
  - `AI_MODE=qwen` *(default)* — Production 4-bit QLoRA inference on GPU. Startup fails loudly if the model or adapter cannot be loaded.
  - `AI_MODE=mock` — Opt-in development mode only; returns a static response without loading the model.

## Project Structure

```
backend/
│
├── app/
│   ├── main.py        # FastAPI entry point & endpoints
│   ├── model.py       # Qwen2.5-VL & LoRA model loader (Loaded once)
│   ├── inference.py   # Vision prompt execution & robust JSON parsing
│   └── schemas.py     # Pydantic extraction output schemas
│
├── models/
│   └── qwen-veloxis/
│       └── best_adapter/   # Veloxis LoRA adapter (mounted into the container)
│
├── samples/           # Sample logistics documents for smoke tests
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md
```

## Running the Server

### 1. Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_MODE` | `qwen` | `qwen` for real inference, `mock` for local development |
| `BASE_MODEL` | `Qwen/Qwen2.5-VL-3B-Instruct` | Downloaded by Transformers on first run |
| `ADAPTER_PATH` | `/app/models/qwen-veloxis/best_adapter` | Veloxis LoRA adapter, mounted by compose |
| `HF_HOME` | `/root/.cache/huggingface` | Cache dir backed by the `hf-cache` volume |
| `MAX_NEW_TOKENS` | `512` | Generation budget |
| `LOAD_IN_4BIT` | `true` | 4-bit NF4 quantization (matches training) |

### 2. Run with Docker

From the repository root:

```bash
docker compose up --build
```

Requires an NVIDIA GPU with the container toolkit — the 3B vision model will not run on CPU in practice.

### 3. Run Locally with Python

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## API Documentation

### `GET /health`

Response:
```json
{
  "status": "ok",
  "model": "Qwen/Qwen2.5-VL-3B-Instruct",
  "adapter": "/app/models/qwen-veloxis/best_adapter",
  "ai_mode": "qwen"
}
```

### `POST /extract`

- **Content-Type**: `multipart/form-data`
- **Body**: `file` (`.jpg`, `.png`, `.webp`, `.pdf` — PDFs use the first page)

Success Response (HTTP 200):
```json
{
  "success": true,
  "data": {
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
        "berat_kg": 1.25
      }
    ],
    "grand_total": 150000.0
  }
}
```
