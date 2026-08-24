"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { UploadPanel } from "./components/UploadPanel";
import { ResultPanel } from "./components/ResultPanel";
import { checkHealth, extractDocument, validateFile } from "./lib/api";
import { ExtractedData, Stage } from "./types";

export default function Home() {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [data, setData] = useState<ExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshHealth = useCallback(async () => {
    setIsBackendOnline(await checkHealth());
  }, []);

  // Probe the backend once on mount; state is set in the async callback, and
  // skipped if the component unmounted while the request was in flight.
  useEffect(() => {
    let cancelled = false;
    checkHealth().then((online) => {
      if (!cancelled) setIsBackendOnline(online);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Release the object URL whenever it is replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSelectFile = (selected: File) => {
    const problem = validateFile(selected);
    if (problem) {
      setFile(null);
      setPreviewUrl(null);
      setData(null);
      setStage("error");
      setErrorMessage(problem);
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setData(null);
    setErrorMessage(null);
    setStage("idle");
  };

  const handleClearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setData(null);
    setErrorMessage(null);
    setStage("idle");
  };

  const handleExtract = async () => {
    if (!file) return;

    setStage("processing");
    setErrorMessage(null);

    try {
      const result = await extractDocument(file);
      setData(result);
      setStage("result");
      setIsBackendOnline(true);
    } catch (err) {
      setData(null);
      setErrorMessage(err instanceof Error ? err.message : "Dokumen gagal diproses.");
      setStage("error");
      refreshHealth();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header isBackendOnline={isBackendOnline} onRefresh={refreshHealth} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-900">Ekstraksi Dokumen Surat Jalan</h1>
          <p className="text-sm text-slate-600 mt-1">
            Unggah surat jalan, faktur, atau delivery order. Sistem membaca isinya dan
            menampilkan datanya dalam bentuk terstruktur.
          </p>
        </div>

        {isBackendOnline === false && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            Server ekstraksi sedang tidak dapat dihubungi. Dokumen belum bisa diproses.
          </div>
        )}

        {/* Desktop: document left, result right. Mobile: stacked in the same order. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <UploadPanel
            file={file}
            previewUrl={previewUrl}
            isProcessing={stage === "processing"}
            onSelectFile={handleSelectFile}
            onClearFile={handleClearFile}
            onExtract={handleExtract}
          />
          <ResultPanel stage={stage} data={data} errorMessage={errorMessage} />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-xs text-slate-500">
          Veloxis AI — Ekstraksi dokumen inbound gudang
        </div>
      </footer>
    </div>
  );
}
