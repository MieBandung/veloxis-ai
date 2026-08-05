# ⚡ Veloxis AI

> **Rapid Vision-LLM Document Extraction for High-Throughput Warehouse Logistics**

Intelligent Document Processing (IDP) platform built with **FastAPI**, **Next.js 14**, **Tailwind CSS**, and **Fine-Tuned Vision-LLM API**.

---

# 📖 Overview

**Veloxis AI** adalah solusi *Smart Logistics* yang dirancang untuk mengeliminasi *bottleneck* pada proses penerimaan barang (*inbound*) di gudang. Sistem ini mengotomatisasi ekstraksi data dari surat jalan, faktur, dan manifes vendor berformat acak (*unstructured documents*) menjadi entitas data JSON baku secara *real-time* tanpa konfigurasi templat manual.

**Core Capabilities**:
- **Zero-Template Parsing**: Membaca dokumen dari berbagai vendor tanpa aturan layout kaku.
- **Multimodal Vision-LLM**: Mengekstraksi gambar/PDF surat jalan secara presisi.
- **Structured Output Engine**: Mengonversi teks dokumen ke skema JSON terstandar (Nomor Dokumen, Vendor, Tanggal, SKU, Qty, Satuan, Berat).
- **One-Command Deployment**: Siap dioperasikan penuh secara lokal menggunakan Docker Compose.

---

# 🛠 Tech Stack

## Backend & AI Core
- Python 3.10+
- FastAPI (REST API Engine)
- Uvicorn (ASGI Server)
- Pydantic v2 (Data Validation & Serialization)
- Google Generative AI / Fine-Tuned Vision-LLM

## Frontend
- Next.js 14 (App Router)
- React 18+
- TypeScript
- Tailwind CSS

## Containerization & DevOps
- Docker & Docker Compose

---

# 📦 Installed Packages

## Backend

| Package | Purpose |
| :--- | :--- |
| `fastapi` | Modern & high-performance Web Framework for REST APIs |
| `uvicorn` | Lightning-fast ASGI server implementation |
| `pydantic` | Data validation and settings management using Python type annotations |
| `python-multipart` | Multipart form-data parser for file upload handling |
| `python-dotenv` | Reads key-value pairs from `.env` file |
| `google-generativeai` | Fine-tuned Vision-LLM API integration |

## Frontend

| Package | Purpose |
| :--- | :--- |
| `next` | React Framework for Production & App Router Rendering |
| `react` / `react-dom` | UI Library |
| `typescript` | Static Type Checking |
| `tailwindcss` | Utility-first CSS Framework |
| `lucide-react` | Modern UI Icons |
| `sonner` | Toast Notification Engine |
| `clsx` / `tailwind-merge` | Conditional class utility |

---

# 📁 Project Structure

```text
veloxis-ai/
│
├── backend/                  # FastAPI Application
├── frontend/                 # Next.js Application
├── dataset/                  # AI Synthetic & Fine-Tuning Samples
├── docker-compose.yml        # Multi-container Docker Orchestrator
├── .gitignore                # Git Ignore Configuration
└── README.md                 # Project Documentation

```

---

# 📁 Backend Structure

```text
backend/
│
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   └── extraction.py   # Upload & Processing Routes
│   │       └── api.py              # API Router Aggregator
│   │
│   ├── core/
│   │   ├── config.py               # Environment & App Settings
│   │   └── security.py             # Security & CORS Settings
│   │
│   ├── schemas/
│   │   └── extraction.py           # Pydantic Output Data Models
│   │
│   └── services/
│       └── llm_service.py          # Vision-LLM Inference Pipeline
│
├── main.py                         # FastAPI Entrypoint
├── Requirements.txt                # Python Dependencies
└── Dockerfile                      # Backend Docker Configuration

```

---

# 📁 Frontend Structure

```text
frontend/
│
├── app/
│   ├── layout.tsx                  # Global App Layout & Font Config
│   ├── page.tsx                    # Main MVP Single Page (Upload & Output Table)
│   └── globals.css                 # Tailwind & Custom Styles
│
├── components/
│   ├── ui/                         # Reusable Basic UI Components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── table.tsx
│   └── logistics/                  # Domain-Specific Components
│       ├── FileUploader.tsx        # Drag and Drop File Input
│       ├── ExtractionResult.tsx    # Parsed JSON & Table Renderer
│       └── StatusBadge.tsx         # Document Type / Status Indicator
│
├── lib/
│   ├── api.ts                      # Axios/Fetch API Client to FastAPI
│   └── utils.ts                    # Class merger & Helper Functions
│
├── types/
│   └── extraction.ts               # TypeScript Interfaces for Logistics Data
│
├── Dockerfile                      # Frontend Docker Configuration
└── package.json                    # Node Dependencies & Scripts

```

---

# 📁 Dataset Structure

```text
dataset/
│
├── raw/                            # Sample Document Images / PDFs (Invoices & Delivery Notes)
├── processed/                      # Annotated Samples
└── train.jsonl                     # Ground Truth Vision-LLM Fine-Tuning Pairs

```

---

# 🚀 Installation & Local Running

## Method 1: Using Docker Compose (Recommended)

Pastikan Docker Desktop sudah aktif di komputer kamu.

```bash
# 1. Clone Repository
git clone [https://github.com/USERNAME_KAMU/veloxis-ai.git](https://github.com/USERNAME_KAMU/veloxis-ai.git)
cd veloxis-ai

# 2. Setup Environment Variables
cp .env.example .env

# 3. Build & Run Application
docker compose up --build

```

Aplikasi dapat diakses melalui:

* **Frontend UI**: `http://localhost:3000`
* **Backend API**: `http://localhost:8000`
* **Swagger API Docs**: `http://localhost:8000/docs`

---

## Method 2: Manual Development Setup

### Backend Setup

```bash
cd backend
python -m venv .venv

# On Windows PowerShell:
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn main:app --reload --port 8000

```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev

```

---

# ⚙️ Environment

Aplikasi membutuhkan file `.env` di folder utama:

```env
# Server Config
PORT=8000
ENVIRONMENT=development

# AI Model Credentials
VISION_LLM_API_KEY=your_vision_llm_api_key_here
MODEL_NAME=gemini-1.5-flash

```

---

# 👥 Team Roles & Responsibilities

| Role | Focus Area | Responsibilities |
| --- | --- | --- |
| **Dev 1 (AI & Data Lead)** | Vision-LLM & Dataset | Mengumpulkan sampel dokumen logistik, menyusun dataset sintesis (`train.jsonl`), *fine-tuning* model API, serta validasi skema output. |
| **Dev 2 (Fullstack Lead)** | FastAPI, Next.js & DevOps | Membangun endpoint REST API, merancang UI 1-halaman *single page MVP*, serta menyusun konfigurasi `Dockerfile` & `docker-compose.yml`. |
| **Hacker / Pitcher** | Product & Media | Menyusun Dokumen Proposal PDF (maks. 20 hal), merekam Video *Proof of Work* (maks. 7 menit), serta Video Promosi (maks. 5 menit). |

---

# 🌿 Git Workflow

Gunakan alur percabangan (*branching*) berikut untuk menjaga kerapian repositori:

```text
main
│
├── develop
│   │
│   ├── feature/backend-api
│   ├── feature/frontend-ui
│   ├── feature/ai-finetune
│   └── feature/docker-compose

```

### Aturan Branching:

1. `main`: Branch stabil dan *production-ready*. Hanya di-*merge* dari `develop`.
2. `develop`: Branch integrasi utama seluruh fitur.
3. `feature/*`: Branch pengerjaan fitur spesifik. Buat Pull Request (PR) ke `develop` jika fitur selesai.

---

# 📝 Commit Convention

Wajib mengikuti standar **Conventional Commits**:

| Prefix | Penggunaan | Contoh |
| --- | --- | --- |
| `feat:` | Fitur baru | `feat: add PDF drag-and-drop file uploader` |
| `fix:` | Perbaikan bug | `fix: resolve CORS policy error on upload route` |
| `docs:` | Dokumentasi | `docs: update README with environment guide` |
| `style:` | Format kode/CSS | `style: update dashboard table padding` |
| `refactor:` | Restrukturisasi kode | `refactor: move extraction schema to schemas folder` |
| `chore:` | Maintenance / Tooling | `chore: add python-dotenv to requirements` |

---

# 🔄 Development Workflow

```text
Issue / Task
     │
     ▼
Create Feature Branch (feature/*)
     │
     ▼
Development & Local Test
     │
     ▼
Git Commit (Conventional Commits)
     │
     ▼
Pull Request (PR) to develop
     │
     ▼
Code Review & Testing
     │
     ▼
Merge to develop
     │
     ▼
Merge to main (Release)

```

---

# 📚 Coding Guidelines

### Backend (FastAPI)

* **Routes/Endpoints**: Hanya bertugas menerima *request*, memanggil *services*, dan mengembalikan *response*.
* **Schemas (Pydantic)**: Gunakan untuk memvalidasi input *request* dan memformat *output JSON*.
* **Services**: Seluruh logika eksekusi ekstraksi Vision-LLM dan pemrosesan gambar/PDF diletakkan di dalam `services/`.

### Frontend (Next.js)

* **App Router**: Tempatkan komponen halaman utama pada `app/page.tsx`.
* **UI Components**: Pisahkan komponen *reusable* (tombol, kartu, tabel) di dalam `components/ui/`.
* **State & API**: Kelola *state upload* dan *loading indicator* menggunakan skema React *state* ringkas.

---

# 📂 Folder Responsibility

| Folder | Responsibility |
| --- | --- |
| `backend/app/api/` | Menangani Route & Endpoint HTTP FastAPI |
| `backend/app/schemas/` | Validasi Struktur Data & Skema JSON Output |
| `backend/app/services/` | Logika Pemrosesan AI / Vision-LLM Engine |
| `frontend/app/` | Layout & Halaman Utama Aplikasi Web |
| `frontend/components/` | Komponen Tampilan (Uploader, Tabel Data) |
| `dataset/` | File Sampel & Berkasa Annotation Fine-Tuning |

---

# ✅ Current Setup Status

* [x] Repository Inisialisasi & Structure Setup
* [x] Gitignore & Environment Configuration
* [x] FastAPI Backend Scaffold Setup
* [x] Next.js Frontend Scaffold Setup
* [x] Dockerfile Backend & Frontend
* [x] Docker Compose Orchestrator
* [ ] Integrasi Fine-Tuned Vision-LLM Engine
* [ ] Frontend Drag-and-Drop Uploader Component
* [ ] Frontend Extraction Table Component
* [ ] Integrasi Fullstack (FE - BE - AI API)

---

# 📅 Roadmap

## Sprint 0: Foundation & Environment (5 – 7 Agustus 2026)

* [x] Setup Repositori & Git Workflow
* [x] Setup FastAPI Backend & Next.js Frontend
* [x] Setup Docker & Docker Compose
* [ ] Pengumpulan 20–30 Sampel Dokumen Logistik

## Sprint 1: AI Model & API Engine (8 – 14 Agustus 2026)

* [ ] Penyusunan Dataset Fine-Tuning (`train.jsonl`)
* [ ] Execution Fine-Tuning Vision-LLM API
* [ ] Bikin Endpoint REST API Extraction (`POST /api/v1/extract`)
* [ ] Testing JSON Output Schema Validation

## Sprint 2: Frontend & System Integration (15 – 20 Agustus 2026)

* [ ] Development Single Page UI (Upload Form & Result Table)
* [ ] Integrasi Frontend Next.js dengan Backend FastAPI
* [ ] End-to-End Testing via Docker Compose

## Sprint 3: Proposal & Media Submission (21 – 25 Agustus 2026)

* [ ] Pembuatan Proposal PDF (Max 20 Halaman)
* [ ] Perekaman & Editing Video *Proof of Work* (Max 7 Menit)
* [ ] Perekaman & Editing Video Promosi (Max 5 Menit)
* [ ] Submisi Berkas Akhir COMPFEST 2026

```

---