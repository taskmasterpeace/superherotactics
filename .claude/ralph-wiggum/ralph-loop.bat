@echo off
setlocal enabledelayedexpansion

:: Ralph Wiggum Autonomous Loop for Windows
:: Usage: ralph-loop.bat "task description" [max-iterations] [completion-text]

set "TASK=%~1"
set "MAX_ITER=%~2"
set "COMPLETION=%~3"

if "%TASK%"=="" (
    echo Usage: ralph-loop.bat "task description" [max-iterations] [completion-text]
    echo.
    echo Example: ralph-loop.bat "Wire all weapons to CombatScene" 20 "TASK_COMPLETE"
    exit /b 1
)

if "%MAX_ITER%"=="" set MAX_ITER=10
if "%COMPLETION%"=="" set COMPLETION=TASK_COMPLETE

:: Create logs directory
if not exist ".claude\ralph-wiggum\logs" mkdir ".claude\ralph-wiggum\logs"

:: Generate session ID
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set dt=%%a
set SESSION=%dt:~0,14%

:: Create the prompt file
set "PROMPT_FILE=.claude\ralph-wiggum\current-prompt.md"

echo # Autonomous Loop Task> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Your Task>> "%PROMPT_FILE%"
echo %TASK%>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Instructions>> "%PROMPT_FILE%"
echo 1. Work on this task incrementally>> "%PROMPT_FILE%"
echo 2. After completing a meaningful chunk, commit your changes>> "%PROMPT_FILE%"
echo 3. Check your progress against the task requirements>> "%PROMPT_FILE%"
echo 4. If the task is FULLY COMPLETE, output: %COMPLETION%>> "%PROMPT_FILE%"
echo 5. If more work remains, describe what's left and continue>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Completion Criteria>> "%PROMPT_FILE%"
echo When finished, you MUST output exactly: %COMPLETION%>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Context>> "%PROMPT_FILE%"
echo - Read CLAUDE.md for project overview>> "%PROMPT_FILE%"
echo - Check git log for recent changes>> "%PROMPT_FILE%"
echo - Review modified files from previous iterations>> "%PROMPT_FILE%"

echo.
echo ========================================
echo   RALPH WIGGUM AUTONOMOUS LOOP
echo ========================================
echo Task: %TASK%
echo Max Iterations: %MAX_ITER%
echo Completion Signal: %COMPLETION%
echo Session: %SESSION%
echo ========================================
echo.
echo Starting in 5 seconds... (Ctrl+C to cancel)
timeout /t 5 /nobreak >nul

set ITERATION=0

:LOOP
set /a ITERATION+=1

if %ITERATION% gtr %MAX_ITER% (
    echo.
    echo [RALPH] Max iterations reached (%MAX_ITER%). Stopping.
    goto END
)

echo.
echo ========================================
echo   ITERATION %ITERATION% of %MAX_ITER%
echo ========================================

:: Log iteration start
echo [%date% %time%] Iteration %ITERATION% started >> ".claude\ralph-wiggum\logs\%SESSION%.log"

:: Run Claude with the prompt
set "LOG_FILE=.claude\ralph-wiggum\logs\%SESSION%_iter%ITERATION%.txt"
type "%PROMPT_FILE%" | claude --print > "%LOG_FILE%" 2>&1

:: Check for completion signal
findstr /c:"%COMPLETION%" "%LOG_FILE%" >nul
if %errorlevel%==0 (
    echo.
    echo [RALPH] Task completed! Found: %COMPLETION%
    echo [%date% %time%] COMPLETED at iteration %ITERATION% >> ".claude\ralph-wiggum\logs\%SESSION%.log"
    goto END
)

echo [RALPH] Iteration %ITERATION% complete. Continuing...
echo [%date% %time%] Iteration %ITERATION% complete >> ".claude\ralph-wiggum\logs\%SESSION%.log"

:: Small delay between iterations
timeout /t 2 /nobreak >nul

goto LOOP

:END
echo.
echo ========================================
echo   LOOP FINISHED
echo ========================================
echo Total iterations: %ITERATION%
echo Logs saved to: .claude\ralph-wiggum\logs\%SESSION%.log
echo.

endlocal
