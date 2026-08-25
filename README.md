# ⚡ Veloxis AI

> **Rapid Vision-LLM Document Extraction for High-Throughput Warehouse Logistics**

Intelligent Document Processing (IDP) platform built with **FastAPI**, **Next.js**, **Tailwind CSS**, and a **fine-tuned Qwen2.5-VL vision model**.

---

## 📖 Overview

**Veloxis AI** adalah solusi *Smart Logistics* yang dirancang untuk mengeliminasi *bottleneck* pada proses penerimaan barang (*inbound*) di gudang. Sistem ini mengotomatisasi ekstraksi data dari surat jalan, faktur, dan manifes vendor berformat acak (*unstructured documents*) menjadi entitas data JSON baku secara *real-time* tanpa konfigurasi templat manual.

### Key Features
- 🚀 **Zero-Template Parsing**: Membaca dokumen dari berbagai vendor tanpa aturan layout kaku.
- 👁️ **Multimodal Vision-LLM**: Mengekstraksi gambar/PDF surat jalan secara presisi.
- 📦 **Structured Output**: Mengonversi teks dokumen ke skema JSON terstandar (Nomor Dokumen, Vendor, Tanggal, SKU, Qty, Satuan, Berat).
- 🐳 **One-Command Deployment**: Siap dioperasikan penuh secara lokal menggunakan Docker Compose.

---

## 🛠 Tech Stack

### Backend & AI Core
- **Python 3.10+**
- **FastAPI** (REST API Engine)
- **Uvicorn** (ASGI Server)
- **Pydantic v2** (Data Validation & Serialization)
- **Transformers + PEFT** (Qwen2.5-VL-3B-Instruct + Veloxis LoRA adapter)

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

### Containerization & DevOps
- **Docker & Docker Compose**

---

## 📁 Project Structure

```text
veloxis-ai/
├── backend/                  # FastAPI Application & AI Service Engine
├── frontend/                 # Next.js Web UI Application
├── dataset/                  # Vision-LLM Synthetic & Fine-Tuning Samples
├── docker-compose.yml        # Multi-container Docker Orchestrator
├── .gitignore                # Git Exclusions
└── README.md                 # Project Documentation

```

---

## 🚀 Quick Start (Local Running)

### Prerequisites

Pastikan **Docker Desktop** sudah terinstall dan aktif di komputer kamu.

### Running with Docker Compose (Recommended)

```bash
# 1. Clone Repository
git clone [https://github.com/Lowwyi/veloxis-ai.git](https://github.com/Lowwyi/veloxis-ai.git)
cd veloxis-ai

# 2. Build and Run Containers (GPU host required for AI_MODE=qwen)
docker compose up --build

```

Akses layanan melalui browser:

* **Frontend UI**: `http://localhost:3000`
* **Backend API**: `http://localhost:8000`
* **Interactive API Docs (Swagger)**: `http://localhost:8000/docs`

---

## ⚙️ Environment Variables

Defaults are wired directly into `docker-compose.yml`; override them via a root `.env` if needed.

```env
AI_MODE=qwen
BASE_MODEL=Qwen/Qwen2.5-VL-3B-Instruct
LOAD_IN_4BIT=true
MAX_NEW_TOKENS=512

# Browser-side backend URL, inlined into the Next.js build
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`ADAPTER_PATH` and `HF_HOME` are fixed by compose. See `backend/.env.example` and `frontend/.env.example`.

---

## 📡 API Reference

### Extract Logistics Document

* **Endpoint**: `POST /extract`
* **Content-Type**: `multipart/form-data`
* **Request Body**: `file` (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`)
* **Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "nomor_dokumen": "SJ/2026/08/010",
    "jenis_dokumen": "Surat Jalan",
    "nama_vendor": "PT Logistik Maju Bersama",
    "nama_penerima": "Gudang Pusat",
    "tanggal": "2026-08-05",
    "items": [
      {
        "sku": "SKU-LOG-01",
        "nama_barang": "Kardus Master Box",
        "qty": 150,
        "satuan": "Box",
        "berat_kg": 75.0
      }
    ],
    "grand_total": null
  }
}
```

Health check: `GET /health`.
