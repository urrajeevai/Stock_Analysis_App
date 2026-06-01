@echo off
echo Restarting Trade Service (port 8082)...
echo.

set APP_DIR=%~dp0

REM Kill any existing process on port 8082
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8082 " ^| findstr "LISTENING"') do (
    echo Killing existing process on port 8082 (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 1 /nobreak >nul

echo Starting Trade Service...
start "Trade Service" cmd /k "cd /d %APP_DIR% && mvn -pl trade-service spring-boot:run"

echo.
echo Trade Service starting in a new window.
echo Wait ~15 seconds then refresh the browser at http://localhost:3000
echo.
