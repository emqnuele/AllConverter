# AllConverter

A self-hosted file conversion service supporting images, audio, video and documents. All processing runs locally — no data leaves the machine.

---

## Stack

| Layer | Technology |
|---|---|
| API | FastAPI 0.110+ / Uvicorn (ASGI) |
| Frontend | Vite 5 / React 18 / TypeScript |
| Styling | Tailwind CSS 3 / CSS custom properties |
| Animations | Framer Motion 11 |
| Image processing | Pillow / pillow-heif |
| Audio / Video | FFmpeg via ffmpeg-python |
| Documents | PyPDF2, python-docx, ReportLab, Pandoc (optional) |

---

## Requirements

- Python 3.10 or later
- Node.js 18 or later
- FFmpeg installed and available on `PATH`
- Pandoc (optional — required only for advanced document conversions such as EPUB, LaTeX, reStructuredText)

### Installing FFmpeg

```bash
# Debian / Ubuntu
apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html and add to PATH
```

### Installing Pandoc (optional)

```bash
# Debian / Ubuntu
apt install pandoc

# macOS
brew install pandoc

# Windows
# Download from https://pandoc.org/installing.html
```

---

## Development

Clone the repository and run the provided script to start both servers concurrently:

```bash
git clone <repo-url>
cd AllConverter
pip install -r requirements.txt
./start-dev.sh
```

The script installs frontend dependencies on first run, then starts:

- FastAPI backend on `http://localhost:8000`
- Vite dev server on `http://localhost:5173` (with API proxy)

Interactive API documentation is available at `http://localhost:8000/docs`.

If you prefer to start the two processes manually:

```bash
# Terminal 1 — backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

---

## Production build

Build the frontend and start the backend. FastAPI serves the compiled assets directly.

```bash
cd frontend
npm run build          # outputs to frontend/dist/
cd ..
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The backend detects `frontend/dist/` at startup and mounts it automatically. No separate static file server or reverse proxy is required for single-host deployments.

For high-traffic deployments, place a reverse proxy (nginx, Caddy) in front of Uvicorn and configure it to serve `frontend/dist/` directly for asset paths.

---

## Deployment on Render

`render.yaml` is preconfigured. Connect the repository to Render — the build command installs Python and Node dependencies, builds the frontend, and starts Uvicorn.

---

## Project structure

```
AllConverter/
├── main.py                        # FastAPI application entry point
├── requirements.txt               # Python dependencies
├── render.yaml                    # Render.com deployment config
├── start-dev.sh                   # Development startup script
│
├── converters/
│   ├── base_converter.py          # Abstract base class
│   ├── converter_factory.py       # MIME-type-based converter routing
│   ├── image_converter.py         # Pillow-based image conversion
│   ├── audio_converter.py         # FFmpeg-based audio conversion
│   ├── video_converter.py         # FFmpeg-based video conversion
│   └── document_converter.py      # Multi-library document conversion
│
├── utils/
│   └── file_detection.py          # MIME type detection and categorisation
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── App.tsx                # Root component, step-driven state machine
        ├── index.css              # Tailwind base + CSS design tokens
        ├── api/client.ts          # Typed Axios API client
        ├── types/index.ts         # Shared TypeScript types
        ├── utils/fileUtils.ts     # File category detection, byte formatting
        └── components/
            ├── Header.tsx         # Navigation bar with theme toggle
            ├── DropZone.tsx       # Drag-and-drop upload area
            ├── FileList.tsx       # Selected files with remove / add-more
            ├── FormatSelector.tsx # Output format chip grid
            ├── ConversionOptions.tsx  # Collapsible advanced options panel
            ├── Progress.tsx       # Animated conversion progress indicator
            ├── Results.tsx        # Per-file download cards and bulk ZIP
            └── options/
                ├── Controls.tsx   # Shared form primitives (Slider, Select, Toggle)
                ├── ImageOptions.tsx
                ├── AudioOptions.tsx
                ├── VideoOptions.tsx
                └── DocumentOptions.tsx
```

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/formats` | Supported input/output formats per category |
| `POST` | `/api/convert` | Convert one or more files |
| `GET` | `/api/download/{session}/{file}` | Download a single converted file |
| `GET` | `/api/download-all/{session}` | Download all session files as ZIP |
| `DELETE` | `/api/session/{session}` | Delete session and all associated files |
| `GET` | `/api/history` | List past conversion sessions |

Full request/response schemas are documented in the OpenAPI UI at `/docs`.

### POST /api/convert — form fields

| Field | Type | Description |
|---|---|---|
| `files` | `File[]` | One or more input files (multipart) |
| `target_format` | `string` | Target extension, e.g. `webp`, `mp3`, `pdf` |
| `options` | `string` | JSON-encoded conversion options (see below) |

### Conversion options

**Images**

| Key | Type | Default | Description |
|---|---|---|---|
| `quality` | `int` | `95` | Output quality (1–100) |
| `resize` | `[int, int]` | — | Target width and height in pixels |
| `rotate` | `int` | — | Rotation angle in degrees |
| `flip` | `"horizontal" \| "vertical"` | — | Mirror axis |
| `filter` | `string` | — | `blur`, `sharpen`, `grayscale`, `contour`, `emboss`, ... |

**Audio**

| Key | Type | Default | Description |
|---|---|---|---|
| `bitrate` | `string` | auto | e.g. `128k`, `320k` |
| `sample_rate` | `int` | auto | e.g. `44100`, `48000` |
| `channels` | `int` | auto | `1` (mono) or `2` (stereo) |
| `volume_db` | `float` | — | Volume adjustment in dB |
| `normalize` | `bool` | `false` | Normalise audio levels |
| `start_ms` | `int` | — | Trim start position in milliseconds |
| `end_ms` | `int` | — | Trim end position in milliseconds |

**Video**

| Key | Type | Default | Description |
|---|---|---|---|
| `resolution` | `string` | original | e.g. `1920x1080`, `1280x720` |
| `fps` | `int` | original | Output frame rate |
| `video_bitrate` | `string` | auto | e.g. `2500k` |
| `audio_bitrate` | `string` | auto | e.g. `128k` |
| `codec` | `string` | auto | `libx264`, `libx265`, `libvpx-vp9` |
| `preset` | `string` | `medium` | Encoding speed preset |
| `rotation` | `int` | `0` | `90`, `180`, or `270` degrees |
| `mute` | `bool` | `false` | Strip audio track |
| `start_sec` | `float` | — | Trim start in seconds |
| `end_sec` | `float` | — | Trim end in seconds |

**Documents**

| Key | Type | Default | Description |
|---|---|---|---|
| `paper_size` | `string` | `A4` | `A4`, `Letter`, `Legal`, `A3` |
| `font_name` | `string` | `Helvetica` | Font family for PDF output |
| `font_size` | `int` | `12` | Font size in points |
| `margin_top` / `_bottom` / `_left` / `_right` | `int` | `20` | Page margins in mm |
| `include_toc` | `bool` | `false` | Generate table of contents |
| `encrypt_pdf` | `bool` | `false` | Password-protect the output PDF |
| `pdf_password` | `string` | — | Password (requires `encrypt_pdf: true`) |

---

## Supported formats

**Images** — input: `jpg jpeg png gif bmp tiff tif webp heic heif ico ppm pgm pbm pnm avif`
Output: `jpg jpeg png gif bmp tiff tif webp ico pdf ppm pgm pbm pnm`

**Audio** — input: `mp3 wav ogg flac aac m4a wma aiff alac opus ac3 amr`
Output: `mp3 wav ogg flac aac m4a opus`

**Video** — input: `mp4 avi mov wmv flv mkv webm m4v mpeg mpg 3gp vob ogv mts m2ts`
Output: `mp4 avi mov mkv webm gif mp3 ogg`

**Documents** — input/output: `pdf doc docx odt txt rtf html htm md markdown csv json xml epub* tex* rst* adoc*`
Formats marked with `*` require Pandoc.

---

## Troubleshooting

**HEIC/HEIF files fail to open**

Install the native libheif library:

```bash
# Debian / Ubuntu
apt-get install libheif-dev

# macOS
brew install libheif
```

**Document conversions produce no output**

Verify that Pandoc is installed and on `PATH` for formats that require it (EPUB, LaTeX, RST, AsciiDoc). For DOCX-to-PDF on Linux, `python-docx` generates a basic PDF using ReportLab as a fallback when LibreOffice is not present.

**Large video files time out**

Uvicorn's default request timeout is not set; the limit is determined by any upstream proxy. Adjust proxy read/write timeouts accordingly. For very large files, consider increasing `MAX_FILE_SIZE` in `main.py`.

---

## License

Open source. Use freely.
