@echo off
title MarginBoard — Dev Launcher

echo Starting MarginBoard...
echo.

:: Backend
start "MarginBoard — Backend :8000" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --port 8000"

:: Tunggu 2 detik supaya backend sempat bind port
timeout /t 2 /nobreak >nul

:: Frontend
start "MarginBoard — Frontend :3000" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both terminals are opening.
echo Backend  ^> http://localhost:8000/docs
echo Frontend ^> http://localhost:3000
echo.
pause
