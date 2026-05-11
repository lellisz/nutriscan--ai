@echo off
REM Inicia o agent_loop.sh via Git Bash
REM Usado pelo Task Scheduler do Windows
cd /d "C:\projetos\praxis"
"C:\Program Files\Git\bin\bash.exe" -l "C:\projetos\praxis\agent_loop.sh" >> "C:\projetos\praxis\agent_loop.log" 2>&1
