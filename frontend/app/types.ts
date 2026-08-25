/** Mirrors the backend ExtractionResult schema (backend/app/schemas.py). */
export interface ExtractedItem {
  sku: string | null;
  nama_barang: string | null;
  qty: number | null;
  satuan: string | null;
  berat_kg: number | null;
}

export interface ExtractedData {
  nomor_dokumen: string | null;
  jenis_dokumen: string | null;
  nama_vendor: string | null;
  nama_penerima: string | null;
  tanggal: string | null;
  items: ExtractedItem[];
  grand_total: number | null;
}

export interface ApiError {
  code: string;
  message: string;
}

/** The single screen state. The whole app is this one flow. */
export type Stage = "idle" | "processing" | "result" | "error";
