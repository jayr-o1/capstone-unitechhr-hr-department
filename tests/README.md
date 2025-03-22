# Authentication Tests

This directory contains automated tests for the authentication functionality using Puppeteer.

## Available Tests

1. **Login Test** - Tests the login functionality
2. **Signup Test** - Tests the signup/registration functionality

## Running the Tests

### Prerequisites

- Make sure your development server is running at http://localhost:5173
- To start the server: `npm run dev`

### Using NPM scripts

```bash
# Run login test
npm run test:login

# Run signup test
npm run test:signup
```

### Using Batch Files

You can also run the tests using the provided batch files:

```bash
# Run login test
.\tests\run-login-test.bat

# Run signup test
.\tests\run-signup-test.bat
```

## Test Output

The tests will generate screenshots at various stages to help debug any issues:

- Login test: `login-test-result.png` and `login-test-error.png` (if errors occur)
- Signup test: Multiple screenshots showing each test case step

## Test Cases

### Login Test

1. Empty credentials test
2. Invalid credentials test
3. Valid credentials test

### Signup Test

1. Empty form validation test
2. Password mismatch validation test
3. Valid registration test with unique email

## Adding New Tests

Follow the existing pattern in `login-test.cjs` and `signup-test.cjs` to create new tests. 