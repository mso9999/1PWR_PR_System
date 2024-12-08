/*******************************************************************************************
 * Main Code.gs file for the 1PWR Purchase Request System
 * @version 1.4.25
 * @lastModified 2024-12-08
 * 
 * Change Log:
 * 1.4.25 - 2024-12-08
 * - Update template handling to always return login page by default
 * 
 * 1.4.24 - 2024-12-08
 * - Update getUrlParameter to use event parameter
 * 
 * 1.4.23 - 2024-12-08
 * - Fix error page creation and sandbox mode
 * 
 * 1.4.22 - 2024-12-08
 * - Fix URL parsing to work in Google Apps Script environment
 * 
 * 1.4.21 - 2024-12-08
 * - Add session ID to error page when validation fails
 * 
 * 1.4.20 - 2024-12-08
 * - Fix isLoginPage to get session ID from URL parameters
 * 
 * 1.4.19 - 2024-12-08
 * - Move SPREADSHEET_ID into CONFIG object for consistency
 * 
 * 1.4.18 - 2024-12-08
 * - Add fallback error handling for error page creation
 * 
 * 1.4.17 - 2024-12-08
 * - Add sandbox mode to error page
 * 
 * 1.4.16 - 2024-12-08
 * - Remove setSandboxMode from setSecurityHeaders to avoid double setting
 * 
 * 1.4.15 - 2024-12-08
 * - Initialize page specific styles to null in template
 * 
 * 1.4.14 - 2024-12-08
 * - Fix session validation function name (isValidSession -> validateSession)
 * 
 * 1.4.13 - 2024-12-08
 * - Remove SharedUtils include from BaseTemplate (it's a .gs file)
 * 
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
 * Configuration constants
 */
const CONFIG = {
  SPREADSHEET_ID: '1QvvmP6mKJJgUe9LJJzKZQyLyiXIDCQFmRchbpGHxQtg',
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

// For backward compatibility
const SPREADSHEET_ID = CONFIG.SPREADSHEET_ID;

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
  // Set Content Security Policy
  output.addMetaTag('Content-Security-Policy', 
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' " +
    "https://apis.google.com https://1pwrafrica.com https://www.google.com " +
    "https://accounts.google.com https://ssl.gstatic.com https://www.gstatic.com " +
    "https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "img-src * data: https:; " +
    "connect-src 'self' https://apis.google.com https://accounts.google.com; " +
    "frame-src 'self' https://accounts.google.com https://apis.google.com;"
  );
  
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
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
    // Store event object globally
    currentEvent = e;
    console.log('Event parameters:', e ? JSON.stringify(e.parameter) : 'none');
    
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
    
    // Create a basic error page without template
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { color: #d32f2f; }
            .container { max-width: 600px; margin: 0 auto; }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #1976d2;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Error</h1>
            <p>${error.toString()}</p>
            <p>Session ID: ${getSessionIdFromUrl() || 'none'}</p>
            <a href="${ScriptApp.getService().getUrl()}" class="button">Back to Home</a>
          </div>
        </body>
      </html>
    `;
    
    return HtmlService.createHtmlOutput(errorHtml)
      .setTitle('Error')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY);
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
 * @param {string} sessionId - Session ID to include in error page
 * @returns {HtmlOutput} The rendered error page
 */
function createErrorPage(message, sessionId) {
  try {
    const template = HtmlService.createTemplateFromFile('ErrorPage');
    template.message = message;
    template.sessionId = sessionId;
    template.includeSharedStyles = include('SharedStyles');
    return template.evaluate()
      .setTitle('Error')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    // Fallback to basic error page if template fails
    console.error('Error creating error page:', error);
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { color: #d32f2f; }
            .container { max-width: 600px; margin: 0 auto; }
            .button { 
              display: inline-block; 
              padding: 10px 20px; 
              background: #1976d2; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin-top: 20px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Error</h1>
            <p>${message}</p>
            <p>Session ID: ${sessionId}</p>
            <a href="<?= getWebAppUrl() ?>" class="button">Back to Home</a>
          </div>
        </body>
      </html>
    `)
    .setTitle('Error')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
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
  template.includeSharedStyles = include('SharedStyles');
  template.includeScript = include('script');
  
  // Initialize page specific includes
  template.includePageSpecificStyles = null;
  template.includePageSpecificScript = null;
  template.includeHeader = null;
  template.includeContent = null;
  template.includeFooter = null;
  
  // Page specific content
  if (isDashboardPage()) {
    template.includeContent = include('DashboardPage');
    template.includePageSpecificScript = include('DashboardScripts');
    template.includePageSpecificStyles = include('DashboardStyles');
  } else if (isPRFormPage()) {
    template.includeContent = include('PRFormPage');
    template.includePageSpecificScript = include('PRFormScripts');
    template.includeHeader = include('PRFormComponents');
  } else if (isPRViewPage()) {
    template.includeContent = include('PRView');
    template.includePageSpecificScript = include('PRViewScripts');
  } else {
    // Default to login page if no other page is selected or session is invalid
    template.includeContent = include('LoginPage');
    template.includePageSpecificScript = include('LoginScripts');
  }
  
  // Ensure all includes have a value to prevent null mode errors
  template.includePageSpecificStyles = template.includePageSpecificStyles || '';
  template.includePageSpecificScript = template.includePageSpecificScript || '';
  template.includeHeader = template.includeHeader || '';
  template.includeContent = template.includeContent || '';
  template.includeFooter = template.includeFooter || '';
  
  return template;
}

// Store event object globally for parameter access
let currentEvent = null;

/**
 * Gets URL parameters from the current request
 * @param {string} paramName - Name of parameter to get
 * @returns {string} Parameter value or empty string
 */
function getUrlParameter(paramName) {
  try {
    // First try to get parameter from event object
    if (currentEvent && currentEvent.parameter && currentEvent.parameter[paramName]) {
      return currentEvent.parameter[paramName];
    }
    
    // Fallback to URL parsing if no event parameter
    const url = ScriptApp.getService().getUrl();
    const params = url.split('?')[1];
    if (!params) return '';
    
    const paramPairs = params.split('&');
    for (const pair of paramPairs) {
      const [key, value] = pair.split('=');
      if (key === paramName) {
        return decodeURIComponent(value || '');
      }
    }
    return '';
  } catch (error) {
    console.error('Error getting URL parameter:', error);
    return '';
  }
}

/**
 * Page type checks
 */
function isLoginPage() {
  const sessionId = getUrlParameter('sessionId');
  console.log('Checking session:', sessionId);
  
  try {
    const isValid = validateSession(sessionId);
    console.log('Session validation result:', isValid);
    return !sessionId || !isValid;
  } catch (error) {
    console.error('Error validating session:', error, 'sessionId:', sessionId);
    return true;
  }
}

function isPRFormPage() {
  return getUrlParameter('page') === 'form' || getUrlParameter('page') === '';
}

function isPRViewPage() {
  return getUrlParameter('page') === 'view';
}

function isDashboardPage() {
  return getUrlParameter('page') === 'dashboard';
}

function getPageFromUrl() {
  return getUrlParameter('page') || '';
}

function getSessionIdFromUrl() {
  return getUrlParameter('sessionId');
}
