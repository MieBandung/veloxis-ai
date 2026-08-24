# Veloxis Backend — AI Extraction Prototype

FastAPI backend service for extracting structured JSON from logistics documents using **Qwen2.5-VL-3B** fine-tuned with **Veloxis LoRA adapter**.

## Features

- **Endpoints**:
  - `GET /health` — Check backend status & active AI mode.
  - `POST /extract` — Upload document image (JPG, PNG, WEBP) and retrieve structured JSON (`ExtractionResult`).
- **Dual Mode (`AI_MODE`)**:
  - `AI_MODE=mock` — Fast CPU/lightweight development mode (returns static mock response without loading model).
  - `AI_MODE=qwen` — Production 4-bit QLoRA inference on GPU.

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
│       └── epoch-1/   # LoRA adapter checkpoint weights
│
├── samples/           # Sample logistics documents for smoke tests
├── requirements.txt
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Running the Server

### 1. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default settings use `AI_MODE=mock`.

### 2. Run with Docker

```bash
docker compose up --build
```

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
  "model": "Qwen2.5-VL-3B-Instruct",
  "adapter": "epoch-1",
  "ai_mode": "mock"
}
```

### `POST /extract`

- **Content-Type**: `multipart/form-data`
- **Body**: `file` (Image: `.jpg`, `.png`, `.webp`)

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
