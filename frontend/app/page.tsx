'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return alert('Pilih file surat jalan dulu!');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Endpoint ke Backend FastAPI nanti
      const res = await fetch('http://localhost:8000/api/v1/extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Gagal mengekstrak dokumen!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">⚡ Veloxis AI</h1>
      <p className="text-slate-400 mb-8">Smart Logistics - Intelligent Document Processing</p>

      {/* Input File & Button */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-xl text-center">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Mengekstrak Data...' : 'Upload & Process Surat Jalan'}
        </button>
      </div>

      {/* Output Display */}
      {result && (
        <div className="mt-8 bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-xl">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Hasil Ekstraksi Data (JSON):</h2>
          <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm text-green-300 font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}