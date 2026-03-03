# AllConverter

This is a small project i made a long time ago and now completely refactored to test [Claude Code](https://claude.ai/code), an AI coding tool by Anthropic. This is really simple: i threw a realistic project i did at it and see how far it could take me.

AllConverter is a file converter for images, audio, video and documents. Nothing groundbreaking, just a good enough excuse to stress-test the tool. The UI was almost entirely designed and iterated through Claude Code, including the dark glassmorphism look, all the custom form controls, and the component architecture.

It's not meant to be a product or anything production-grade. Take it as what it is, an experiment!

*— ema*

---

## Stack

| Layer | Technology |
|---|---|
| API | FastAPI / Uvicorn (ASGI) |
| Frontend | Vite 5 / React 18 / TypeScript |
| Styling | Tailwind CSS 3 / CSS custom properties |
| Animations | Framer Motion 11 |
| Image processing | Pillow, pillow-heif, PyMuPDF, cairosvg, svglib |
| Audio / Video | FFmpeg (bundled via static-ffmpeg) |
| Documents | pypdf ≥ 4, python-docx, pdf2docx, ReportLab, WeasyPrint, openpyxl, python-pptx, LibreOffice (optional), Pandoc (optional) |

---

## Requirements

- Python 3.13+
- Node.js 18+
- FFmpeg — **not required on `PATH`** by default; the app bundles it automatically via `static-ffmpeg`. Set `USE_STATIC_FFMPEG=false` in `.env` if you prefer to manage your own FFmpeg installation.
- Pandoc (optional, enables EPUB, LaTeX, RST, AsciiDoc, Org and ODS conversions)
- LibreOffice (optional, improves DOCX/ODT/PPTX → PDF quality)

### Installing Pandoc (optional)

```bash
# Debian / Ubuntu
apt install pandoc

# macOS
brew install pandoc

# Windows
# Download from https://pandoc.org/installing.html
```

### Installing LibreOffice (optional)

```bash
# Debian / Ubuntu
apt install libreoffice

# macOS
brew install --cask libreoffice

# Windows
# Download from https://www.libreoffice.org/download/download/
```

---

## Running in dev mode

Two scripts are provided, pick the one for your shell.

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

- FastAPI backend at `http://localhost:8000`
- Vite dev server at `http://localhost:5173` (proxies `/api` to the backend)


**Manual startup**

```bash
# Terminal 1 — backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

---

## Production build

Build the frontend, then start Uvicorn. FastAPI picks up `frontend/dist/` automatically and serves it as static files.

```bash
cd frontend
npm run build
cd ..
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

For higher traffic, put nginx or Caddy in front and have it serve `frontend/dist/` directly for static assets.

---

## Project structure

```
AllConverter/
├── main.py
├── requirements.txt
├── start-dev.sh
├── start-dev.ps1
│
├── app/
│   ├── config.py
│   ├── models.py
│   ├── ratelimit.py
│   ├── converters/
│   │   ├── _ffmpeg.py
│   │   ├── base.py
│   │   ├── factory.py
│   │   ├── image.py
│   │   ├── audio.py
│   │   ├── video.py
│   │   └── document.py
│   ├── routes/
│   │   ├── convert.py
│   │   ├── download.py
│   │   └── formats.py
│   └── utils/
│       ├── cleanup.py
│       ├── detection.py
│       └── options.py
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


### POST /api/convert

| Field | Type | Description |
|---|---|---|
| `files` | `File[]` | One or more input files (multipart), up to 20 files / 300 MB each |
| `target_format` | `string` | Target extension, e.g. `webp`, `mp3`, `pdf` |
| `options` | `string` | JSON-encoded conversion options |

**Rate limit:** 20 requests/minute per IP.

Download endpoints require the `token` query parameter returned in the `/api/convert` response.

---

## Supported formats

**Images**
- Input: `jpg jpeg png gif bmp tiff tif webp heic heif ico ppm pgm pbm pnm avif svg`¹
- Output: `jpg jpeg png gif bmp tiff tif webp ico pdf ppm pgm pbm pnm avif`

**Audio**
- Input: `mp3 wav ogg flac aac m4a wma aiff alac opus ac3 amr`
- Output: `mp3 wav ogg flac aac m4a opus`

**Video**
- Input: `mp4 avi mov wmv flv mkv webm m4v mpeg mpg 3gp vob ogv mts m2ts`
- Output: `mp4 avi mov mkv webm flv gif mp3 ogg aac flac wav`

**Documents**
- Input: `pdf docx doc odt txt rtf html htm md csv json xml xlsx xls`² `pptx`³ `epub tex org rst adoc ods`⁴
- Output: `pdf docx txt html md csv json xml xlsx`² `epub tex org rst odt rtf`⁴

¹ SVG input requires at least one of: cairosvg, svglib, or PyMuPDF.  
² `xlsx`/`xls` input and `xlsx` output require openpyxl.  
³ `pptx` input requires python-pptx or LibreOffice.  
⁴ `epub`, `tex`, `org`, `rst`, `adoc`, `ods` require Pandoc.

---

## Troubleshooting

**HEIC/HEIF files fail to open**

```bash
# Debian / Ubuntu
apt-get install libheif-dev

# macOS
brew install libheif
```

**Document conversions produce no output**

Make sure Pandoc is on `PATH` for formats that need it (EPUB, LaTeX, RST, AsciiDoc, Org).
For better DOCX/ODT/PPTX → PDF quality, install LibreOffice.

**Large video files time out**

If you have a reverse proxy in front, increase its read/write timeouts. For very large files, set `MAX_FILE_SIZE` in a `.env` file (default: 300 MB).

---

## License

Open source. Use freely.
