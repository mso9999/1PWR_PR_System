/*******************************************************************************************
 * File: PRNumbering.gs
 * Version: 1.0
 * Last Updated: 2023-12-08
 *
 * Description:
 *   Handles PR number generation, tracking, and validation.
 *   Manages the PR Number Tracker sheet and ensures unique PR numbers.
 *
 * Dependencies:
 *   - SharedUtils.gs: Utility functions
 ********************************************************************************************/

/**
 * Gets the next PR number for display on form
 * Stores it in user cache to reserve it
 * @returns {string} Next PR number
 */
function getPRNumber() {
  console.log('Generating new PR number');
  
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
                               .getSheetByName('PR Number Tracker');
    if (!sheet) {
      throw new Error('PR Number Tracker sheet not found');
    }

    const now = new Date();
    const yearMonth = Utilities.formatDate(now, 'GMT', 'yyyyMM');
    
    // Find or create row for current month
    const data = sheet.getDataRange().getValues();
    let monthRow = data.findIndex(row => row[0] === yearMonth);
    
    if (monthRow === -1) {
      // Add new month row
      sheet.appendRow([yearMonth, 1]);
      monthRow = sheet.getLastRow() - 1;
    }
    
    // Get and increment counter
    const counter = data[monthRow][1];
    const paddedCounter = String(counter).padStart(3, '0');
    const prNumber = `PR-${yearMonth}-${paddedCounter}`;
    
    // Update counter in sheet
    sheet.getRange(monthRow + 1, 2).setValue(counter + 1);
    
    // Store in cache
    const cache = CacheService.getUserCache();
    cache.put('reserved_pr_' + Session.getTemporaryActiveUserKey(), prNumber, 3600);
    
    console.log('Generated PR number:', prNumber);
    return prNumber;
    
  } catch (error) {
    console.error('Error generating PR number:', error);
    throw new Error('Failed to generate PR number');
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
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
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
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
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
