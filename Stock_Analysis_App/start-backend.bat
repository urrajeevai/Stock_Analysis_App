@echo off
echo Starting StockTrack Backend Services...
echo.

set APP_DIR=%~dp0

echo [1/7] Starting Auth Service (port 8081)...
start "Auth Service" cmd /k "cd /d %APP_DIR% && mvn -pl auth-service spring-boot:run"
timeout /t 2 /nobreak >nul

echo [2/7] Starting Trade Service (port 8082)...
start "Trade Service" cmd /k "cd /d %APP_DIR% && mvn -pl trade-service spring-boot:run"
timeout /t 2 /nobreak >nul

echo [3/7] Starting Analysis Service (port 8083)...
start "Analysis Service" cmd /k "cd /d %APP_DIR% && mvn -pl analysis-service spring-boot:run"
timeout /t 2 /nobreak >nul

echo [4/7] Starting Price-Alert Service (port 8084)...
start "Price-Alert Service" cmd /k "cd /d %APP_DIR% && mvn -pl price-alert-service spring-boot:run"
timeout /t 2 /nobreak >nul

echo [5/7] Starting Performance Service (port 8085)...
start "Performance Service" cmd /k "cd /d %APP_DIR% && mvn -pl performance-service spring-boot:run"
timeout /t 2 /nobreak >nul

echo [6/7] Starting Momentum Service (port 8086)...
start "Momentum Service" cmd /k "cd /d %APP_DIR% && mvn -pl momentum-service spring-boot:run"
timeout /t 2 /nobreak >nul

echo [7/8] Starting RSI Service (port 8087)...
start "RSI Service" cmd /k "cd /d %APP_DIR% && mvn -pl rsi-service spring-boot:run"
timeout /t 2 /nobreak >nul

echo [8/8] Starting API Gateway (port 8080)...
start "API Gateway" cmd /k "cd /d %APP_DIR% && mvn -pl api-gateway spring-boot:run"

echo.
echo All 8 services starting in separate windows.
echo Wait ~30 seconds for all services to finish startup.
echo.
echo Gateway:         http://localhost:8080
echo Momentum Swagger: http://localhost:8086/swagger-ui.html
echo RSI Swagger:     http://localhost:8087/swagger-ui.html
echo Frontend:        http://localhost:3000 (run: cd frontend && npm run dev)
echo.
pause
