@echo off
chcp 65001 > nul
echo ===================================================
echo   VibePatchNote — LLM Tuning Studio
echo   포트: http://localhost:8088
echo ===================================================
python "%~dp0app.py"
pause
