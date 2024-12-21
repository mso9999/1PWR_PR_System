/*******************************************************************************************
 * File: Setup.gs
 * Version: 1.5
 * Last Updated: 2024-12-08
 *
 * Description:
 *   Handles initial setup and configuration validation for the PR system.
 *   Manages system settings and sheet validation.
 *
 * Changes in 1.5:
 *   - Updated to use CONFIG.SPREADSHEET_ID for consistency
 *
 * Changes in 1.4:
 *   - Added error handling for setup process
 *   - Improved logging for debugging
 *   - Added configuration validation
 *******************************************************************************************/

/**
 * Sets up initial system configuration
 * Should be run once during deployment
 */
function setupSystem() {
  console.log('Starting system setup');
  
  try {
    // Setup sheets
    setupPRTrackerSheet();
    setupAuthLogSheet();
    
    // Setup triggers
    setupMonthlyTrigger();
    setupCleanupTrigger();
    
    // Verify configuration
    if (!validateConfig()) {
      throw new Error('Configuration validation failed');
    }
    
    console.log('System setup completed successfully');
    return { success: true, message: 'Setup completed' };
    
  } catch (error) {
    console.error('Setup failed:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Validates the system configuration
 * @returns {boolean} Whether the configuration is valid
 */
function validateConfig() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Check required sheets exist
    const requiredSheets = [
      'Master Log',
      'PR Number Tracker',
      'Requestor List',
      'Approver List',
      'Site List',
      'Vendor List',
      'Vehicle List',
      'Project Categories',
      'Expense Type',
      'Auth Log'
    ];
    
    const missingSheets = requiredSheets.filter(name => !ss.getSheetByName(name));
    if (missingSheets.length > 0) {
      console.error('Missing sheets:', missingSheets);
      return false;
    }
    
    // Verify sheet structures
    if (!verifyPRTracker()) {
      console.error('PR Tracker verification failed');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Config validation failed:', error);
    return false;
  }
}

/**
 * Verifies the PR Number Tracker sheet is properly configured
 * @returns {boolean} Whether the sheet is properly configured
 */
function verifyPRTracker() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('PR Number Tracker');
    if (!sheet) {
      return false;
    }
    
    const headers = sheet.getRange('A1:C1').getValues()[0];
    const expectedHeaders = ['YearMonth', 'Counter', 'LastUpdated'];
    
    return expectedHeaders.every((header, index) => header === headers[index]);
    
  } catch (error) {
    console.error('PR Tracker verification failed:', error);
    return false;
  }
}

/**
 * Sets up cleanup trigger to run every hour
 */
function setupCleanupTrigger() {
  try {
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'cleanupSessions') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new hourly trigger
    ScriptApp.newTrigger('cleanupSessions')
      .timeBased()
      .everyHours(1)
      .create();
      
  } catch (error) {
    console.error('Error setting up cleanup trigger:', error);
    throw new Error('Failed to setup cleanup trigger');
  }
}

/**
 * Runs initial setup and verifies the PR tracking system
 */
function setupAndVerify() {
  try {
    // Run setup
    const setupResult = setupSystem();
    if (!setupResult.success) {
      throw new Error(setupResult.message);
    }
    
    // Test PR generation
    const testPR = getPRNumber();
    console.log('Test PR number generated:', testPR);
    
    // Test exchange rates
    testExchangeRates();
    
    console.log('Setup and verification completed successfully');
    return { success: true, message: 'Setup and verification completed' };
    
  } catch (error) {
    console.error('Setup and verification failed:', error);
    return { success: false, message: error.toString() };
  }
}
