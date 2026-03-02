# AllConverter

This is a small experiment I built to test [Claude Code](https://claude.ai/code) — an AI coding tool by Anthropic. The idea was simple: throw a realistic project at it and see how far it could take me.

AllConverter is a file converter for images, audio, video and documents. Nothing groundbreaking, just a good enough excuse to stress-test the tool. The UI was almost entirely designed and iterated through Claude Code, including the dark glassmorphism look, all the custom form controls, and the component architecture.

It's not meant to be a product or anything production-grade. It's a dev experiment — take it as such.

— *ema*

---

## Stack

| Layer | Technology |
|---|---|
| API | FastAPI / Uvicorn (ASGI) |
| Frontend | Vite 5 / React 18 / TypeScript |
| Styling | Tailwind CSS 3 / CSS custom properties |
| Animations | Framer Motion 11 |
| Image processing | Pillow / pillow-heif |
| Audio / Video | FFmpeg via ffmpeg-python |
| Documents | PyPDF2, python-docx, ReportLab, Pandoc (optional) |

---

## Requirements

- Python 3.10+
- Node.js 18+
- FFmpeg on `PATH`
- Pandoc (optional — only needed for EPUB, LaTeX, RST, AsciiDoc conversions)

### Installing FFmpeg

```bash
# Debian / Ubuntu
apt install ffmpeg

# macOS
brew install ffmpeg

# Windows — download from https://ffmpeg.org/download.html and add to PATH
```

### Installing Pandoc (optional)

```bash
# Debian / Ubuntu
apt install pandoc

# macOS
brew install pandoc

# Windows — download from https://pandoc.org/installing.html
```

---

## Running in dev mode

Two convenience scripts are provided — pick the one that matches your shell.

**macOS / Linux / WSL**

```bash
git clone https://github.com/emqnuele/AllConverter.git
cd AllConverter
pip install -r requirements.txt
./start-dev.sh
```

**Windows (PowerShell)**

```powershell
git clone https://github.com/emqnuele/AllConverter.git
cd AllConverter
pip install -r requirements.txt
.\start-dev.ps1
```

Both scripts install frontend deps on first run, then start:

- FastAPI backend → `http://localhost:8000`
- Vite dev server → `http://localhost:5173` (proxies `/api` to the backend)

Interactive API docs are available at `http://localhost:8000/docs`.

**Manual startup (if you prefer)**

```bash
# Terminal 1 — backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

---

## Production build

Build the frontend, then start Uvicorn. FastAPI picks up `frontend/dist/` automatically and serves it.

```bash
cd frontend
npm run build        # outputs to frontend/dist/
cd ..
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

For high-traffic setups, put nginx or Caddy in front and have it serve `frontend/dist/` directly for static assets.

---

## Project structure

```
AllConverter/
├── main.py                        # FastAPI entry point
├── requirements.txt
├── start-dev.sh                   # Dev startup (bash)
├── start-dev.ps1                  # Dev startup (PowerShell)
│
├── converters/
│   ├── base_converter.py
│   ├── converter_factory.py
│   ├── image_converter.py
│   ├── audio_converter.py
│   ├── video_converter.py
│   └── document_converter.py
│
├── utils/
│   └── file_detection.py
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── App.tsx
        ├── index.css
        ├── api/client.ts
        ├── types/index.ts
        ├── utils/fileUtils.ts
        ├── hooks/useHistory.ts
        └── components/
            ├── Header.tsx
            ├── DropZone.tsx
            ├── FileList.tsx
            ├── FormatSelector.tsx
            ├── ConversionOptions.tsx
            ├── Progress.tsx
            ├── Results.tsx
            ├── Footer.tsx
            ├── RecentHistory.tsx
            └── options/
                ├── Controls.tsx
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
| `DELETE` | `/api/session/{session}` | Delete session and associated files |

Full schemas at `/docs`.

### POST /api/convert — fields

| Field | Type | Description |
|---|---|---|
| `files` | `File[]` | One or more input files (multipart) |
| `target_format` | `string` | Target extension, e.g. `webp`, `mp3`, `pdf` |
| `options` | `string` | JSON-encoded conversion options |

---

## Supported formats

**Images** — `jpg jpeg png gif bmp tiff webp heic heif ico ppm pgm pbm avif` → `jpg png gif bmp tiff webp ico pdf ppm`

**Audio** — `mp3 wav ogg flac aac m4a wma aiff opus ac3 amr` → `mp3 wav ogg flac aac m4a opus`

**Video** — `mp4 avi mov wmv flv mkv webm m4v mpeg 3gp ogv mts` → `mp4 avi mov mkv webm gif mp3 ogg`

**Documents** — `pdf doc docx odt txt rtf html md csv json xml epub* tex* rst* adoc*`
Formats marked `*` require Pandoc.

---

## Troubleshooting

**HEIC/HEIF files fail**

```bash
# Debian / Ubuntu
apt-get install libheif-dev

# macOS
brew install libheif
```

**Document conversions produce no output**

Check that Pandoc is on `PATH` for formats that need it (EPUB, LaTeX, RST, AsciiDoc).

**Large video files time out**

Increase proxy read/write timeouts if you have a reverse proxy in front. For very large files, check `MAX_FILE_SIZE` in `main.py`.

---

## License

Open source. Use freely.
