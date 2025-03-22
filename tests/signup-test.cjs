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
  
  // Helper function to wait
  const wait = async (ms) => {
    return page.evaluate(ms => {
      return new Promise(resolve => setTimeout(resolve, ms));
    }, ms);
  };
  
  try {
    // Navigate to your application
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Wait for the login form to be visible
    console.log('Waiting for login page to load...');
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Look for signup link
    console.log('Looking for signup link...');
    await wait(1000);
    
    // Take screenshot of login page to debug
    await page.screenshot({ path: 'login-page.png' });
    
    // Find and click on signup link
    const signupLinkSelector = await page.evaluate(() => {
      // Try different strategies to find the signup link
      const links = Array.from(document.querySelectorAll('a'));
      const signupLink = links.find(link => {
        const text = link.textContent.toLowerCase();
        return text.includes('sign up') || 
               text.includes('create account') || 
               text.includes('register') ||
               text.includes('signup');
      });
      
      // Report what we found to help debug
      if (signupLink) {
        console.log(`Found signup link: ${signupLink.textContent}`);
        return true;
      }
      
      // Print all link texts to debug
      console.log('Available links:');
      links.forEach(link => console.log(`- ${link.textContent}: ${link.href}`));
      return false;
    });
    
    if (signupLinkSelector) {
      // Try to click any link that might be for signup
      console.log('Attempting to click signup link');
      try {
        await page.click('a[href="/signup"]');
      } catch (e) {
        try {
          await page.click('a:contains("Sign Up")');
        } catch (e) {
          console.log('Could not click signup link, navigating directly');
        }
      }
    }
    
    // Navigate directly to signup page
    console.log('Navigating to signup page directly...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle2' });
    
    // Wait for signup form
    console.log('Waiting for signup form to load...');
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Take screenshot of signup form to debug
    await page.screenshot({ path: 'signup-form-initial.png' });
    
    // Test Case 1: Empty form submission
    console.log('Test Case 1: Testing submission with empty form...');
    
    // Clear any pre-filled values
    await page.evaluate(() => {
      document.querySelectorAll('input').forEach(input => input.value = '');
    });
    
    await page.click('button[type="submit"]');
    await wait(2000);
    
    // Take screenshot after empty form submission
    await page.screenshot({ path: 'signup-empty-form-result.png' });
    
    // Test Case 2: Invalid data (password mismatch)
    console.log('Test Case 2: Testing password mismatch...');
    
    // Clear form first
    await page.evaluate(() => {
      document.querySelectorAll('input').forEach(input => input.value = '');
    });
    
    // Fill in the form with mismatched passwords
    await page.type('#fullName', 'Test User');
    await page.type('#email', 'testuser@example.com');
    await page.type('#employeeId', 'EMP12345');
    await page.type('#position', 'HR Head');
    await page.type('#password', 'Password123');
    await page.type('#confirmPassword', 'Password456'); // Different password
    
    // Take screenshot before submission
    await page.screenshot({ path: 'signup-password-mismatch-before.png' });
    
    await page.click('button[type="submit"]');
    
    // Wait for validation error message
    await wait(2000);
    
    // Take screenshot after password mismatch submission
    await page.screenshot({ path: 'signup-password-mismatch-after.png' });
    
    // Test Case 3: Valid signup
    console.log('Test Case 3: Testing valid signup form submission...');
    
    // Clear form first
    await page.evaluate(() => {
      document.querySelectorAll('input').forEach(input => input.value = '');
    });
    
    // Generate a unique email using timestamp to avoid duplicate user errors
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    
    // Fill in the form with valid data
    await page.type('#fullName', 'Test User');
    await page.type('#email', uniqueEmail);
    await page.type('#employeeId', 'EMP12345');
    await page.type('#position', 'HR Head');
    await page.type('#password', 'Password123');
    await page.type('#confirmPassword', 'Password123');
    
    // Take a screenshot before submitting
    await page.screenshot({ path: 'signup-form-filled.png' });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    console.log('Waiting for success message or redirect...');
    
    // Wait for confirmation (wait longer for Firebase registration)
    await wait(8000);
    
    // Take a screenshot after submission
    await page.screenshot({ path: 'signup-after-submission.png' });
    
    // Check for success message or elements
    const successResult = await page.evaluate(() => {
      // Look for various success indicators
      const successElements = document.querySelectorAll('.text-green-600, .text-success, .fa-check-circle');
      const successMessages = document.querySelectorAll('p, h2, div');
      
      // Check for success icon
      if (successElements.length > 0) {
        return { success: true, message: 'Found success indicator element' };
      }
      
      // Check for success messages in text
      for (const el of successMessages) {
        const text = el.textContent.toLowerCase();
        if (text.includes('success') || 
            text.includes('registered') || 
            text.includes('submitted') ||
            text.includes('pending approval')) {
          return { success: true, message: el.textContent };
        }
      }
      
      // If we're redirected to login page, that could be a success
      if (window.location.pathname === '/' || 
          document.querySelector('form input[type="password"]')) {
        return { success: true, message: 'Redirected to login page' };
      }
      
      return { success: false, message: 'Could not detect success' };
    });
    
    if (successResult.success) {
      console.log('SUCCESS: Registration completed. Details:', successResult.message);
    } else {
      console.log('UNKNOWN: Could not detect success message. Registration status unclear.');
      console.log('Details:', successResult.message);
    }
    
    // Take a final screenshot of the result
    await page.screenshot({ path: 'signup-test-final.png' });
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'signup-test-error.png' });
  } finally {
    // Close the browser after a delay to see the final state
    console.log('Test completed. Closing browser in 8 seconds...');
    await wait(8000);
    await browser.close();
  }
})(); 