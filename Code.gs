/*******************************************************************************************
 * File: Code.gs
 * Version: 1.3
 * Last Updated: 2023-12-08
 *
 * Description:
 *   Main controller for the PR system. Handles routing and includes.
 *   Functionality has been split into separate files for better organization:
 *   - Login.gs: Login and authentication
 *   - PRForm.gs: PR form handling
 *   - DataLists.gs: Data retrieval
 *   - PRNumbering.gs: PR number management
 *   - ExchangeRates.gs: Currency conversion
 *   - Setup.gs: System setup and configuration
 *
 * Changes in 1.3:
 *   - Refactored into separate files for better organization
 *   - Reduced to minimal controller functionality
 *   - Improved routing and error handling
 ********************************************************************************************/

/**
 * Global configuration constants
 */
const SPREADSHEET_ID = '1QvvmP6mKJJgUe9LJJzKZQyLyiXIDCQFmRchbpGHxQtg';

/**
 * Configuration constants
 */
const CONFIG = {
  SHEETS: {
    MASTER_LOG: 'Master Log',
    PR_TRACKER: 'PR Number Tracker',
    REQUESTOR_LIST: 'Requestor List',
    APPROVER_LIST: 'Approver List',
    SITE_LIST: 'Site List',
    VENDOR_LIST: 'Vendor List',
    VEHICLE_LIST: 'Vehicle List',
    PROJECT_CATEGORIES: 'Project Categories',
    EXPENSE_TYPE: 'Expense Type',
    AUTH_LOG: 'Auth Log'
  },
  VIEWS: {
    DASHBOARD: 'dashboard',
    PR_VIEW: 'prview',
    SUBMITTED: 'submitted'
  }
};

/**
 * Column mapping for Master Log sheet
 */
const COL = {
  // Basic Information (A-T)
  PR_NUMBER: 0,              // A: PR Number
  TIMESTAMP: 1,              // B: Timestamp
  EMAIL: 2,                  // C: Email
  REQUESTOR: 3,             // D: Requestor
  DEPARTMENT: 4,            // E: Department
  PROJECT_CATEGORY: 5,      // F: Project Category
  DESCRIPTION: 6,           // G: Description
  SITE: 7,                  // H: Site
  EXPENSE_TYPE: 8,          // I: Expense Type
  VEHICLE: 9,               // J: Vehicle
  ESTIMATED_AMOUNT: 10,     // K: Estimated Amount
  CURRENCY: 11,             // L: Currency
  AMOUNT_LSL: 12,           // M: Amount (LSL)
  REQUIRED_DATE: 13,        // N: Required Date
  VENDOR: 14,               // O: Vendor
  QUOTES_REQUIRED: 15,      // P: Quotes Required
  ADJ_REQUIRED: 16,         // Q: Adjudication Required
  STATUS: 17,               // R: Status
  DAYS_OPEN: 18,           // S: Days Open
  LINE_ITEMS: 19           // T: Line Items
};

/**
 * Sets security headers for the HTML output
 * @param {HtmlOutput} output - The HTML output to set headers for
 * @returns {HtmlOutput} The HTML output with headers set
 */
function setSecurityHeaders(output) {
  const headers = output.getXFrameOptionsMode();
  headers.append('Content-Security-Policy', 
    "default-src 'self' https://script.google.com https://*.googleusercontent.com; " +
    "script-src 'self' 'unsafe-inline' https://script.google.com https://*.googleusercontent.com; " +
    "style-src 'self' 'unsafe-inline' https://script.google.com https://*.googleusercontent.com; " +
    "frame-ancestors 'self'");
  headers.append('X-Frame-Options', 'SAMEORIGIN');
  headers.append('X-Content-Type-Options', 'nosniff');
  headers.append('Permissions-Policy', 
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), document-domain=(), ' +
    'encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), ' +
    'microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), ' +
    'screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()');
  return output;
}

/**
 * Handles GET requests and routing
 * @param {Object} e - Event object
 * @returns {HtmlOutput} Rendered page
 */
function doGet(e) {
  console.log('Processing GET request:', e.parameter);
  
  try {
    // Check for session
    const sessionId = e.parameter.sid;
    if (!sessionId) {
      return setSecurityHeaders(serveLoginPage());
    }
    
    const user = getCurrentUserFromAuth(sessionId);
    if (!user) {
      return setSecurityHeaders(serveLoginPage('Session expired'));
    }
    
    // Route to appropriate page
    return setSecurityHeaders(handleAuthenticatedRoute(e, user));
    
  } catch (error) {
    console.error('Error processing request:', error);
    return setSecurityHeaders(createErrorPage(error.toString()));
  }
}

/**
 * Handles routing for authenticated users
 * @param {Object} e - Event object
 * @param {Object} user - Authenticated user
 * @returns {HtmlOutput} Rendered page
 */
function handleAuthenticatedRoute(e, user) {
  const page = e.parameter.page || CONFIG.VIEWS.DASHBOARD;
  
  switch (page) {
    case CONFIG.VIEWS.DASHBOARD:
      return serveDashboard(user);
      
    case CONFIG.VIEWS.PR_VIEW:
      const prNumber = e.parameter.pr;
      if (!prNumber) {
        return createErrorPage('PR number required');
      }
      return servePRView(prNumber);
      
    case CONFIG.VIEWS.SUBMITTED:
      return serveSubmittedView(e);
      
    default:
      return createErrorPage('Invalid page requested');
  }
}

/**
 * Includes HTML files in templates
 * @param {string} filename - Name of file to include
 * @returns {string} File contents
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Creates an error page with the given message
 * @param {string} message - The error message to display
 * @returns {HtmlOutput} The rendered error page
 */
function createErrorPage(message) {
  const template = HtmlService.createTemplateFromFile('ErrorPage');
  template.message = message;
  return template.evaluate()
    .setTitle('Error')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Gets the web app URL
 * @param {string} page - Optional page parameter
 * @returns {string} Web app URL
 */
function getWebAppUrl(page = '') {
  return getWebAppUrlFromAuth(page);
}
