"use client";

import React, { useState } from "react";
import { AlertTriangle, Check, Copy, FileSearch, Loader2 } from "lucide-react";
import { ExtractedData, Stage } from "../types";

interface ResultPanelProps {
  stage: Stage;
  data: ExtractedData | null;
  errorMessage: string | null;
}

const EMPTY = "Tidak terbaca";

function textOrEmpty(value: string | null): { text: string; missing: boolean } {
  const trimmed = (value ?? "").trim();
  return trimmed ? { text: trimmed, missing: false } : { text: EMPTY, missing: true };
}

function numberOrDash(value: number | null): string {
  return value === null || Number.isNaN(value) ? "—" : value.toLocaleString("id-ID");
}

const Field: React.FC<{ label: string; value: string | null; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => {
  const { text, missing } = textOrEmpty(value);
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd
        className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${
          missing ? "text-slate-400 italic" : "font-medium text-slate-900"
        }`}
      >
        {text}
      </dd>
    </div>
  );
};

export const ResultPanel: React.FC<ResultPanelProps> = ({ stage, data, errorMessage }) => {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shell = (children: React.ReactNode) => (
    <section className="bg-white rounded-lg border border-slate-200 h-full">{children}</section>
  );

  if (stage === "processing") {
    return shell(
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center text-center px-6 py-20"
      >
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-4" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">Membaca dokumen...</p>
        <p className="text-xs text-slate-500 mt-1.5">
          Mengambil nomor dokumen, vendor, tanggal, dan daftar barang.
        </p>
      </div>
    );
  }

  if (stage === "error") {
    return shell(
      <div role="alert" className="flex flex-col items-center justify-center text-center px-6 py-20">
        <AlertTriangle className="w-6 h-6 text-amber-600 mb-4" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">Dokumen gagal diproses</p>
        <p className="text-xs text-slate-600 mt-1.5 max-w-sm leading-relaxed">{errorMessage}</p>
      </div>
    );
  }

  if (stage === "idle" || !data) {
    return shell(
      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <FileSearch className="w-6 h-6 text-slate-300 mb-4" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">Belum ada dokumen</p>
        <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
          Unggah dokumen di sebelah kiri, lalu klik &ldquo;Ekstrak Data Dokumen&rdquo;.
        </p>
      </div>
    );
  }

  const items = data.items ?? [];
  const missingCount = [
    data.nomor_dokumen,
    data.jenis_dokumen,
    data.nama_vendor,
    data.nama_penerima,
    data.tanggal,
  ].filter((v) => !(v ?? "").trim()).length;

  const totalQty = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
  const totalWeight = items.reduce((sum, i) => sum + (Number(i.berat_kg) || 0), 0);

  return shell(
    <div className="flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Hasil Ekstraksi</h2>
        <button
          type="button"
          onClick={() => setShowJson((v) => !v)}
          aria-pressed={showJson}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          {showJson ? "Sembunyikan JSON" : "Lihat JSON"}
        </button>
      </div>

      {/* Needs-review notice, shown only when the model left fields empty */}
      {(missingCount > 0 || items.length === 0) && (
        <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-amber-900 leading-relaxed">
            {items.length === 0
              ? "Tidak ada baris barang yang terbaca. Periksa dokumen secara manual."
              : `${missingCount} informasi tidak terbaca. Periksa kembali sebelum digunakan.`}
          </p>
        </div>
      )}

      {/* Document header fields */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-5 py-4">
        <Field label="Nomor Dokumen" value={data.nomor_dokumen} mono />
        <Field label="Jenis Dokumen" value={data.jenis_dokumen} />
        <Field label="Vendor / Pengirim" value={data.nama_vendor} />
        <Field label="Penerima" value={data.nama_penerima} />
        <Field label="Tanggal" value={data.tanggal} mono />
        {data.grand_total !== null && (
          <Field label="Total Nilai" value={numberOrDash(data.grand_total)} mono />
        )}
      </dl>

      {/* Items */}
      <div className="border-t border-slate-200">
        <div className="px-5 py-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Daftar Barang
          </h3>
          <span className="text-xs text-slate-500">{items.length} baris</span>
        </div>

        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Rincian barang yang terbaca dari dokumen</caption>
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-xs text-slate-600">
                  <th scope="col" className="text-left font-medium px-5 py-2.5">
                    SKU
                  </th>
                  <th scope="col" className="text-left font-medium px-3 py-2.5">
                    Nama Barang
                  </th>
                  <th scope="col" className="text-right font-medium px-3 py-2.5">
                    Qty
                  </th>
                  <th scope="col" className="text-left font-medium px-3 py-2.5">
                    Satuan
                  </th>
                  <th scope="col" className="text-right font-medium px-5 py-2.5">
                    Berat (kg)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {item.sku ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-900">{item.nama_barang ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-900 whitespace-nowrap">
                      {numberOrDash(item.qty)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {item.satuan ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-slate-900 whitespace-nowrap">
                      {numberOrDash(item.berat_kg)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {items.length > 1 && (
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50 text-xs">
                    <td className="px-5 py-2.5 font-medium text-slate-600" colSpan={2}>
                      Total
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900">
                      {totalQty.toLocaleString("id-ID")}
                    </td>
                    <td />
                    <td className="px-5 py-2.5 text-right font-mono font-semibold text-slate-900">
                      {totalWeight.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Raw JSON, secondary by design */}
      {showJson && (
        <div className="border-t border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Data mentah (JSON)</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Salin
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3.5 text-xs leading-relaxed text-slate-100">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
