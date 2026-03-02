import type { FileCategory, FileItem } from "../types";

/** Must match Settings.MAX_FILE_SIZE on the backend. */
export const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300 MB

export function fileToItem(file: File): FileItem {
  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    category: inferCategory(file),
  };
}

export function inferCategory(file: File): FileCategory | undefined {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const docExts = new Set([
    "pdf",
    "doc",
    "docx",
    "odt",
    "txt",
    "rtf",
    "html",
    "htm",
    "md",
    "markdown",
    "csv",
    "json",
    "xml",
    "epub",
    "tex",
    "rst",
    "adoc",
  ]);
  if (docExts.has(ext)) return "document";

  if (
    mime.startsWith("application/pdf") ||
    mime.includes("msword") ||
    mime.includes("officedocument") ||
    mime.startsWith("text/")
  )
    return "document";

  return undefined;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

