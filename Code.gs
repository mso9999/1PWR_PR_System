/*******************************************************************************************
 * Main Code.gs file for the 1PWR Purchase Request System
 * @version 1.4.12
 * @lastModified 2024-12-08
 * 
 * Change Log:
 * 1.4.12 - 2024-12-08
 * - Update ErrorPage.html to use BaseTemplate structure
 * 
 * 1.4.11 - 2024-12-08
 * - Fix style include in ErrorPage.html to use include function directly
 * 
 * 1.4.10 - 2024-12-08
 * - Add SharedStyles include to error page template
 * 
 * 1.4.9 - 2024-12-08
 * - Fix PRView template include name
 * 
 * 1.4.8 - 2024-12-08
 * - Make template variable names consistent with new file structure
 * - Fix style include variables in BaseTemplate.html and Code.gs
 * 
 * 1.4.7 - 2024-12-08
 * - Fix template include name for SharedStyles.html
 * 
 * 1.4.6 - 2024-12-08
 * - Refactored template system to use BaseTemplate.html
 * - Updated file naming convention for consistency
 * - Simplified doGet function to use new template system
 * 
 * 1.4.5 - 2024-12-08
 * - Update PR number fetching logic
 * - Add null checks for DOM elements
 * 
 * 1.4.4 - 2024-12-08
 * - Update sandbox mode to prevent sandbox escape
 * - Remove unrecognized features from permissions policy
 * 
 * 1.4.3 - 2024-12-08
 * - Remove setForceSsl as Apps Script enforces HTTPS by default
 * 
 * 1.4.2 - 2024-12-08
 * - Fix setForceSsl implementation to use correct HtmlService method
 * 
 * 1.4.1 - 2024-12-08
 * - Fix setForceSsl implementation to use correct method chain
 * 
 * 1.4.0 - 2024-12-08
 * - Implement proper security headers using Apps Script native methods
 * - Fix XFrameOptionsMode and setForceSsl implementation
 * - Add createSecureHtmlOutput helper function
 * - Remove custom meta tags in favor of Apps Script security methods
 * 
 * 1.3.0 - Previous version
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
  // Note: We only use allow-scripts without allow-same-origin to prevent sandbox escape
  output.setSandboxMode(HtmlService.SandboxMode.NATIVE);
  
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
    
  return setSecurityHeaders(output);
}

/**
 * Handles GET requests and routing
 * @param {Object} e - Event object
 * @returns {HtmlOutput} Rendered page
 */
function doGet(e) {
  try {
    // Get template based on user state
    const template = getTemplateForUser();
    
    return template
      .evaluate()
      .setTitle('1PWR Purchase Request System')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setFaviconUrl('https://www.google.com/images/favicon.ico');
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return HtmlService.createHtmlOutput(createErrorPage(error.toString()))
      .setTitle('Error')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
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
  template.includeSharedStyles = include('SharedStyles');
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

/**
 * Gets the template for the current user
 * @returns {Template} The template for the current user
 */
function getTemplateForUser() {
  const template = HtmlService.createTemplateFromFile('BaseTemplate');
  
  // Common includes
  template.includeSecurityHeaders = include('SecurityHeaders');
  template.includeSharedUtils = include('SharedUtils');
  template.includeSharedStyles = include('SharedStyles');
  template.includeScript = include('script');
  
  // Page specific content
  if (isLoginPage()) {
    template.includeContent = include('LoginPage');
    template.includePageSpecificScript = include('LoginScripts');
  } else if (isPRFormPage()) {
    template.includeContent = include('PRFormPage');
    template.includePageSpecificScript = include('PRFormScripts');
    template.includeHeader = include('PRFormComponents');
  } else if (isPRViewPage()) {
    template.includeContent = include('PRView');
    template.includePageSpecificScript = include('PRViewScripts');
  } else if (isDashboardPage()) {
    template.includeContent = include('DashboardPage');
    template.includePageSpecificScript = include('DashboardScripts');
    template.includePageSpecificStyles = include('DashboardStyles');
  }
  
  return template;
}

/**
 * Page type checks
 */
function isLoginPage() {
  return !Session.getActiveUser().getEmail() || !isValidSession();
}

function isPRFormPage() {
  const page = getPageFromUrl();
  return page === 'form' || page === '';
}

function isPRViewPage() {
  return getPageFromUrl() === 'view';
}

function isDashboardPage() {
  return getPageFromUrl() === 'dashboard';
}

function getPageFromUrl() {
  const url = ScriptApp.getService().getUrl();
  const params = new URL(url).searchParams;
  return params.get('page') || '';
}
