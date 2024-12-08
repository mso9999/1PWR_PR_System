/*******************************************************************************************
 * File: PRNumbering.gs
 * Version: 1.5
 * Last Updated: 2024-12-08
 *
 * Description:
 *   Handles PR number generation and tracking for the PR system.
 *   Ensures unique PR numbers are generated and recorded.
 *
 * Changes in 1.5:
 *   - Updated to use CONFIG.SPREADSHEET_ID for consistency
 *
 * Changes in 1.4:
 *   - Added error handling for PR number generation
 *   - Improved logging for debugging
 *   - Added validation for PR number uniqueness
 *******************************************************************************************/

/**
 * Gets the next PR number for display on form
 * Stores it in user cache to reserve it
 * @returns {string} Next PR number
 */
function getPRNumber() {
  console.log('Starting PR number generation');
  
  try {
    // Get the PR Number Tracker sheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log('Opened spreadsheet:', CONFIG.SPREADSHEET_ID);
    
    const sheet = ss.getSheetByName('PR Number Tracker');
    if (!sheet) {
      console.error('PR Number Tracker sheet not found');
      throw new Error('PR Number Tracker sheet not found');
    }
    console.log('Found PR Number Tracker sheet');

    // Get current year and month
    const now = new Date();
    const yearMonth = Utilities.formatDate(now, 'GMT', 'yyyyMM');
    console.log('Current yearMonth:', yearMonth);
    
    // Get all data from sheet
    const data = sheet.getDataRange().getValues();
    console.log('Retrieved sheet data, rows:', data.length);
    
    // Find row for current month
    let monthRow = data.findIndex(row => row[0] === yearMonth);
    console.log('Found monthRow:', monthRow);
    
    if (monthRow === -1) {
      console.log('Creating new month row for:', yearMonth);
      sheet.appendRow([yearMonth, 1]);
      monthRow = data.length; // Use the new row index
      console.log('Created new month row at index:', monthRow);
    }
    
    // Get and increment counter
    const counter = monthRow === data.length ? 1 : data[monthRow][1];
    console.log('Current counter:', counter);
    
    const paddedCounter = String(counter).padStart(3, '0');
    const prNumber = `PR-${yearMonth}-${paddedCounter}`;
    console.log('Generated PR number:', prNumber);
    
    // Update counter in sheet
    const newCounter = counter + 1;
    sheet.getRange(monthRow + 1, 2).setValue(newCounter);
    console.log('Updated counter to:', newCounter);
    
    // Store in cache
    const cache = CacheService.getUserCache();
    const cacheKey = 'reserved_pr_' + Session.getTemporaryActiveUserKey();
    cache.put(cacheKey, prNumber, 3600);
    console.log('Stored PR number in cache with key:', cacheKey);
    
    return prNumber;
    
  } catch (error) {
    console.error('Error in getPRNumber:', error.message);
    console.error('Stack trace:', error.stack);
    throw new Error(`Failed to generate PR number: ${error.message}`);
  }
}

/**
 * Gets the reserved PR number for form submission
 * @returns {string} Reserved PR number or generates new one if none reserved
 */
function getReservedPRNumber() {
  const cache = CacheService.getUserCache();
  const key = 'reserved_pr_' + Session.getTemporaryActiveUserKey();
  const reserved = cache.get(key);
  
  return reserved || getPRNumber();
}

/**
 * Records the PR number in the tracker sheet
 * @param {string} prNumber - PR number to record
 */
function recordPRNumber(prNumber) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('PR Number Tracker');
    if (!sheet) {
      throw new Error('PR Number Tracker sheet not found');
    }

    const now = new Date();
    sheet.appendRow([
      prNumber,
      now,
      Session.getEffectiveUser().getEmail()
    ]);
    
  } catch (error) {
    console.error('Error recording PR number:', error);
    throw new Error('Failed to record PR number');
  }
}

/**
 * Validates a PR number format and checks for uniqueness
 * @param {string} prNumber - PR number to validate
 * @returns {boolean} Whether the PR number is valid
 */
function validatePRNumber(prNumber) {
  try {
    // Check format
    const regex = /^PR-\d{6}-\d{3}$/;
    if (!regex.test(prNumber)) {
      return false;
    }
    
    // Check uniqueness
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Master Log');
    if (!sheet) {
      throw new Error('Master Log sheet not found');
    }
    
    const data = sheet.getRange('A:A').getValues();
    return !data.flat().includes(prNumber);
    
  } catch (error) {
    console.error('Error validating PR number:', error);
    return false;
  }
}

/**
 * Creates and configures the PR Number Tracker sheet if it doesn't exist
 */
function setupPRTrackerSheet() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName('PR Number Tracker');
    
    if (!sheet) {
      sheet = ss.insertSheet('PR Number Tracker');
      sheet.getRange('A1:C1').setValues([['YearMonth', 'Counter', 'LastUpdated']]);
      sheet.getRange('A:C').setNumberFormat('@STRING@');
    }
    
  } catch (error) {
    console.error('Error setting up PR Tracker sheet:', error);
    throw new Error('Failed to setup PR Tracker sheet');
  }
}

/**
 * Utility function to reset PR numbers if needed
 * Only run this manually when necessary
 */
function resetPRNumbersForMonth() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('PR Number Tracker');
    if (!sheet) {
      throw new Error('PR Number Tracker sheet not found');
    }

    const now = new Date();
    const yearMonth = Utilities.formatDate(now, 'GMT', 'yyyyMM');
    
    sheet.appendRow([yearMonth, 1, now]);
    
  } catch (error) {
    console.error('Error resetting PR numbers:', error);
    throw new Error('Failed to reset PR numbers');
  }
}

/**
 * Sets up automatic monthly reset of PR numbers
 * Should be run once during system setup
 */
function setupMonthlyTrigger() {
  try {
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'resetPRNumbersForMonth') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new monthly trigger
    ScriptApp.newTrigger('resetPRNumbersForMonth')
      .timeBased()
      .onMonthDay(1)
      .atHour(0)
      .create();
      
  } catch (error) {
    console.error('Error setting up monthly trigger:', error);
    throw new Error('Failed to setup monthly trigger');
  }
}
