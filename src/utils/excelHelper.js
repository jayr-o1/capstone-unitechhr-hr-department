/**
 * Utility functions for Excel file operations
 */
import { read, utils } from 'xlsx';

/**
 * Read Excel file and convert to JSON
 * @param {File} file - The Excel file to read
 * @returns {Promise<Array>} - Resolves to an array of objects representing Excel data
 */
export const readExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Convert JSON data to Excel format
 * @param {Array} data - Array of objects to convert to Excel
 * @param {string} sheetName - Name of the sheet
 * @returns {Object} - Excel workbook
 */
export const jsonToExcel = (data, sheetName = 'Sheet1') => {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}; 