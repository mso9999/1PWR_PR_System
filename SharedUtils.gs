/**
 * SharedUtils.gs (Refactored)
 * Core Configuration and Session Management
 */

/**
 * Role hierarchy configuration
 */
const ROLE_HIERARCHY = {
  'procurement': ['procurement'],
  'finance': ['procurement', 'finance'],
  'approver': ['procurement', 'approver'],
  'requestor': ['procurement', 'finance', 'approver', 'requestor']
};

/**
 * Session management configuration
 */
const SESSION_CONFIG = {
  SHEET_NAME: 'Session Log',
  CLEANUP_FREQUENCY: 60,
  INACTIVITY_TIMEOUT: 30,
  SESSION_DURATION: 1440,
  COLUMNS: {
    SESSION_ID: 0,
    TIMESTAMP: 1,
    USERNAME: 2,
    EMAIL: 3,
    ROLE: 4,
    LAST_ACTIVITY: 5,
    STATUS: 6
  },
  STATUS: {
    ACTIVE: 'Active',
    EXPIRED: 'Expired'
  }
};

/**
 * Authentication configuration
 */
const AUTH_CONFIG = {
  VALID_ROLES: ['requestor', 'procurement', 'finance', 'approver'],
  DEFAULT_ROLE: 'requestor',
  COLUMN_INDICES: {
    NAME: 0,      // Column A: Name
    EMAIL: 1,     // Column B: Email
    DEPT: 2,      // Column C: Department
    ACTIVE: 3,    // Column D: Active (Y/N)
    PASSWORD: 4,  // Column E: Password
    ROLE: 5       // Column F: Role
  }
};

/**
 * SharedUtils namespace for utility functions
 */
var SharedUtils = {
  /**
   * Gets active requestors from the Requestor List sheet
   * @returns {Array<Object>} Array of active requestor objects
   */
  getActiveRequestors: function() {
    try {
      Logger.log('Starting getActiveRequestors');
      
      // Get the spreadsheet ID from Code.gs
      const SPREADSHEET_ID = '1LG-qn2ELxE-gHWbOPPz1ARL-QUSTbGOdrTLTBT3x9BE';
      
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
      if (data.length <= 1) {
        Logger.log('No data found in sheet');
        return [];
      }

      Logger.log('Sheet headers:', data[0]);

      // Skip header row and filter active users
      const users = data.slice(1)
        .filter(row => {
          Logger.log('Processing row:', row);
          const isActive = row[AUTH_CONFIG.COLUMN_INDICES.ACTIVE].toString().toUpperCase() === 'Y';
          Logger.log('Is active:', isActive);
          return isActive;
        })
        .map(row => {
          const user = {
            name: row[AUTH_CONFIG.COLUMN_INDICES.NAME],
            email: row[AUTH_CONFIG.COLUMN_INDICES.EMAIL],
            department: row[AUTH_CONFIG.COLUMN_INDICES.DEPT],
            role: row[AUTH_CONFIG.COLUMN_INDICES.ROLE]
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
  },

  /**
   * Validates session and returns user info
   * @returns {Object} User session info or null if invalid
   */
  validateSession: function() {
    try {
      const SPREADSHEET_ID = '1LG-qn2ELxE-gHWbOPPz1ARL-QUSTbGOdrTLTBT3x9BE';
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
        sessionRow[SESSION_CONFIG.COLUMNS.STATUS] = SESSION_CONFIG.STATUS.EXPIRED;
        return null;
      }

      sessionRow[SESSION_CONFIG.COLUMNS.LAST_ACTIVITY] = now;

      return {
        username: sessionRow[SESSION_CONFIG.COLUMNS.USERNAME],
        email: sessionRow[SESSION_CONFIG.COLUMNS.EMAIL],
        role: sessionRow[SESSION_CONFIG.COLUMNS.ROLE]
      };

    } catch (error) {
      Logger.log('Session validation error:', error);
      return null;
    }
  },

  /**
   * Gets current user info from session
   * @returns {Object} User info or null if not logged in
   */
  getCurrentUser: function() {
    return this.validateSession();
  }
};

