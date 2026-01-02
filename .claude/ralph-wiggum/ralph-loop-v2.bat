@echo off
setlocal enabledelayedexpansion

:: ========================================
:: Ralph Wiggum Autonomous Loop v2.0
:: Enhanced with JSON todo list integration
:: and automatic system continuation
:: ========================================

:: Configuration
set "TODO_FILE=.claude\ralph-wiggum\todo-list.json"
set "LINKS_FILE=.claude\ralph-wiggum\system-links.json"
set "STATE_FILE=.claude\ralph-wiggum\iteration-state.json"
set "LOGS_DIR=.claude\ralph-wiggum\logs"

:: Arguments
set "SYSTEM_ID=%~1"
set "MAX_ITER=%~2"
set "AUTO_CONTINUE=%~3"

:: Defaults
if "%MAX_ITER%"=="" set MAX_ITER=50
if "%AUTO_CONTINUE%"=="" set AUTO_CONTINUE=true

:: Create logs directory
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Generate session ID
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value 2^>nul') do set dt=%%a
set SESSION=%dt:~0,14%

:: Header
echo.
echo ========================================
echo   RALPH WIGGUM v2.0 - AUTONOMOUS LOOP
echo ========================================
echo Todo File: %TODO_FILE%
echo Max Iterations: %MAX_ITER%
echo Auto Continue: %AUTO_CONTINUE%
echo Session: %SESSION%
echo ========================================

:: If no system specified, find first pending
if "%SYSTEM_ID%"=="" (
    echo Finding next pending system...
    for /f "delims=" %%i in ('powershell -Command "(Get-Content '%TODO_FILE%' | ConvertFrom-Json).systems | Where-Object { $_.status -eq 'pending' } | Select-Object -First 1 -ExpandProperty id"') do set SYSTEM_ID=%%i
)

if "%SYSTEM_ID%"=="" (
    echo [RALPH] No pending systems found. All complete!
    goto END
)

echo.
echo Current System: %SYSTEM_ID%
echo.

:: Get system name
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%TODO_FILE%' | ConvertFrom-Json).systems | Where-Object { $_.id -eq '%SYSTEM_ID%' } | Select-Object -ExpandProperty name"') do set SYSTEM_NAME=%%i

echo System Name: %SYSTEM_NAME%
echo.

:: Initialize state file
echo { "session": "%SESSION%", "systemId": "%SYSTEM_ID%", "currentIteration": 0, "maxIterations": %MAX_ITER%, "startTime": "%date% %time%" } > "%STATE_FILE%"

:: Create prompt file
set "PROMPT_FILE=.claude\ralph-wiggum\prompts\%SESSION%_prompt.md"
if not exist ".claude\ralph-wiggum\prompts" mkdir ".claude\ralph-wiggum\prompts"

:: Generate prompt from system
echo # Ralph Wiggum Autonomous Task> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Current System: %SYSTEM_NAME% (%SYSTEM_ID%)>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Instructions>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo 1. Read .claude/ralph-wiggum/todo-list.json to find your current system and tasks>> "%PROMPT_FILE%"
echo 2. Mark the system as "in_progress" if not already>> "%PROMPT_FILE%"
echo 3. Complete each pending task in the system>> "%PROMPT_FILE%"
echo 4. Mark each task as "completed" when done>> "%PROMPT_FILE%"
echo 5. After completing ALL tasks in the system:>> "%PROMPT_FILE%"
echo    - Mark the system as "completed">> "%PROMPT_FILE%"
echo    - Update completedAt with current timestamp>> "%PROMPT_FILE%"
echo    - Commit your changes with descriptive message>> "%PROMPT_FILE%"
echo 6. Output SYSTEM_COMPLETE when the current system is fully done>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Context>> "%PROMPT_FILE%"
echo - Read CLAUDE.md for project overview>> "%PROMPT_FILE%"
echo - Check todo-list.json for task details>> "%PROMPT_FILE%"
echo - Check system-links.json for dependencies>> "%PROMPT_FILE%"
echo - Review git log for recent changes>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Completion Signal>> "%PROMPT_FILE%"
echo When ALL tasks in system %SYSTEM_ID% are complete, output: SYSTEM_COMPLETE>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Current Tasks (from todo-list.json)>> "%PROMPT_FILE%"
echo Review the file directly for current task status.>> "%PROMPT_FILE%"

echo.
echo Starting in 3 seconds... (Ctrl+C to cancel)
timeout /t 3 /nobreak >nul

set ITERATION=0

:LOOP
set /a ITERATION+=1

if %ITERATION% gtr %MAX_ITER% (
    echo.
    echo [RALPH] Max iterations reached (%MAX_ITER%). Stopping.
    goto CHECK_CONTINUE
)

echo.
echo ========================================
echo   ITERATION %ITERATION% of %MAX_ITER%
echo   System: %SYSTEM_ID%
echo ========================================

:: Update state file
powershell -Command "$json = Get-Content '%STATE_FILE%' | ConvertFrom-Json; $json.currentIteration = %ITERATION%; $json | ConvertTo-Json | Set-Content '%STATE_FILE%'"

:: Log iteration
echo [%date% %time%] System %SYSTEM_ID% - Iteration %ITERATION% started >> "%LOGS_DIR%\%SESSION%.log"

:: Run Claude
set "LOG_FILE=%LOGS_DIR%\%SESSION%_%SYSTEM_ID%_iter%ITERATION%.txt"
type "%PROMPT_FILE%" | claude --print > "%LOG_FILE%" 2>&1

:: Check for system completion
findstr /c:"SYSTEM_COMPLETE" "%LOG_FILE%" >nul
if %errorlevel%==0 (
    echo.
    echo [RALPH] System %SYSTEM_ID% completed!
    echo [%date% %time%] System %SYSTEM_ID% COMPLETED at iteration %ITERATION% >> "%LOGS_DIR%\%SESSION%.log"

    :: Update todo-list.json to mark system complete
    powershell -Command "$json = Get-Content '%TODO_FILE%' | ConvertFrom-Json; $sys = $json.systems | Where-Object { $_.id -eq '%SYSTEM_ID%' }; $sys.status = 'completed'; $sys.completedAt = (Get-Date).ToString('o'); $json.completedSystems += '%SYSTEM_ID%'; $json.statistics.completedSystems++; $json | ConvertTo-Json -Depth 10 | Set-Content '%TODO_FILE%'"

    goto CHECK_CONTINUE
)

echo [RALPH] Iteration %ITERATION% complete. Continuing...
echo [%date% %time%] Iteration %ITERATION% complete >> "%LOGS_DIR%\%SESSION%.log"

timeout /t 2 /nobreak >nul
goto LOOP

:CHECK_CONTINUE
:: Check if auto-continue is enabled
if /i not "%AUTO_CONTINUE%"=="true" goto END

echo.
echo [RALPH] Checking for triggered systems...

:: Get triggered systems from current system
for /f "delims=" %%i in ('powershell -Command "$json = Get-Content '%LINKS_FILE%' | ConvertFrom-Json; $sys = $json.systems.'%SYSTEM_ID%'; if ($sys.triggers) { $sys.triggers -join ',' }"') do set TRIGGERS=%%i

if "%TRIGGERS%"=="" (
    echo [RALPH] No triggered systems. Checking for next pending...
) else (
    echo [RALPH] Triggered systems: %TRIGGERS%
)

:: Find next pending system
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%TODO_FILE%' | ConvertFrom-Json).systems | Where-Object { $_.status -eq 'pending' } | Select-Object -First 1 -ExpandProperty id"') do set NEXT_SYSTEM=%%i

if "%NEXT_SYSTEM%"=="" (
    echo.
    echo ========================================
    echo   ALL SYSTEMS COMPLETE!
    echo ========================================
    goto END
)

echo.
echo [RALPH] Continuing to next system: %NEXT_SYSTEM%
echo.

:: Start next system
set SYSTEM_ID=%NEXT_SYSTEM%
set ITERATION=0

:: Update state
echo { "session": "%SESSION%", "systemId": "%SYSTEM_ID%", "currentIteration": 0, "maxIterations": %MAX_ITER%, "startTime": "%date% %time%", "previousSystem": "%SYSTEM_ID%" } > "%STATE_FILE%"

:: Get new system name
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%TODO_FILE%' | ConvertFrom-Json).systems | Where-Object { $_.id -eq '%SYSTEM_ID%' } | Select-Object -ExpandProperty name"') do set SYSTEM_NAME=%%i

:: Regenerate prompt for new system
echo # Ralph Wiggum Autonomous Task> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Current System: %SYSTEM_NAME% (%SYSTEM_ID%)>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Instructions>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo 1. Read .claude/ralph-wiggum/todo-list.json to find your current system and tasks>> "%PROMPT_FILE%"
echo 2. Mark the system as "in_progress" if not already>> "%PROMPT_FILE%"
echo 3. Complete each pending task in the system>> "%PROMPT_FILE%"
echo 4. Mark each task as "completed" when done>> "%PROMPT_FILE%"
echo 5. After completing ALL tasks in the system:>> "%PROMPT_FILE%"
echo    - Mark the system as "completed">> "%PROMPT_FILE%"
echo    - Update completedAt with current timestamp>> "%PROMPT_FILE%"
echo    - Commit your changes with descriptive message>> "%PROMPT_FILE%"
echo 6. Output SYSTEM_COMPLETE when the current system is fully done>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Context>> "%PROMPT_FILE%"
echo - Read CLAUDE.md for project overview>> "%PROMPT_FILE%"
echo - Check todo-list.json for task details>> "%PROMPT_FILE%"
echo - Check system-links.json for dependencies>> "%PROMPT_FILE%"
echo - Review git log for recent changes>> "%PROMPT_FILE%"
echo.>> "%PROMPT_FILE%"
echo ## Completion Signal>> "%PROMPT_FILE%"
echo When ALL tasks in system %SYSTEM_ID% are complete, output: SYSTEM_COMPLETE>> "%PROMPT_FILE%"

goto LOOP

:END
:: Clean up state file
if exist "%STATE_FILE%" del "%STATE_FILE%"

echo.
echo ========================================
echo   RALPH WIGGUM SESSION COMPLETE
echo ========================================
echo Session: %SESSION%
echo Logs: %LOGS_DIR%\%SESSION%.log
echo.

endlocal
