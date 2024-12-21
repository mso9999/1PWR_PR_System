/*******************************************************************************************
 * File: AppRouter.gs
 * Version: 1.4.35
 * Last Updated: 2024-12-17
 *
 * Description:
 *   Handles routing and template management for the 1PWR Purchase Request System.
 *   Manages URL routing, template creation, and page serving based on user authentication.
 *
 * Dependencies:
 *   - Config.gs: System-wide configuration settings
 *   - auth.gs: Authentication and session management
 *
 * Change Log:
 * 1.4.35 - 2024-12-17
 * - Moved configuration to Config.gs
 * - Renamed from Code.gs to AppRouter.gs for better clarity
 * - Updated file documentation
 * 
 * 1.4.34 - 2024-12-09
 * - Set sandbox mode before template evaluation
 * - Fix template evaluation with force sandbox mode
 * 
 * 1.4.33 - 2024-12-09
 * - Simplify template creation using createTemplateFromFile
 * - Fix sandbox mode error in template handling
 *******************************************************************************************/

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
  return output
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.IFRAME)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
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
    // Get session ID from URL
    const sessionId = getSessionIdFromUrl();
    console.log('Session ID from URL:', sessionId);
    
    // Check if user is authenticated
    if (sessionId) {
      const user = getCurrentUser(sessionId);
      if (user) {
        console.log('User authenticated:', user.name);
        // Create event object if it doesn't exist
        if (!currentEvent) {
          currentEvent = { parameter: {} };
        }
        // Set page parameter if not present
        if (!currentEvent.parameter.page) {
          currentEvent.parameter.page = CONFIG.VIEWS.DASHBOARD;
        }
        return handleAuthenticatedRoute(currentEvent, user);
      } else {
        console.log('Invalid session, redirecting to login');
        return createErrorPage('Your session has expired. Please log in again.');
      }
    }
    
    // Create login template if not authenticated
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
    
    console.log('Login template evaluated successfully');
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
    console.log('Serving dashboard for user:', user.name);
    
    // Get organization from URL parameter or default to empty (all orgs)
    const organization = getUrlParameter('org') || '';
    console.log('Organization filter:', organization);
    
    // Get dashboard data
    const dashboardData = getDashboardData(organization);
    
    // Create template data object
    const templateData = {
      user: user,
      data: dashboardData,
      organizations: getActiveOrganizations()
    };
    
    // Create dashboard template
    const template = HtmlService.createTemplateFromFile('BaseTemplate');
    
    // Set all includes
    template.includeSecurityHeaders = include('SecurityHeaders');
    template.includeSharedStyles = include('SharedStyles');
    template.includeScript = include('script');
    template.includeContent = include('DashboardPage');  // Match the actual file name
    
    // Set optional includes
    template.includePageSpecificStyles = include('DashboardStyles');
    template.includePageSpecificScript = include('DashboardScripts');
    template.includeHeader = include('Header');
    template.includeFooter = include('Footer');
    
    // Set template data
    template.data = templateData;
    
    // Evaluate template with all includes
    const output = template.evaluate()
      .setTitle('1PWR Purchase Request System - Dashboard')
      .setFaviconUrl('https://www.google.com/images/favicon.ico')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    
    console.log('Dashboard template evaluated successfully');
    return output;
    
  } catch (error) {
    console.error('Error serving dashboard:', error);
    return createErrorPage(error);
  }
}

/**
 * Gets the web app URL
 * @param {string} page - Optional page parameter
 * @param {Object} params - Additional URL parameters
 * @returns {string} Web app URL
 */
function getWebAppUrl(page = '', params = {}) {
  try {
    // Get base URL or construct it
    let baseUrl;
    try {
      baseUrl = ScriptApp.getService().getUrl();
    } catch (e) {
      const scriptId = ScriptApp.getScriptId();
      baseUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
    }
    
    // Combine all parameters
    const allParams = { page, ...params };
    const queryString = Object.entries(allParams)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Add parameters to URL
    return `${baseUrl}${queryString ? '?' + queryString : ''}`;
  } catch (error) {
    console.error('[AUTH] Error getting web app URL:', error);
    throw error;
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
  const page = getUrlParameter('page');
  return page === CONFIG.VIEWS.DASHBOARD || page === '';  // Default to dashboard if no page specified
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
