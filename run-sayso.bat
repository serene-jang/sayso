@echo off
setlocal
pushd "%~dp0"

title SAYSO Launcher

echo Starting SAYSO...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install Node.js LTS from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is not available.
  echo Reinstall Node.js LTS and run this file again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies. This may take a moment...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
  echo Created server\.env from server\.env.example.
  echo Add Azure OpenAI settings to server\.env to enable AI features.
)

echo Starting the SAYSO server...
start "SAYSO Server" /D "%~dp0" cmd.exe /k "npm start"
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

popd
endlocal
