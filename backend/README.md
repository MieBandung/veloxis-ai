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
│   ├── main.py          # FastAPI entry point & endpoints
│   ├── model.py         # Qwen2.5-VL & LoRA model loader (Loaded once)
│   ├── preprocessing.py # Document -> model-ready page images
│   ├── inference.py     # Vision prompt execution & robust JSON parsing
│   └── schemas.py       # Pydantic extraction output schemas
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

## Document Ingestion

`app/preprocessing.py` turns an upload into the page images the model expects. It exists
to prevent two failure modes that made PNG support unreliable:

**Transparency.** `Image.convert("RGB")` drops the alpha channel and keeps whatever RGB
sits underneath — usually zeros. A document exported with a transparent background
therefore reached the model as a solid black rectangle. Alpha is now composited onto
white instead.

**Resolution.** The Veloxis adapter was fine-tuned through a processor pinned to
`min_pixels=200704` / `max_pixels=602112`, i.e. 256–768 visual tokens. Loading the *base*
model's processor silently substitutes Qwen's defaults (3136 / 12845056), so a 300×300
document arrived at ~121 visual tokens — far below anything seen in training — and the
adapter returned unparseable output, while a 500×500 document (324 tokens) worked. The
processor is now loaded from the adapter directory, which ships the training-time
`preprocessor_config.json`, and pages are normalised into that budget with LANCZOS
resampling before inference.

This is a train/inference preprocessing mismatch, not a minimum-resolution requirement:
small documents are upscaled, not rejected.

Also handled: EXIF orientation, palette/16-bit/CMYK/bitonal colour modes, image integrity
checks, and a decompression-bomb guard. PDFs are rendered page-by-page (up to
`MAX_PDF_PAGES`, default 5) at a scale targeting the same pixel budget; multi-page results
are merged into one document — the first non-null header field wins and item rows are
concatenated.

## Error Codes

`POST /extract` returns `{"success": false, "error": {"code", "message"}}` on failure.
Messages never contain stack traces or internals; the frontend maps each code to
operator-facing text.

| Code | HTTP | Meaning |
| --- | --- | --- |
| `INVALID_FILE` | 400 | Extension/MIME type not supported |
| `EMPTY_FILE` | 400 | Upload contained no bytes |
| `FILE_TOO_LARGE` | 413 | Above the 10 MB limit |
| `UNREADABLE_DOCUMENT` | 400 | Damaged, encrypted, or undecodable file |
| `INVALID_MODEL_OUTPUT` | 422 | Model output was not valid JSON for the schema |
| `MODEL_UNAVAILABLE` | 503 | Model not loaded yet |
| `INFERENCE_FAILURE` | 500 | Generation failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

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
- **Body**: `file` (`.jpg`, `.png`, `.webp`, `.pdf`)

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
