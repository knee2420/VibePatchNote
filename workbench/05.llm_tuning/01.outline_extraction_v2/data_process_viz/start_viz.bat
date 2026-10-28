@echo off
chcp 65001 > nul
echo ===================================================
echo   VibePatchNote — Outline V2 Input Data Visualizer
echo   포트: http://localhost:8089
echo ===================================================
python "%~dp0app.py"
pause
