#!/usr/bin/env bash
# Start AllConverter in development mode
# Backend:  http://localhost:8000
# Frontend: http://localhost:5173

set -e

# ── Resolve uvicorn command ────────────────────────────────────────────────
# Prefer the standalone binary; fall back to `python -m uvicorn` so the
# script works whether or not the venv bin/ is on PATH.
if command -v uvicorn &>/dev/null; then
  UVICORN="uvicorn"
elif python -m uvicorn --version &>/dev/null 2>&1; then
  UVICORN="python -m uvicorn"
elif python3 -m uvicorn --version &>/dev/null 2>&1; then
  UVICORN="python3 -m uvicorn"
else
  echo "Error: uvicorn not found."
  echo "Install it with:  pip install uvicorn"
  exit 1
fi

# ── Install frontend deps if needed ───────────────────────────────────────
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# ── Start FastAPI ──────────────────────────────────────────────────────────
echo "Starting FastAPI backend on :8000 ..."
$UVICORN main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# ── Start Vite ────────────────────────────────────────────────────────────
echo "Starting Vite dev server on :5173 ..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# ── Cleanup on exit ───────────────────────────────────────────────────────
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo ""
echo "  AllConverter running"
echo "  Frontend : http://localhost:5173"
echo "  API docs : http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

wait
