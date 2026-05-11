@echo off
title PRAXIS Dispatcher
echo ========================================
echo   PRAXIS Dispatcher v5
echo   C:/projetos/praxis
echo ========================================

cd /d C:\projetos\praxis

:: Mata instâncias anteriores do dispatcher para evitar duplicatas
tasklist /FI "WINDOWTITLE eq PRAXIS Dispatcher" 2>NUL | find /I "python.exe" >NUL
if not errorlevel 1 (
    echo Encerrando instância anterior...
    taskkill /F /FI "WINDOWTITLE eq PRAXIS Dispatcher" >NUL 2>&1
    timeout /t 2 /nobreak >NUL
)

echo Iniciando dispatcher...
python dispatcher.py

echo.
echo Dispatcher encerrado. Pressione qualquer tecla para fechar.
pause >NUL
