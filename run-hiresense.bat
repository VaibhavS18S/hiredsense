@echo off
TITLE HireSense AI Launcher
echo =======================================================
echo          STARTING HIRESENSE AI PLATFORM
echo =======================================================
echo.

set PATH=C:\HCL_TRAINING\.tools\nodejs;%PATH%

echo [1/3] Starting Backend API Server (Port 5000)...
start "HireSense Backend Server (Port 5000)" cmd /k "cd /d C:\HCL_TRAINING\server && node src/server.js"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Dev Client (Port 5173)...
start "HireSense Frontend Client (Port 5173)" cmd /k "cd /d C:\HCL_TRAINING\client && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening HireSense AI in your browser...
start http://localhost:5173

echo.
echo =======================================================
echo  HIRESENSE AI IS NOW RUNNING!
echo  URL:         http://localhost:5173
echo  Credentials: recruiter@hiresense.ai / Password123!
echo =======================================================
echo Keep the backend and frontend console windows open.
pause
