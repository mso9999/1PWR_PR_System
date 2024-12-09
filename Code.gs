/*******************************************************************************************
 * Main Code.gs file for the 1PWR Purchase Request System
 * @version 1.4.35
 * @lastModified 2024-12-09
 * 
 * Change Log:
 * 1.4.35 - 2024-12-09
 * - Fix template sandbox mode handling
 * - Properly set sandbox mode on template creation
 * 
 * 1.4.34 - 2024-12-09
 * - Set sandbox mode before template evaluation
 * - Fix template evaluation with force sandbox mode
 * 
 * 1.4.33 - 2024-12-09
 * - Simplify template creation using createTemplateFromFile
 * - Fix sandbox mode error in template handling
 * 
 * 1.4.32 - 2024-12-09
 * - Fix template mode error by using createHtmlOutput
 * - Simplify template creation process
 * 
 * 1.4.31 - 2024-12-09
 * - Fix template mode error by setting sandbox mode on HtmlOutput
 * - Add error handling for template creation and evaluation
 * 
 * 1.4.30 - 2024-12-09
 * - Update SPREADSHEET_ID to point to correct Google Sheet
 * - Fix spreadsheet reference for PR system
 * 
 * 1.4.29 - 2024-12-08
 * - Fix sandbox mode setting by moving it after template evaluation
 * - Add more error handling for template creation
 * 
 * 1.4.28 - 2024-12-08
 * - Fix template evaluation error by setting sandbox mode before evaluation
 * - Add check for empty base template content
 * - Improve error messages in template handling
 * 
 * 1.4.27 - 2024-12-08
 * - Use direct HTML output for error pages
 * - Fix sandbox mode handling
 * 
 * 1.4.26 - 2024-12-08
 * - Add defensive template handling
 * - Update include function to handle errors
 * 
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
  SPREADSHEET_ID: '12QgLxtavdCa9FkfTeMDogXA0COYBCxmUZKHDXybOzaU',
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
  // Let Google Apps Script handle CSP
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.IFRAME);
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
 * Includes HTML files in templates
 * @param {string} filename - Name of file to include
 * @returns {string} File contents or empty string if error
 */
function include(filename) {
  try {
    if (!filename) return '';
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    console.error('Error including file:', filename, error);
    return '';
  }
}

/**
 * Gets the template for the current user
 * @returns {HtmlOutput} The template for the current user
 */
function getTemplateForUser() {
  try {
    // Create template from base
    const template = HtmlService.createTemplateFromFile('BaseTemplate');
    
    // Set all includes
    template.includeSecurityHeaders = include('SecurityHeaders');
    template.includeSharedStyles = include('SharedStyles');
    template.includeScript = include('script');
    template.includeContent = include('LoginPage');
    
    // Set optional includes
    template.includePageSpecificStyles = '';
    template.includePageSpecificScript = include('LoginScripts');
    template.includeHeader = '';
    template.includeFooter = '';
    
    // Evaluate template with all includes
    const output = template.evaluate()
      .setTitle('1PWR Purchase Request System')
      .setFaviconUrl('https://www.google.com/images/favicon.ico')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    
    console.log('Template evaluated successfully');
    return output;
      
  } catch (error) {
    console.error('Error getting template:', error);
    return createErrorPage(error);
  }
}

/**
 * Creates an error page with the given message
 * @param {string} error - The error to display
 * @returns {HtmlOutput} The error page
 */
function createErrorPage(error) {
  // Create a simple error page without using templates
  const html = `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <title>Error</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 40px; 
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .error { 
      color: #d32f2f;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #1976d2;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
    .button:hover {
      background-color: #1565c0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 class="error">Error</h2>
    <p>${error}</p>
    <a href="/" class="button">Return to Login</a>
  </div>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Error')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
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
    return getTemplateForUser();
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return createErrorPage(error);
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
 * Serves the dashboard page with data for the authenticated user
 * @param {Object} user - Authenticated user object
 * @returns {HtmlOutput} Dashboard page
 */
function serveDashboard(user) {
  try {
    // Get organization from URL parameter or default to empty (all orgs)
    const organization = getUrlParameter('org') || '';
    
    // Get dashboard data
    const dashboardData = getDashboardData(organization);
    
    // Create template data object
    const templateData = {
      user: user,
      data: dashboardData,
      organizations: getActiveOrganizations()
    };

    // Create HTML template
    const template = HtmlService.createTemplateFromFile('DashboardPage');
    template.data = templateData;
    
    // Evaluate template and set security headers
    const output = template.evaluate()
      .setTitle('1PWR PR System - Dashboard')
      .setFaviconUrl('https://www.google.com/favicon.ico');
    
    return setSecurityHeaders(output);
  } catch (error) {
    console.error('Error serving dashboard:', error);
    return createErrorPage('Failed to load dashboard. Please try again later.');
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

// Store event object globally for parameter access
let currentEvent = null;
