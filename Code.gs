/*******************************************************************************************
 * File: Code.gs
 * Version: 1.4.0
 * Last Updated: 2024-12-08
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
 * Changes in 1.4.0:
 *   - Implement proper security headers using Apps Script native methods
 *   - Fix XFrameOptionsMode and setForceSsl implementation
 *   - Add createSecureHtmlOutput helper function
 *   - Remove custom meta tags in favor of Apps Script security methods
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
 * @param {HtmlOutput} output - The HTML output to set headers set
 * @returns {HtmlOutput} The HTML output with headers set
 */
function setSecurityHeaders(output) {
  // Set X-Frame-Options using Apps Script's built-in method
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
  // Set sandbox mode for additional security
  output.setSandboxMode(HtmlService.SandboxMode.IFRAME);
  
  return output;
}

/**
 * Creates HTML output with security settings
 * @param {string} content - HTML content to wrap
 * @returns {HtmlOutput} Secured HTML output
 */
function createSecureHtmlOutput(content) {
  const output = HtmlService.createHtmlOutput(content)
    .setTitle('1PWR Purchase Request System')
    .setFaviconUrl('https://1pwrafrica.com/wp-content/uploads/2018/11/logo.png');
    
  // Force SSL for all requests
  HtmlService.setForceSsl(true);
    
  return setSecurityHeaders(output);
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
      return createSecureHtmlOutput(serveLoginPage());
    }
    
    const user = getCurrentUserFromAuth(sessionId);
    if (!user) {
      return createSecureHtmlOutput(serveLoginPage('Session expired'));
    }
    
    // Route to appropriate page
    return createSecureHtmlOutput(handleAuthenticatedRoute(e, user));
    
  } catch (error) {
    console.error('Error processing request:', error);
    return createSecureHtmlOutput(createErrorPage(error.toString()));
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
