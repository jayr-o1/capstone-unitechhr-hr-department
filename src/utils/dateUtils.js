/**
 * Format a date to a readable string format
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Format options for toLocaleDateString
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  try {
    // Handle Firestore timestamp
    if (date && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
    // Default options
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Get a relative time string (e.g. "2 days ago")
 * @param {Date|string|number} date - The date to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    // Handle Firestore timestamp
    if (date && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
    const now = new Date();
    const dateObj = new Date(date);
    const diffMs = now - dateObj;
    
    // Convert to seconds
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} minutes ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hours ago`;
    if (diffSecs < 2592000) return `${Math.floor(diffSecs / 86400)} days ago`;
    if (diffSecs < 31536000) return `${Math.floor(diffSecs / 2592000)} months ago`;
    
    return `${Math.floor(diffSecs / 31536000)} years ago`;
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return 'Invalid date';
  }
}; 