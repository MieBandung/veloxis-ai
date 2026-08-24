export interface BoundingBox {
  id: string;
  label: string;
  field: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage width
  height: number; // percentage height
}

export interface ExtractedItem {
  sku: string;
  nama_barang: string;
  qty: number;
  satuan: string;
  berat_kg: number;
  confidence?: number;
  matched_catalog?: boolean;
}

export interface ExtractedData {
  nomor_dokumen: string;
  jenis_dokumen: string;
  nama_vendor: string;
  tanggal: string;
  nomor_po?: string;
  metode_pengiriman?: string;
  confidence_score: number;
  processing_time_ms: number;
  engine_version: string;
  items: ExtractedItem[];
  status: "verified" | "review_needed" | "synced";
}

export interface SampleDoc {
  id: string;
  name: string;
  type: string;
  vendor: string;
  date: string;
  description: string;
  sampleImage: string;
  mockData: ExtractedData;
  boundingBoxes: BoundingBox[];
}

export interface BatchJob {
  id: string;
  filename: string;
  doc_type: string;
  vendor: string;
  timestamp: string;
  items_count: number;
  total_qty: number;
  confidence: number;
  status: "COMPLETED" | "PROCESSING" | "REVIEW_NEEDED" | "SYNCED";
  latency_ms: number;
}
