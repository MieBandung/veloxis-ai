"use client";

import React, { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { ACCEPT_ATTRIBUTE, MAX_FILE_SIZE_MB } from "../lib/api";

interface UploadPanelProps {
  file: File | null;
  previewUrl: string | null;
  isProcessing: boolean;
  onSelectFile: (file: File) => void;
  onClearFile: () => void;
  onExtract: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  file,
  previewUrl,
  isProcessing,
  onSelectFile,
  onClearFile,
  onExtract,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => {
    if (!isProcessing) inputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onSelectFile(dropped);
  };

  const isPdf = file?.name.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <section className="bg-white rounded-lg border border-slate-200">
      <div className="px-5 py-3.5 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Dokumen</h2>
      </div>

      <div className="p-5 space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) onSelectFile(picked);
            e.target.value = ""; // allow re-picking the same file
          }}
        />

        {!file ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Pilih file dokumen untuk diunggah"
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPicker();
              }
            }}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed px-6 py-12 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
              isDragging
                ? "border-blue-600 bg-blue-50"
                : "border-slate-300 hover:border-blue-500 hover:bg-slate-50"
            }`}
          >
            <Upload className="w-7 h-7 text-slate-400 mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-900">
              Tarik file ke sini atau klik untuk memilih
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              PNG, JPG, WEBP, atau PDF &middot; maksimal {MAX_FILE_SIZE_MB} MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected file */}
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPdf ? "PDF" : file.type.replace("image/", "").toUpperCase()} &middot;{" "}
                  {formatSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClearFile}
                disabled={isProcessing}
                aria-label="Hapus file yang dipilih"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-slate-200 bg-slate-100 overflow-hidden">
              {previewUrl && !isPdf ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt={`Pratinjau dokumen ${file.name}`}
                  className="w-full max-h-[420px] object-contain bg-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <FileText className="w-9 h-9 text-slate-400 mb-2" aria-hidden="true" />
                  <p className="text-xs text-slate-500">
                    Pratinjau PDF tidak tersedia. File tetap akan diproses.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onExtract}
              disabled={isProcessing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Memproses...
                </>
              ) : (
                "Ekstrak Data Dokumen"
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
