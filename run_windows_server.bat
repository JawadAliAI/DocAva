@echo off
SETLOCAL EnableDelayedExpansion

echo ===================================================
echo     DIGITAL HUMAN - WINDOWS SERVER LAUNCHER
echo ===================================================

REM Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js LTS.
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.10+.
    pause
    exit /b 1
)

echo [INFO] Environment Check Passed.

echo [1/4] Installing Backend Dependencies...
cd apps\backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)

echo [2/4] Installing Python Requirements...
pip install -r requirements.txt
REM Ensure fallbacks are installed
pip install gTTS pyttsx3
if %errorlevel% neq 0 (
    echo [WARNING] Failed to install some Python packages. Checking critical ones...
)

echo [3/4] Building Frontend...
cd ..\frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)

echo [4/4] Starting Server...
cd ..\backend
echo.
echo Application will be running at: http://localhost:3000
echo (Press Ctrl+C to stop)
echo.

set PORT=3000
node server.js
