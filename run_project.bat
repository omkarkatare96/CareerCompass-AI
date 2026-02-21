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
if not exist node_modules (
    echo node_modules not found. Installing dependencies...
    call npm install
)

:: Ensure local binaries are used
start /b cmd /c "npm run dev"

:: 3. Launch Default Browser
echo [3/3] Opening Dashboard in 5 seconds...
:: Use ping as a fallback for timeout if it doesn't work
ping 127.0.0.1 -n 6 > nul
start http://localhost:3000

echo ==========================================
echo   Servers form running in background.
echo   Press Ctrl+C multiple times to stop or close this window.
echo ==========================================
pause
