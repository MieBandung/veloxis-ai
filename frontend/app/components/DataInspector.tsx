"use client";

import React, { useState, useEffect } from "react";
import {
  Table as TableIcon,
  Code,
  Copy,
  Download,
  Check,
  Building2,
  FileText,
  Calendar,
  Tag,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { ExtractedData, ExtractedItem } from "../types";

interface DataInspectorProps {
  data: ExtractedData | null;
  isProcessing: boolean;
}

export const DataInspector: React.FC<DataInspectorProps> = ({
  data,
  isProcessing,
}) => {
  const [activeView, setActiveView] = useState<"table" | "json">("table");
  const [copied, setCopied] = useState(false);
  const [editableItems, setEditableItems] = useState<ExtractedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (data) {
      setEditableItems(data.items || []);
    } else {
      setEditableItems([]);
    }
  }, [data]);

  if (isProcessing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center">
        <div className="w-10 h-10 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mb-3" />
        <h3 className="text-sm font-bold text-slate-800">
          Menganalisis Dokumen Surat Jalan
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          Mengekstrak nomor surat jalan, nama vendor/pengirim, tanggal, serta daftar rincian barang muatan...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-200 shadow-xs flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          <TableIcon className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Hasil Ekstraksi Surat Jalan
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          Pilih atau upload file surat jalan di sebelah kiri, lalu klik &quot;Ekstraksi Surat Jalan&quot; untuk menampilkan rincian muatan.
        </p>
      </div>
    );
  }

  // Calculate live dynamic metrics
  const totalItemsCount = editableItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalWeightKg = editableItems.reduce((acc, curr) => acc + (Number(curr.berat_kg) || 0), 0);

  const filteredItems = editableItems.filter(
    (item) =>
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemChange = (index: number, field: keyof ExtractedItem, value: any) => {
    const updated = [...editableItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditableItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = editableItems.filter((_, i) => i !== index);
    setEditableItems(updated);
  };

  const handleAddItem = () => {
    const newItem: ExtractedItem = {
      sku: `SKU-LOG-${editableItems.length + 1}`,
      nama_barang: "Barang Muatan Tambahan",
      qty: 1,
      satuan: "Unit",
      berat_kg: 1.0,
      confidence: 100,
    };
    setEditableItems([...editableItems, newItem]);
  };

  const handleCopyJson = () => {
    const payload = { ...data, items: editableItems };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const payload = { ...data, items: editableItems };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `surat_jalan_${data.nomor_dokumen.replace(/[/\\?%*:|"<>]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const headers = ["SKU Code", "Nama Barang", "Kuantitas (Qty)", "Satuan", "Berat Total (kg)"];
    const rows = editableItems.map((item) => [
      item.sku,
      `"${item.nama_barang.replace(/"/g, '""')}"`,
      item.qty,
      item.satuan,
      item.berat_kg,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `surat_jalan_items_${data.nomor_dokumen.replace(/[/\\?%*:|"<>]/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header Info Metadata Cards */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* No Surat Jalan */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1 font-medium">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>No. Surat Jalan</span>
            </div>
            <p className="font-mono font-bold text-slate-900 truncate text-xs">
              {data.nomor_dokumen}
            </p>
          </div>

          {/* Jenis Dokumen */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1 font-medium">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Jenis Dokumen</span>
            </div>
            <p className="font-semibold text-slate-800 truncate text-xs">
              {data.jenis_dokumen || "Surat Jalan Pengiriman"}
            </p>
          </div>

          {/* Vendor */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1 font-medium">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Vendor / Pengirim</span>
            </div>
            <p className="font-semibold text-slate-800 truncate text-xs">
              {data.nama_vendor}
            </p>
          </div>

          {/* Tanggal */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tanggal Pengiriman</span>
            </div>
            <p className="font-mono font-semibold text-slate-800 text-xs">
              {data.tanggal}
            </p>
          </div>
        </div>
      </div>

      {/* Table Toolbar & View Switcher */}
      <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveView("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                activeView === "table"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-blue-600" />
              Daftar Barang ({editableItems.length})
            </button>
            <button
              onClick={() => setActiveView("json")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                activeView === "json"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code className="w-3.5 h-3.5 text-emerald-600" />
              Format JSON
            </button>
          </div>

          {activeView === "table" && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU / nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 text-xs rounded-md bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white w-48"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeView === "json" ? (
            <>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin JSON</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Unduh JSON</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Tambah Baris</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Table / JSON View */}
      <div className="flex-1 overflow-auto bg-white">
        {activeView === "table" ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold sticky top-0 z-10">
                <th className="py-2.5 px-3 text-center w-8">#</th>
                <th className="py-2.5 px-3 font-mono">Kode SKU</th>
                <th className="py-2.5 px-3">Deskripsi Barang Logistik</th>
                <th className="py-2.5 px-3 text-right">Kuantitas (Qty)</th>
                <th className="py-2.5 px-3">Satuan</th>
                <th className="py-2.5 px-3 text-right">Berat (kg)</th>
                <th className="py-2.5 px-3 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition group">
                  <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                    {idx + 1}
                  </td>

                  {/* SKU */}
                  <td className="py-2 px-3 font-mono">
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded text-blue-700 font-bold w-28 text-xs font-mono"
                    />
                  </td>

                  {/* Nama Barang */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.nama_barang}
                      onChange={(e) => handleItemChange(idx, "nama_barang", e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded text-slate-800 font-medium w-full text-xs"
                    />
                  </td>

                  {/* Qty */}
                  <td className="py-2 px-3 text-right font-mono">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, "qty", Number(e.target.value))}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded text-slate-900 font-bold text-right w-16 text-xs"
                    />
                  </td>

                  {/* Satuan */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.satuan}
                      onChange={(e) => handleItemChange(idx, "satuan", e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded text-slate-600 w-16 text-xs"
                    />
                  </td>

                  {/* Berat */}
                  <td className="py-2 px-3 text-right font-mono">
                    <input
                      type="number"
                      step="0.1"
                      value={item.berat_kg}
                      onChange={(e) => handleItemChange(idx, "berat_kg", Number(e.target.value))}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded text-emerald-700 font-bold text-right w-18 text-xs"
                    />
                  </td>

                  {/* Delete button */}
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleDeleteItem(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-auto max-h-[380px] rounded-b-xl">
            <pre>{JSON.stringify({ ...data, items: editableItems }, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-500 text-[11px] block">Jumlah Baris</span>
            <span className="font-semibold text-slate-800 font-mono">{editableItems.length} SKU</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Total Kuantitas</span>
            <span className="font-bold text-blue-700 font-mono text-sm">
              {totalItemsCount.toLocaleString()} Unit
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Total Berat Bruto</span>
            <span className="font-bold text-emerald-700 font-mono text-sm">
              {totalWeightKg.toFixed(1)} kg
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Status: Surat Jalan Terverifikasi</span>
        </div>
      </div>
    </div>
  );
};
