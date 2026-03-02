export type FileCategory = "image" | "audio" | "video" | "document";

export interface FormatGroup {
  input: string[];
  output: string[];
}

export interface SupportedFormats {
  image: FormatGroup;
  audio: FormatGroup;
  video: FormatGroup;
  document: FormatGroup;
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  category?: FileCategory;
}

export interface ConversionResult {
  original_name: string;
  output_filename: string;
  success: boolean;
  size?: number;
  error?: string;
}

export interface ConversionSession {
  session_id: string;
  target_format: string;
  results: ConversionResult[];
  total: number;
  successful: number;
  /** One-time secret returned by /convert — required for all download/delete calls. */
  download_token?: string;
}

// ── Option shapes ────────────────────────────────────────────────────────────

export interface ImageOptions {
  quality?: number;
  resize?: [number, number] | number;
  rotate?: number;
  flip?: "horizontal" | "vertical" | "";
  filter?: string;
}

export interface AudioOptions {
  bitrate?: string;
  sample_rate?: number;
  channels?: number;
  volume_db?: number;
  normalize?: boolean;
  start_ms?: number;
  end_ms?: number;
}

export interface VideoOptions {
  video_bitrate?: string;
  audio_bitrate?: string;
  resolution?: string;
  fps?: number;
  rotation?: number;
  codec?: string;
  preset?: string;
  mute?: boolean;
  extract_audio?: boolean;
  start_sec?: number;
  end_sec?: number;
}

export interface DocumentOptions {
  paper_size?: string;
  margin_top?: number;
  margin_bottom?: number;
  margin_left?: number;
  margin_right?: number;
  font_name?: string;
  font_size?: number;
  include_toc?: boolean;
  encrypt_pdf?: boolean;
  pdf_password?: string;
}

export type ConversionOptions =
  | ImageOptions
  | AudioOptions
  | VideoOptions
  | DocumentOptions
  | Record<string, unknown>;
