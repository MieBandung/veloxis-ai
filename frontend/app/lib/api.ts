import { ExtractedData } from "../types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");
export const MAX_FILE_SIZE_MB = 10;

/**
 * Backend error codes translated into language a warehouse operator can act on.
 * Raw backend text is never shown; unknown codes fall back to a generic message.
 */
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE:
    "Format file tidak didukung. Gunakan file PNG, JPG, WEBP, atau PDF.",
  EMPTY_FILE: "File yang diunggah kosong. Silakan pilih file lain.",
  FILE_TOO_LARGE: `Ukuran file melebihi ${MAX_FILE_SIZE_MB} MB. Gunakan file yang lebih kecil.`,
  UNREADABLE_DOCUMENT:
    "Dokumen tidak dapat dibaca. File mungkin rusak, terkunci, atau bukan dokumen yang valid.",
  INVALID_MODEL_OUTPUT:
    "Isi dokumen tidak terbaca dengan jelas. Coba unggah hasil scan atau foto yang lebih tajam.",
  MODEL_UNAVAILABLE:
    "Sistem ekstraksi belum siap. Tunggu sebentar, lalu coba lagi.",
  INFERENCE_FAILURE:
    "Terjadi kendala saat memproses dokumen. Silakan coba lagi.",
  INTERNAL_SERVER_ERROR:
    "Terjadi kendala pada server. Silakan coba lagi beberapa saat lagi.",
  NETWORK_ERROR:
    "Tidak dapat terhubung ke server ekstraksi. Periksa koneksi, lalu coba lagi.",
};

const FALLBACK_MESSAGE =
  "Dokumen gagal diproses. Silakan coba lagi atau gunakan file lain.";

export function messageForCode(code: string): string {
  return ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}

/** Client-side pre-check so obvious mistakes never need a round trip. */
export function validateFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return ERROR_MESSAGES.INVALID_FILE;
  }
  if (file.size === 0) {
    return ERROR_MESSAGES.EMPTY_FILE;
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return ERROR_MESSAGES.FILE_TOO_LARGE;
  }
  return null;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Uploads a document and returns the extracted data, or throws a readable message. */
export async function extractDocument(file: File): Promise<ExtractedData> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/extract`, { method: "POST", body: formData });
  } catch {
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.success) {
    throw new Error(messageForCode(payload?.error?.code ?? ""));
  }

  return payload.data as ExtractedData;
}
