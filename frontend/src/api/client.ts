import axios from "axios";
import type { SupportedFormats, ConversionSession } from "../types";

const http = axios.create({ baseURL: "/api" });

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

export function downloadUrl(sessionId: string, filename: string): string {
  return `/api/download/${sessionId}/${encodeURIComponent(filename)}`;
}

export function downloadAllUrl(sessionId: string): string {
  return `/api/download-all/${sessionId}`;
}

export async function clearSession(sessionId: string): Promise<void> {
  await http.delete(`/session/${sessionId}`);
}
