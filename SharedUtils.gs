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

