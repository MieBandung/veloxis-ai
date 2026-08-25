"use client";

import React from "react";
import { FileText } from "lucide-react";

interface HeaderProps {
  isBackendOnline: boolean | null;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isBackendOnline, onRefresh }) => {
  const status =
    isBackendOnline === null
      ? { label: "Memeriksa...", dot: "bg-slate-300", text: "text-slate-500" }
      : isBackendOnline
        ? { label: "Server aktif", dot: "bg-emerald-500", text: "text-slate-600" }
        : { label: "Server tidak aktif", dot: "bg-amber-500", text: "text-amber-700" };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Veloxis AI</span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Periksa ulang koneksi server"
          className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
          <span className={status.text}>{status.label}</span>
        </button>
      </div>
    </header>
  );
};
