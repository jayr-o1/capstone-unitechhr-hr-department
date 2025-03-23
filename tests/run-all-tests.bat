@echo off
echo ===================================
echo UnitechHR Authentication Test Suite
echo ===================================
echo.
echo Make sure your development server is running at http://localhost:5173
echo If not, start it using 'npm run dev' in another terminal window.
echo.
echo Press any key to continue or Ctrl+C to abort...
pause > nul

echo.
echo Running Login Test...
echo -------------------
node tests/login-test.cjs

echo.
echo Login Test completed.
echo.
echo Press any key to continue to Signup Test...
pause > nul

echo.
echo Running Signup Test...
echo --------------------
node tests/signup-test.cjs

echo.
echo ===================================
echo All tests completed.
echo Check the generated screenshots for results.
echo ===================================
pause 