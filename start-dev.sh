#!/usr/bin/env bash
# Start AllConverter in development mode
# Backend:  http://localhost:8000
# Frontend: http://localhost:5173

set -e

# Install frontend deps if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies…"
  cd frontend && npm install && cd ..
fi

# Start FastAPI in background
echo "Starting FastAPI backend on :8000 …"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start Vite dev server
echo "Starting Vite dev server on :5173 …"
cd frontend && npm run dev &
FRONTEND_PID=$!

# Trap Ctrl+C to kill both
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo ""
echo "  AllConverter dev server running"
echo "  → Frontend: http://localhost:5173"
echo "  → API docs: http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

wait
