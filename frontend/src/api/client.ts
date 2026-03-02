import axios from "axios";
import type { SupportedFormats, ConversionSession } from "../types";


const http = axios.create({
  baseURL: "/api",
  headers: {
    "X-Requested-With": "AllConverter",
  },
});

export async function getFormats(): Promise<SupportedFormats> {
  const { data } = await http.get<SupportedFormats>("/formats");
  return data;
}

export async function convertFiles(
  files: File[],
  targetFormat: string,
  options: Record<string, unknown>,
  onProgress?: (pct: number) => void
): Promise<ConversionSession> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  form.append("target_format", targetFormat);
  form.append("options", JSON.stringify(options));

  const { data } = await http.post<ConversionSession>("/convert", form, {
    onUploadProgress(e) {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return data;
}

export function downloadUrl(sessionId: string, filename: string, token?: string): string {
  const base = `/api/download/${sessionId}/${encodeURIComponent(filename)}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export function downloadAllUrl(sessionId: string, token?: string): string {
  const base = `/api/download-all/${sessionId}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export async function clearSession(sessionId: string, token?: string): Promise<void> {
  const params = token ? `?token=${encodeURIComponent(token)}` : "";
  await http.delete(`/session/${sessionId}${params}`);
}
