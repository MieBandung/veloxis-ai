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