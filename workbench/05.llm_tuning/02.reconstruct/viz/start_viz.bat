@echo off
chcp 65001 > nul
echo ========================================================
echo   02. Reconstruct Visualizer Studio (:8090)
echo   Outline to Tiptap Scaffold Wireframe Visualization
echo ========================================================
echo.

python "%~dp0app.py"
pause
