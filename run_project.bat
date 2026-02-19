@echo off
setlocal

echo ==========================================
echo   Starting CareerCoach AI (All-in-One)
echo ==========================================

:: 1. Start Backend (FastAPI)
echo [1/3] Starting Backend Server...
cd backend
if exist venv\Scripts\python.exe (
    echo Using venv python...
    start /b venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
) else (
    echo Warning: venv not found. Trying global python...
    start /b python -m uvicorn main:app --reload --port 8000
)
cd ..

:: 2. Start Frontend (Next.js)
echo [2/3] Starting Frontend Server...
start /b npm run dev

:: 3. Launch Default Browser
echo [3/3] Opening Dashboard in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo ==========================================
echo   Servers form running in background.
echo   Press Ctrl+C multiple times to stop or close this window.
echo ==========================================
pause
