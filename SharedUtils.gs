/**
 * SharedUtils.gs (Refactored)
 * Part 1 of 3: Core Configuration and Session Management
 * Last Updated: December 1, 2024 22:00 GMT+2
 * 
 * This file contains consolidated utility functions for the PR system.
 * Major changes:
 * 1. Consolidated duplicate session management functions
 * 2. Unified configuration objects
 * 3. Streamlined authentication logic
 * 4. Enhanced error handling and logging
 * 
 * Integration Notes:
 * - Previous getCurrentUserShared() calls should now use getCurrentUser()
 * - Previous validateSheetSession() calls should now use validateSession()
 * - Previous isAuthorizedShared() calls should now use isAuthorized()
 * 
 * Note: SPREADSHEET_ID is defined in Code.gs and shared across all .gs files
 */

/**
 * Session management configuration
 * Consolidated from multiple session configs
 */
const SESSION_CONFIG = {
  // Sheet configuration
  SHEET_NAME: 'Session Log',
  CLEANUP_FREQUENCY: 60, // minutes
  
  // Timeouts
  INACTIVITY_TIMEOUT: 30, // minutes
  SESSION_DURATION: 1440, // 24 hours
  
  // Column indices
  COLUMNS: {
    SESSION_ID: 0,
    TIMESTAMP: 1,
    USERNAME: 2,
    EMAIL: 3,
    ROLE: 4,
    LAST_ACTIVITY: 5,
    STATUS: 6
  },
  
  // Status values
  STATUS: {
    ACTIVE: 'Active',
    EXPIRED: 'Expired'
  }
};

/**
 * SharedUtils namespace for utility functions
 */
const SharedUtils = {
  /**
   * Gets active requestors from the Requestor List sheet
   * @returns {Array<Object>} Array of active requestor objects
   */
  getActiveRequestors: function() {
    try {
      Logger.log('Starting getActiveRequestors');
      
      // Open the spreadsheet and get the Requestor List sheet
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      Logger.log('Opened spreadsheet');
      
      const sheet = ss.getSheetByName('Requestor List');
      if (!sheet) {
        Logger.log('ERROR: Requestor List sheet not found');
        throw new Error('Requestor List sheet not found');
      }
      Logger.log('Found Requestor List sheet');

      // Get all data from the sheet
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {  // Check if there's data beyond header row
        Logger.log('No data found in sheet');
        return [];
      }

      // Log the headers for debugging
      Logger.log('Sheet headers:', data[0]);

      // Skip header row and filter active users
      const users = data.slice(1)  // Skip header row
        .filter(row => {
          Logger.log('Processing row:', row);
          return row[3].toString().toUpperCase() === 'Y';  // Active column (D)
        })
        .map(row => {
          const user = {
            name: row[0],  // Name column (A)
            email: row[1], // Email column (B)
            department: row[2], // Department column (C)
            role: row[5]   // Role column (F)
          };
          Logger.log('Mapped user:', user);
          return user;
        });

      Logger.log('Found ' + users.length + ' active users');
      return users;

    } catch (error) {
      Logger.log('Error in getActiveRequestors: ' + error.message);
      throw new Error('Failed to load users: ' + error.message);
    }
  }
};

/**
 * Load user options using google.script.run
 * This function is called from the client-side to populate the username dropdown
 */
function loadUserOptions() {
  google.script.run
    .withFailureHandler(function(error) {
      console.error('Failed to load users:', error);
      const errorOption = document.createElement('option');
      errorOption.text = 'Error loading users';
      errorOption.disabled = true;
      document.getElementById('username').add(errorOption);
    })
    .withSuccessHandler(function(users) {
      const select = document.getElementById('username');
      // Clear existing options except default
      while (select.options.length > 1) {
        select.remove(1);
      }
      // Add user options
      users.forEach(function(user) {
        const option = document.createElement('option');
        option.value = user.name;
        option.text = user.name;
        select.add(option);
      });
    })
    .getActiveRequestors();
}

/**
 * Validates session and returns user info
 * @returns {Object} User session info or null if invalid
 */
function validateSession() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SESSION_CONFIG.SHEET_NAME);
    if (!sheet) return null;

    const sessionId = Session.getTemporaryActiveUserKey();
    if (!sessionId) return null;

    const data = sheet.getDataRange().getValues();
    const sessionRow = data.find(row => 
      row[SESSION_CONFIG.COLUMNS.SESSION_ID] === sessionId &&
      row[SESSION_CONFIG.COLUMNS.STATUS] === SESSION_CONFIG.STATUS.ACTIVE
    );

    if (!sessionRow) return null;

    const lastActivity = new Date(sessionRow[SESSION_CONFIG.COLUMNS.LAST_ACTIVITY]);
    const now = new Date();
    const minutesSinceLastActivity = (now - lastActivity) / (1000 * 60);

    if (minutesSinceLastActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
      // Session expired due to inactivity
      sessionRow[SESSION_CONFIG.COLUMNS.STATUS] = SESSION_CONFIG.STATUS.EXPIRED;
      return null;
    }

    // Update last activity
    sessionRow[SESSION_CONFIG.COLUMNS.LAST_ACTIVITY] = now;

    return {
      username: sessionRow[SESSION_CONFIG.COLUMNS.USERNAME],
      email: sessionRow[SESSION_CONFIG.COLUMNS.EMAIL],
      role: sessionRow[SESSION_CONFIG.COLUMNS.ROLE]
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Gets current user info from session
 * @returns {Object} User info or null if not logged in
 */
function getCurrentUser() {
  return validateSession();
}

/**
 * Logs an audit event
 * @param {string} action - The action being performed
 * @param {string} prNumber - PR number if applicable
 * @param {Object} details - Additional details to log
 */
function logAuditEvent(action, prNumber = '', details = {}) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const auditSheet = ss.getSheetByName('Audit Log');
    if (!auditSheet) return;

    const user = getCurrentUser();
    const timestamp = new Date();

    const logRow = [
      timestamp,
      user?.username || 'System',
      action,
      prNumber,
      JSON.stringify(details),
      details.oldStatus || '',
      details.newStatus || ''
    ];

    auditSheet.appendRow(logRow);

    // Cleanup old logs if needed
    if (auditSheet.getLastRow() > LOGGING_CONFIG.MAX_LOG_ROWS) {
      const archiveSheet = ss.getSheetByName(LOGGING_CONFIG.ARCHIVE_PREFIX) ||
        ss.insertSheet(LOGGING_CONFIG.ARCHIVE_PREFIX);
      
      // Move oldest logs to archive
      const rowsToMove = auditSheet.getLastRow() - LOGGING_CONFIG.MAX_LOG_ROWS;
      const range = auditSheet.getRange(2, 1, rowsToMove, PR_CONFIG.AUDIT_COLUMNS.NEW_STATUS + 1);
      const values = range.getValues();
      
      archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, values.length, values[0].length)
        .setValues(values);
      
      auditSheet.deleteRows(2, rowsToMove);
    }

  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

