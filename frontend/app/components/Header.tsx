"use client";

import React from "react";
import { Server, ExternalLink, FileText, BookOpen } from "lucide-react";

interface HeaderProps {
  isBackendConnected: boolean | null;
  useMockBackend: boolean;
  setUseMockBackend: (val: boolean) => void;
  onRefreshBackend: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isBackendConnected,
  useMockBackend,
  setUseMockBackend,
  onRefreshBackend,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900">
                VELOXIS <span className="text-blue-600">AI</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Ekstraksi Surat Jalan
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Otomatisasi Pembacaan Dokumen Surat Jalan Inbound Gudang
            </p>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Backend Status */}
          <button
            onClick={onRefreshBackend}
            title="Klik untuk tes ulang koneksi backend"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline text-slate-500">API Backend:</span>
            {isBackendConnected === true ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Online
              </span>
            ) : isBackendConnected === false ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Mode Demo
              </span>
            ) : (
              <span className="text-slate-400">Checking...</span>
            )}
          </button>

          {/* Mode Demo Switcher */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium hidden sm:inline">Mode Demo:</span>
            <button
              onClick={() => setUseMockBackend(!useMockBackend)}
              className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                useMockBackend ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${
                  useMockBackend ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Swagger API Link */}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Dokumentasi API</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
};
