# Start AllConverter in development mode
# Backend:  http://localhost:8000
# Frontend: http://localhost:5173

$ErrorActionPreference = "Stop"

# ── Resolve uvicorn command ────────────────────────────────────────────────
# Resolution order:
#   1. uv run uvicorn         (uv-managed project)
#   2. uvicorn                (standalone binary on PATH)
#   3. python -m uvicorn      (venv activated, binary not on PATH)
$uvicornArgs = $null

if (Get-Command uv -ErrorAction SilentlyContinue) {
    $test = uv run uvicorn --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $uvicornArgs = @("run", "uvicorn")
        $uvicornExe  = "uv"
    }
}

if (-not $uvicornArgs) {
    if (Get-Command uvicorn -ErrorAction SilentlyContinue) {
        $uvicornExe  = "uvicorn"
        $uvicornArgs = @()
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        $test = python -m uvicorn --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $uvicornExe  = "python"
            $uvicornArgs = @("-m", "uvicorn")
        }
    }
}

if (-not $uvicornArgs -and $uvicornExe -ne "uvicorn") {
    Write-Error "Error: uvicorn not found.`nWith uv:  uv add uvicorn`nWith pip: pip install uvicorn"
    exit 1
}

# ── Install frontend deps if needed ───────────────────────────────────────
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..."
    Push-Location frontend
    cmd /c npm install
    Pop-Location
}

# ── Start FastAPI ──────────────────────────────────────────────────────────
Write-Host "Starting FastAPI backend on :8000 ..."
$backendArgs = $uvicornArgs + @("main:app", "--host", "0.0.0.0", "--port", "8000", "--reload")
$backend = Start-Process -FilePath $uvicornExe -ArgumentList $backendArgs -PassThru -NoNewWindow

# ── Start Vite ────────────────────────────────────────────────────────────
# On Windows, npm is a .cmd script so it must be invoked via cmd.exe
Write-Host "Starting Vite dev server on :5173 ..."
$frontend = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npm run dev") -WorkingDirectory "$PWD\frontend" -PassThru -NoNewWindow

Write-Host ""
Write-Host "  AllConverter running"
Write-Host "  Frontend : http://localhost:5173"
Write-Host "  API docs : http://localhost:8000/docs"
Write-Host ""
Write-Host "  Press Ctrl+C to stop"
Write-Host ""

# ── Wait and cleanup on Ctrl+C ────────────────────────────────────────────
try {
    Wait-Process -Id $backend.Id, $frontend.Id
} finally {
    Stop-Process -Id $backend.Id  -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -ErrorAction SilentlyContinue
}
