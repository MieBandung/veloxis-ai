# ⚡ Veloxis AI

> **Rapid Vision-LLM Document Extraction for High-Throughput Warehouse Logistics**

Intelligent Document Processing (IDP) platform built with **FastAPI**, **Next.js 14**, **Tailwind CSS**, and **Fine-Tuned Vision-LLM API**.

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
- **Fine-Tuned Vision-LLM API**

### Frontend
- **Next.js 14** (App Router)
- **React 18+**
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

# 2. Setup Environment Variables
cp .env.example .env

# 3. Build and Run Container
docker compose up --build

```

Akses layanan melalui browser:

* **Frontend UI**: `http://localhost:3000`
* **Backend API**: `http://localhost:8000`
* **Interactive API Docs (Swagger)**: `http://localhost:8000/docs`

---

## ⚙️ Environment Variables

Buat file `.env` di root folder dengan konfigurasi berikut:

```env
# Server Config
PORT=8000
ENVIRONMENT=development

# AI Model Credentials
VISION_LLM_API_KEY=your_vision_llm_api_key_here
MODEL_NAME=gemini-1.5-flash

```

---

## 📡 API Reference

### Extract Logistics Document

* **Endpoint**: `POST /api/v1/extract`
* **Content-Type**: `multipart/form-data`
* **Request Body**: `file` (Format: `.pdf`, `.png`, `.jpg`, `.jpeg`)
* **Response**: `200 OK` (Structured JSON)

```json
{
  "nomor_dokumen": "SJ/2026/08/010",
  "jenis_dokumen": "Surat Jalan",
  "nama_vendor": "PT Logistik Maju Bersama",
  "tanggal": "2026-08-05",
  "items": [
    {
      "sku": "SKU-LOG-01",
      "nama_barang": "Kardus Master Box",
      "qty": 150,
      "satuan": "Box",
      "berat_kg": 75.0
    }
  ]
}