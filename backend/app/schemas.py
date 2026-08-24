from pydantic import BaseModel
from typing import List, Optional

class Item(BaseModel):
    sku: Optional[str] = None
    nama_barang: Optional[str] = None
    qty: Optional[float] = None
    satuan: Optional[str] = None
    berat_kg: Optional[float] = None

class ExtractionResult(BaseModel):
    nomor_dokumen: Optional[str] = None
    jenis_dokumen: Optional[str] = None
    nama_vendor: Optional[str] = None
    nama_penerima: Optional[str] = None
    tanggal: Optional[str] = None
    items: List[Item] = []
    grand_total: Optional[float] = None
