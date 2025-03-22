const puppeteer = require('puppeteer');

(async () => {
  // Launch the browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to see the browser in action
    defaultViewport: null, // Use the default viewport of the browser
    args: ['--start-maximized'] // Start with maximized window
  });
  
  // Open a new page
  const page = await browser.newPage();
  
  try {
    // Navigate to your application
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Wait for the login form to be visible
    console.log('Waiting for login form...');
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Test Case 1: Invalid login (empty credentials)
    console.log('Test Case 1: Testing invalid login with empty credentials...');
    await page.click('button[type="submit"]');
    
    // Wait for error message or validation feedback
    await page.waitForTimeout(1000);
    
    // Test Case 2: Invalid login (wrong credentials)
    console.log('Test Case 2: Testing invalid login with wrong credentials...');
    await page.type('input[type="email"]', 'wrong@example.com');
    await page.type('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Test Case 3: Valid login (you should replace these with valid test credentials)
    console.log('Test Case 3: Testing valid login...');
    // Clear previous input
    await page.evaluate(() => {
      document.querySelector('input[type="email"]').value = '';
      document.querySelector('input[type="password"]').value = '';
    });
    
    // Fill in valid credentials - REPLACE THESE WITH ACTUAL TEST CREDENTIALS
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or successful login
    console.log('Waiting for redirect after successful login...');
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {
      console.log('No navigation occurred - login may have failed or redirected within the same page');
    });
    
    // Check if we're logged in by looking for dashboard elements
    const isDashboard = await page.evaluate(() => {
      return window.location.href.includes('dashboard') || 
             document.querySelector('.dashboard') !== null;
    });
    
    if (isDashboard) {
      console.log('SUCCESS: Login successful! Redirected to dashboard.');
    } else {
      console.log('FAILED: Login unsuccessful or dashboard not detected.');
    }
    
    // Take a screenshot of the result
    await page.screenshot({ path: 'login-test-result.png' });
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'login-test-error.png' });
  } finally {
    // Close the browser after 5 seconds to see the final state
    console.log('Test completed. Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})(); 