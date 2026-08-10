"use client";

import { useState } from "react";

interface Item {
  sku: string;
  nama_barang: string;
  qty: number;
  satuan: string;
  berat_kg: number;
}

interface ExtractionResult {
  nomor_dokumen: string;
  jenis_dokumen: string;
  nama_vendor: string;
  tanggal: string;
  items: Item[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/v1/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Gagal memproses dokumen");
      }

      const data: ExtractionResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengekstrak dokumen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 min-h-screen bg-gray-50/50">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Veloxis AI - Ekstraksi Dokumen Logistik
        </h1>
        <p className="text-gray-500 mt-1">
          Upload foto Surat Jalan atau Invoice untuk mengekstrak data secara otomatis via Vision AI.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kolom Kiri: Form Upload & Preview */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-white shadow-sm">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="file-upload"
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex flex-col items-center justify-center space-y-2"
            >
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {file ? file.name : "Klik untuk memilih gambar / dokumen"}
              </span>
              <span className="text-xs text-gray-400">PNG, JPG, WEBP hingga 10MB</span>
            </label>
          </div>

          {preview && (
            <div className="border rounded-lg p-2 bg-white shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-2">Preview Dokumen:</p>
              <img
                src={preview}
                alt="Preview Dokumen"
                className="w-full h-64 object-contain rounded"
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengekstrak via OpenRouter AI...</span>
              </>
            ) : (
              <span>Ekstrak Dokumen</span>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Hasil Ekstraksi */}
        <div>
          {result ? (
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-lg font-semibold text-gray-800">Detail Dokumen</h2>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Terproses
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Nomor Dokumen</span>
                  <span className="font-semibold text-gray-800">{result.nomor_dokumen || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Jenis Dokumen</span>
                  <span className="font-semibold text-gray-800">{result.jenis_dokumen || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Nama Vendor</span>
                  <span className="font-semibold text-gray-800">{result.nama_vendor || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Tanggal</span>
                  <span className="font-semibold text-gray-800">{result.tanggal || "-"}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Daftar Barang</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Nama Barang</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Satuan</th>
                        <th className="p-3">Berat (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.items && result.items.length > 0 ? (
                        result.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 font-mono text-xs">{item.sku || "-"}</td>
                            <td className="p-3 font-medium text-gray-800">{item.nama_barang || "-"}</td>
                            <td className="p-3">{item.qty}</td>
                            <td className="p-3">{item.satuan || "-"}</td>
                            <td className="p-3">{item.berat_kg}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400">
                            Tidak ada item terdeteksi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center text-gray-400 bg-white min-h-[300px] shadow-sm">
              <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium text-gray-500">Belum ada data ekstraksi</p>
              <p className="text-xs mt-1">Upload gambar dan klik "Ekstrak Dokumen" untuk melihat hasilnya di sini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}