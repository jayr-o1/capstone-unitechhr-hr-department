/**
 * Helper functions to handle CORS issues with Firebase Storage
 */

// Function to create a download URL with CORS settings
export const createCorsEnabledUrl = (url) => {
  try {
    // If not a Firebase Storage URL, return the original URL
    if (!url || !url.includes('firebasestorage.googleapis.com')) {
      return url;
    }
    
    // Parse the URL
    const parsedUrl = new URL(url);
    
    // Add CORS parameters to the URL
    parsedUrl.searchParams.append('alt', 'media');
    parsedUrl.searchParams.append('token', parsedUrl.searchParams.get('token'));
    
    return parsedUrl.toString();
  } catch (error) {
    console.error('Error creating CORS-enabled URL:', error);
    return url;
  }
};

// Function to handle file operations safely with CORS
export const handleStorageRequest = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    // If the error is a CORS error, handle it
    if (error.message && (
      error.message.includes('CORS') || 
      error.message.includes('Cross-Origin Request Blocked') ||
      error.message.includes('has been blocked by CORS policy')
    )) {
      console.warn('CORS error detected, attempting workaround...', error);
      
      // Here we could implement additional CORS workarounds if needed
      throw new Error('CORS issue detected. Please use the Firebase console to configure CORS for your Storage bucket.');
    }
    
    // Re-throw other errors
    throw error;
  }
}; 