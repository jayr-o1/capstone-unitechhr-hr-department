@echo off
echo Starting Login Test...
echo.
echo Make sure your development server is running at http://localhost:5173
echo If not, start it using 'npm run dev' in another terminal window.
echo.
echo Press any key to continue or Ctrl+C to abort...
pause > nul

echo Running Login Test...
node tests/login-test.cjs

echo.
echo Test complete. Check the generated screenshots for results.
pause 