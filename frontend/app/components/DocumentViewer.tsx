"use client";

import React, { useState, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Upload,
  FileText,
  CheckCircle2,
  Play,
  Loader2,
  FileCheck,
} from "lucide-react";
import { SampleDoc } from "../types";

interface DocumentViewerProps {
  samples: SampleDoc[];
  selectedSample: SampleDoc | null;
  uploadedFile: File | null;
  previewUrl: string | null;
  fileName: string | null;
  isProcessing: boolean;
  onSelectSample: (sample: SampleDoc) => void;
  onFileUpload: (file: File) => void;
  onStartExtract: () => void;
  canExtract: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  samples,
  selectedSample,
  uploadedFile,
  previewUrl,
  fileName,
  isProcessing,
  onSelectSample,
  onFileUpload,
  onStartExtract,
  canExtract,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 180));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 70));
  const handleZoomReset = () => setZoomLevel(100);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header & Sample Surat Jalan Selector */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Dokumen Surat Jalan
          </h2>
          <span className="text-[11px] text-slate-500">Pilih sampel atau upload</span>
        </div>

        {/* 4 Surat Jalan Samples */}
        <div className="grid grid-cols-2 gap-2">
          {samples.map((sample) => {
            const isSelected = selectedSample?.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                disabled={isProcessing}
                onClick={() => onSelectSample(sample)}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 text-slate-900 ring-1 ring-blue-600/30"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="font-semibold text-blue-600 font-mono">Surat Jalan</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
                <p className="text-xs font-semibold text-slate-800 truncate">{sample.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{sample.vendor}</p>
              </button>
            );
          })}
        </div>

        {/* Drag and Drop File Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-dashed transition cursor-pointer text-xs ${
            uploadedFile
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30 text-slate-600"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
          <div className="flex items-center gap-2 truncate">
            {uploadedFile ? (
              <>
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-emerald-900 truncate">
                  {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(0)} KB)
                </span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Upload file Surat Jalan (PDF / Gambar) atau <span className="text-blue-600 font-semibold underline">browse</span>
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">.PDF / .JPG / .PNG</span>
        </div>
      </div>

      {/* Viewer Toolbar */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-700 w-10 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-0.5 rounded hover:bg-slate-100 text-[11px] text-slate-600 transition cursor-pointer ml-1"
          >
            Reset
          </button>
        </div>

        <div className="truncate max-w-[220px] text-xs font-mono text-slate-600">
          {fileName || "Surat Jalan"}
        </div>
      </div>

      {/* Document Canvas Preview */}
      <div className="relative flex-1 bg-slate-100 min-h-[360px] lg:min-h-[460px] overflow-auto flex items-center justify-center p-4">
        {previewUrl ? (
          <div
            className="relative transition-transform duration-150 ease-out origin-center rounded-lg border border-slate-300 bg-white shadow-md overflow-hidden"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <img
              src={previewUrl}
              alt="Pratinjau Surat Jalan"
              className="max-h-[520px] w-auto object-contain select-none pointer-events-none"
              draggable={false}
            />

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20">
                <div className="w-9 h-9 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mb-3" />
                <p className="text-sm font-bold text-slate-900">
                  Mengekstrak Surat Jalan...
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Membaca nomor surat jalan, vendor, dan rincian barang
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 space-y-2">
            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              Pilih contoh surat jalan di atas atau upload file dari komputer Anda.
            </p>
          </div>
        )}
      </div>

      {/* Extraction Trigger Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Ekstraksi otomatis: No. SJ, Vendor, SKU, Qty, Satuan & Berat
        </span>

        <button
          type="button"
          disabled={!canExtract || isProcessing}
          onClick={onStartExtract}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs ${
            canExtract && !isProcessing
              ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-98"
              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengekstrak...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Ekstraksi Surat Jalan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
