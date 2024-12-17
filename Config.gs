/*******************************************************************************************
 * File: Config.gs
 * Version: 1.0
 * Created: 2024-12-17
 *
 * Description:
 *   Central configuration file for the 1PWR Purchase Request System.
 *   Contains all system-wide constants and configuration settings.
 *******************************************************************************************/

const CONFIG = {
  // Spreadsheet IDs
  SPREADSHEET_ID: '12QgLxtavdCa9FkfTeMDogXA0COYBCxmUZKHDXybOzaU',
  
  // Sheet Names
  SHEETS: {
    MASTER_LOG: 'Master Log',
    PR_TRACKER: 'PR Number Tracker',
    REQUESTOR_LIST: 'Requestor List',
    ACTIVE_SESSIONS: 'ActiveSessions',
    EXCHANGE_RATES: 'Exchange Rates',
    VENDORS: 'Vendors',
    DEPARTMENTS: 'Departments',
    CATEGORIES: 'Categories',
    CURRENCIES: 'Currencies',
    STATUS_WORKFLOW: 'Status Workflow',
    EMAIL_TEMPLATES: 'Email Templates',
    SYSTEM_SETTINGS: 'System Settings'
  },
  
  // Session Settings
  SESSION: {
    DURATION: 21600, // 6 hours in seconds
    PREFIX: '1pwr_session_'
  },
  
  // URL Settings
  URL: {
    BASE_PATH: ScriptApp.getService().getUrl(),
    PAGES: {
      LOGIN: 'login',
      DASHBOARD: 'dashboard',
      PR_FORM: 'prform',
      PR_VIEW: 'prview'
    }
  },
  
  // System Settings
  SYSTEM: {
    DEFAULT_TIMEZONE: 'Africa/Maseru',
    DATE_FORMAT: 'yyyy-MM-dd',
    DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
    CURRENCY_FORMAT: '#,##0.00',
    DEFAULT_CURRENCY: 'LSL'
  },
  
  // Email Settings
  EMAIL: {
    FROM_NAME: '1PWR Purchase Request System',
    NOTIFICATION_TYPES: {
      PR_CREATED: 'PR_CREATED',
      PR_UPDATED: 'PR_UPDATED',
      STATUS_CHANGED: 'STATUS_CHANGED',
      APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
      COMMENT_ADDED: 'COMMENT_ADDED'
    }
  },
  
  // Security Settings
  SECURITY: {
    ROLES: {
      ADMIN: 'admin',
      FINANCE: 'finance',
      REQUESTOR: 'requestor',
      APPROVER: 'approver'
    },
    MIN_PASSWORD_LENGTH: 8,
    SESSION_COOKIE_NAME: '1pwr_session'
  }
};

// Prevent modifications to the CONFIG object
Object.freeze(CONFIG);
Object.keys(CONFIG).forEach(key => {
  if (typeof CONFIG[key] === 'object') {
    Object.freeze(CONFIG[key]);
  }
});
