/*******************************************************************************************
 * File: Code.gs
 * Description:
 *   This server-side script file contains all the Google Apps Script functions that handle
 *   data processing, retrieval, and storage for the custom purchase request web app. It
 *   interacts with the Google Sheets backend to fetch data for dropdowns, generate PR numbers,
 *   process form submissions, and perform validations.
 *
 * Relationship with Other Files:
 *   - index.html: The client-side HTML structure that interacts with these server-side functions
 *     through the google.script.run API.
 *   - script.html: Contains client-side JavaScript that calls these server-side functions to
 *     populate dropdowns and submit form data.
 *   - style.html: Defines the CSS styles for the web app interface.
 *
 * Data Framework:
 *   - The script interacts with several sheets in a Google Spreadsheet, identified by the
 *     SPREADSHEET_ID constant.
 *   - Sheets include "Requestor List", "Org List", "Expense Type", "Vendor List", "Approver List",
 *     "Site List", "Vehicle List", and others.
 *   - Data is fetched, processed, and returned to the client-side scripts for dynamic content
 *     rendering.
 *******************************************************************************************/

// Spreadsheet ID for the system
const SPREADSHEET_ID = '12QgLxtavdCa9FkfTeMDogXA0COYBCxmUZKHDXybOzaU';

/**
 * Global Configuration for 1PWR Procurement System
 */
const CONFIG = {
  // =============================
  // Spreadsheet Configuration
  // =============================

  // Spreadsheet ID
  SPREADSHEET_ID: '12QgLxtavdCa9FkfTeMDogXA0COYBCxmUZKHDXybOzaU',

  // Sheet Names
  SHEET_NAME: '1PWR PR MASTER TRACKING_New',
  MASTER_LOG_TAB: 'Master Log',
  CONFIG_TAB: 'Configuration',
  HISTORY_TAB: 'Landing Date History',
  NOTIFICATION_TAB: 'Notification Log',
  ORGANIZATIONS_TAB: 'Org List',
  REQUESTOR_SHEET_NAME: 'Requestor List',
  AUTH_LOG_TAB: 'Auth Log',
  SESSION_LOG_TAB: 'Session Log',
  PR_TRACKER_TAB: 'PR Number Tracker',
  PO_TRACKER_TAB: 'PO Number Tracker',
  AUDIT_LOG_TAB: 'Audit Log',

  // View Sheet Names
  IN_QUEUE_VIEW: 'In Queue',
  ORDERED_VIEW: 'Ordered',
  PURCHASE_ORDER_VIEW: 'Purchase Order',
  SUBMITTED_VIEW: 'Submitted',
  REVISE_RESUBMIT_VIEW: 'Revise & Resubmit',
  COMPLETED_VIEW: 'Completed',
  REJECTED_VIEW: 'Rejected',
  CANCELED_VIEW: 'Canceled',

  // Reference Sheet Names
  VENDOR_LIST_TAB: 'Vendor List',
  APPROVER_LIST_TAB: 'Approver List',
  DEPARTMENT_LIST_TAB: 'Department List',
  PROJECT_CATEGORIES_TAB: 'Project Categories',
  SITE_LIST_TAB: 'Site List',
  EXPENSE_TYPE_TAB: 'Expense Type',
  VEHICLE_LIST_TAB: 'Vehicle List',

  // =============================
  // System Configuration
  // =============================
  
  // Purchase Order Prefix
  PO_PREFIX: 'PO-2024-',

  // Email Addresses
  PROCUREMENT_EMAIL: 'procurement@1pwrafrica.com',
  SYSTEM_ADMIN_EMAIL: 'admin@1pwrafrica.com',
  FINANCE_EMAIL: 'finance@1pwrafrica.com',

  // System Limits and Timers
  MAX_FUTURE_MONTHS: 6,
  AUTO_CANCEL_WARNING_DAYS: 30,
  AUTO_CANCEL_DAYS: 40,
  CUSTOMS_WARNING_DAYS: 5
};

/**
 * Column mappings for the Master Log sheet
 */
const COL = {
  // Basic Information (A-T)
  PR_NUMBER: 0,              // A: PR Number
  TIMESTAMP: 1,              // B: Timestamp
  EMAIL: 2,                  // C: Email
  REQUESTOR_NAME: 3,         // D: Requestor Name
  DEPARTMENT: 4,             // E: Requestor Department
  DESCRIPTION: 5,            // F: Request Short Description
  PROJECT_CATEGORY: 6,       // G: Project Category
  ORGANIZATION: 7,           // H: Acquiring Organization
  CURRENCY: 8,               // I: Currency
  PAYMENT_FORMAT: 9,         // J: Payment Format
  SITE_LOCATION: 10,         // K: Site Location(s)
  EXPENSE_TYPE: 11,          // L: Expense Type(s)
  REQUEST_CONTEXT: 12,       // M: Request Context
  VEHICLE: 13,              // N: Vehicle
  BUDGET_STATUS: 14,        // O: Budget Approval Status
  DEADLINE_DATE: 15,        // P: Deadline Date
  VENDOR: 16,               // Q: Vendor
  URGENCY: 17,              // R: Urgency Status
  APPROVER: 18,             // S: Approver
  REQUESTOR_NOTES: 19,      // T: Requestor Notes

  // Status and Amount (U-V)
  PR_STATUS: 20,            // U: PR Status
  PR_AMOUNT: 21,            // V: PR Amount

  // Controls and Override (W-AA)
  QUOTES_REQUIRED: 22,      // W: 3 Quotes Required
  CONTROLS_OVERRIDE: 23,    // X: Controls Override (Y/N)
  OVERRIDE_JUSTIFICATION: 24, // Y: Override Justification
  OVERRIDE_DATE: 25,        // Z: Override Date
  OVERRIDE_BY: 26,          // AA: Override By

  // Quote Management (AB-AF)
  LINK_TO_QUOTES: 27,       // AB: Link to Quotes
  QUOTES_DATE: 28,          // AC: Quotes Date
  ADJ_REQUIRED: 29,         // AD: Adjudication Required
  LINK_TO_ADJ: 30,          // AE: Link to Adj. Notes
  ADJ_DATE: 31,            // AF: Adj. Date

  // PR/PO Processing (AG-AN)
  PR_READY: 32,            // AG: PR Ready
  PO_ISSUED: 33,           // AH: PO # Issued
  PO_DATE: 34,             // AI: PO Date
  PO_STATUS: 35,           // AJ: PO Status
  PO_APPROVED_DATE: 36,    // AK: PO Approved Date
  PO_NUMBER: 37,           // AL: PO Number
  LINK_TO_POP: 38,         // AM: Link to PoP
  PAYMENT_DATE: 39,        // AN: Payment Date

  // Shipping and Delivery (AO-AY)
  EXPECTED_SHIPPING_DATE: 40, // AO: Expected Shipping Date
  EXPECTED_LANDING_DATE: 41,  // AP: Expected Landing Date
  SHIPPED_STATUS: 42,         // AQ: Shipped
  SHIPMENT_DATE: 43,         // AR: Shipment Date
  CUSTOMS_REQUIRED: 44,       // AS: Customs Clearance Required
  LINK_TO_CLEARANCE: 45,      // AT: Link to Clearance Docs
  CUSTOMS_SUBMISSION_DATE: 46, // AU: Customs Submission Date
  CUSTOMS_CLEARED: 47,        // AV: Customs Cleared
  DATE_CLEARED: 48,           // AW: Date Cleared
  GOODS_LANDED: 49,           // AX: Goods Landed
  LANDED_DATE: 50,            // AY: Landed Date

  // Metrics and Tracking (AZ-BE)
  DAYS_OPEN: 51,              // AZ: Days Open
  QUEUE_POSITION: 52,         // BA: Queue Position
  COMPLETION_PERCENTAGE: 53,   // BB: % Completed
  TIME_TO_SHIP: 54,           // BC: Time to Ship
  TIME_IN_CUSTOMS: 55,        // BD: Time in Customs
  TIME_TO_LAND: 56,           // BE: Time to Land

  // Notes and Line Items (BF-BJ)
  PROCUREMENT_NOTES: 57,      // BF: Procurement Notes
  ITEM: 58,                   // BG: Item
  QUANTITY: 59,               // BH: QTY
  UOM: 60,                    // BI: UOM
  URL: 61                     // BJ: URL
};

// Add backwards compatibility aliases
const STATUS = COL.PR_STATUS;  // Maintain compatibility with existing code using STATUS
const AMOUNT = COL.PR_AMOUNT;  // Maintain compatibility with existing code using AMOUNT

function doGet(e) {
  try {
    Logger.log('doGet: Started with parameters: ' + JSON.stringify(e));
    const nonce = generateNonce();

    // Handle dashboard page
    if (e.parameter.page === 'dashboard') {
      Logger.log('doGet: Dashboard page requested');
      
      // Get session ID from URL parameters
      const sessionId = e.parameter.sessionId;
      Logger.log('doGet: Checking sessionId: ' + sessionId);
      
      // Validate session and get user info
      const session = getCurrentUser(sessionId);
      Logger.log('doGet: Session data: ' + (session ? JSON.stringify(session) : 'null'));
      
      if (!session) {
        Logger.log('doGet: Invalid session, redirecting to login');
        const template = HtmlService.createTemplateFromFile('Login');
        template.nonce = nonce;
        return template.evaluate()
          .setTitle('Login - 1PWR Procurement')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }
      
      Logger.log('doGet: Valid session, loading dashboard');
      // Create dashboard page
      const template = HtmlService.createTemplateFromFile('DashboardWeb');
      template.user = session;
      template.nonce = nonce;
      
      Logger.log('doGet: Dashboard template created with user: ' + JSON.stringify(template.user));
      return template.evaluate()
        .setTitle('Dashboard - 1PWR Procurement')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // Default to login page
    Logger.log('doGet: No page parameter, showing login page');
    const template = HtmlService.createTemplateFromFile('Login');
    template.nonce = nonce;
    return template.evaluate()
      .setTitle('Login - 1PWR Procurement')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log('doGet: Error occurred: ' + error);
    console.error('Error in doGet:', error);
    throw error;
  }
}

/**
 * Gets the session data from cache
 */
function getSession(sessionId) {
  Logger.log('getSession: Started with sessionId: ' + sessionId);
  if (!sessionId) {
    Logger.log('getSession: No sessionId provided');
    return null;
  }
  try {
    const sessionData = CacheService.getUserCache().get(sessionId);
    Logger.log('getSession: Retrieved session data: ' + sessionData);
    const parsedSession = sessionData ? JSON.parse(sessionData) : null;
    Logger.log('getSession: Parsed session: ' + (parsedSession ? JSON.stringify(parsedSession) : 'null'));
    return parsedSession;
  } catch (error) {
    Logger.log('getSession: Error: ' + error);
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Includes HTML files in templates
 * @param {string} filename - Name of file to include
 * @returns {string} File contents
 */
function include(filename) {
  Logger.log('Including file: ' + filename);
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    Logger.log('ERROR: Error including file: ' + filename + ' - ' + error.toString());
    console.error('Error including file:', filename, error);
    throw new Error(`Failed to include file ${filename}: ${error.message}`);
  }
}

/**
 * Validates the configuration
 * @returns {boolean} Whether the configuration is valid
 */
function validateConfig() {
  try {
    // Verify spreadsheet access
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    if (!ss) return false;

    // Verify required sheets exist
    const requiredSheets = [
      CONFIG.MASTER_LOG_TAB,
      CONFIG.CONFIG_TAB,
      CONFIG.HISTORY_TAB,
      CONFIG.NOTIFICATION_TAB,
      CONFIG.ORGANIZATIONS_TAB
    ];

    for (const sheetName of requiredSheets) {
      if (!ss.getSheetByName(sheetName)) {
        Logger.log(`ERROR: Required sheet missing: ${sheetName}`);
        return false;
      }
    }

    // Verify critical config values
    const requiredConfig = [
      'SPREADSHEET_ID',
      'PROCUREMENT_EMAIL',
      'SYSTEM_ADMIN_EMAIL',
      'FINANCE_EMAIL'
    ];

    for (const key of requiredConfig) {
      if (!CONFIG[key]) {
        Logger.log(`ERROR: Required config missing: ${key}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    Logger.log('ERROR: Configuration validation failed: ' + error.toString());
    return false;
  }
}

/**
 * Gets the configuration object
 * @returns {Object} The system configuration
 */
function getConfig() {
  if (!validateConfig()) {
    throw new Error('Invalid system configuration');
  }
  return CONFIG;
}

/**
 * Gets the column mapping
 * @returns {Object} The column mapping object with backwards compatibility
 */
function getColumnMapping() {
  return {
    ...COL,
    STATUS,
    AMOUNT
  };
}

function testDeployment() {
  try {
    // Get the deployed web app URL
    const webAppUrl = ScriptApp.getService().getUrl();
    Logger.log('Web App URL: ' + webAppUrl);
    
    // Check if the script is bound to a spreadsheet
    const boundSpreadsheet = SpreadsheetApp.getActive();
    Logger.log('Bound to spreadsheet: ' + !!boundSpreadsheet);
    
    // Check script properties
    const scriptProperties = PropertiesService.getScriptProperties();
    const deploymentId = scriptProperties.getProperty('DEPLOYMENT_ID');
    Logger.log('Deployment ID: ' + deploymentId);
    
    // Test basic sheet access
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.MASTER_LOG_TAB);
    Logger.log('Can access Master Log sheet: ' + !!sheet);
    
    return {
      success: true,
      webAppUrl: webAppUrl,
      boundToSpreadsheet: !!boundSpreadsheet,
      hasDeploymentId: !!deploymentId,
      canAccessSheet: !!sheet
    };
  } catch (error) {
    Logger.log('ERROR: Deployment test failed: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

function verifyExecutionContext() {
  try {
    const effectiveUser = Session.getEffectiveUser().getEmail();
    const activeUser = Session.getActiveUser().getEmail();
    
    Logger.log('Effective user: ' + effectiveUser);
    Logger.log('Active user: ' + activeUser);
    
    return {
      effectiveUser: effectiveUser,
      activeUser: activeUser,
      scriptId: ScriptApp.getScriptId(),
      triggersExist: ScriptApp.getProjectTriggers().length > 0
    };
  } catch (error) {
    Logger.log('ERROR: Execution context verification failed: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Handles routing for authenticated users
 */
function handleAuthenticatedRoute(e, user) {
  switch (e.parameter.page) {
    case 'submitted':
      return serveSubmittedView(e);
      
    case 'prview':
      if (!e.parameter.pr) {
        return createErrorPage('PR number required');
      }
      return handlePRView(e.parameter.pr);
      
    case 'form':
      const template = HtmlService.createTemplateFromFile('index');
      template.user = user;
      return template.evaluate()
        .setTitle('Submit Purchase Request')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setFaviconUrl('https://1pwrafrica.com/wp-content/uploads/2018/11/logo.png');

    default:
      // Serve dashboard
      const dashTemplate = HtmlService.createTemplateFromFile('DashboardWeb');
      dashTemplate.user = user;
      dashTemplate.deploymentUrl = ScriptApp.getService().getUrl();
      return dashTemplate.evaluate()
        .setTitle('Dashboard')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Sets up initial system configuration
 * Should be run once during deployment
 */
function setupSystem() {
  // Create necessary sheets if they don't exist
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Active Sessions sheet
  if (!ss.getSheetByName(SESSION_CONFIG.SHEET_NAME)) {
    const sessionsSheet = ss.insertSheet(SESSION_CONFIG.SHEET_NAME);
    sessionsSheet.getRange('A1:G1').setValues([[
      'Session ID', 'Username', 'Email', 'Role', 
      'Created At', 'Last Activity', 'Device Info'
    ]]);
    sessionsSheet.setFrozenRows(1);
  }
  
  // Auth Log sheet
  if (!ss.getSheetByName('Auth Log')) {
    const logSheet = ss.insertSheet('Auth Log');
    logSheet.getRange('A1:E1').setValues([[
      'Timestamp', 'Username', 'Event Type', 'Success', 'Details'
    ]]);
    logSheet.setFrozenRows(1);
  }
  
  // Submission Log sheet
  if (!ss.getSheetByName('Submission Log')) {
    const subSheet = ss.insertSheet('Submission Log');
    subSheet.getRange('A1:G1').setValues([[
      'Timestamp', 'PR Number', 'Submitted By', 
      'Email', 'Department', 'Description', 'Form Data'
    ]]);
    subSheet.setFrozenRows(1);
  }
  
  // Set up cleanup trigger
  setupSessionCleanup();
  
  return 'System setup complete';
}

// Function to serve the Submitted List View
function serveSubmittedView(e) {
  console.log('Starting serveSubmittedView');
  
  try {
    // Validate session first
    const sessionId = e.parameter.sessionId;
    const user = sessionId ? getCurrentUserFromAuth(sessionId) : null;
    
    if (!user) {
      console.log('Invalid session in serveSubmittedView');
      return HtmlService.createTemplateFromFile('Login')
        .evaluate()
        .setTitle('Login - 1PWR Procurement')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    const template = HtmlService.createTemplateFromFile('SubmittedListView');
    
    // Get data with pagination
    const page = parseInt(e.parameter.p) || 1;
    const data = getSubmittedListData(page);
    
    // Pass data to template
    template.headers = data.headers;
    template.rows = data.rows;
    template.pagination = data.pagination;
    template.user = user;
    template.sessionId = sessionId;

    return template.evaluate()
      .setTitle('Submitted PRs')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setFaviconUrl('https://1pwrafrica.com/wp-content/uploads/2018/11/logo.png');

  } catch (error) {
    console.error('Error serving submitted view:', error);
    return createErrorPage(error.message);
  }
}

function getSubmittedListData(page = 1, itemsPerPage = 10) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName('Submitted');
        
        // If sheet doesn't exist or needs sync
        if (!sheet || sheet.getLastRow() <= 1) {
            syncSubmittedSheet();
            if (!sheet) throw new Error('Failed to create Submitted sheet');
        }

        const data = sheet.getDataRange().getValues();
        const submittedRows = data.slice(1).map(row => ({
            prNumber: row[0],                    // PR Number
            description: row[1],                 // Description
            submittedBy: row[2],                // Submitted By
            submittedDate: formatDate(row[3]),   // Submitted Date
            resubmittedDate: formatDate(row[4]), // Resubmitted Date
            daysOpen: row[5],                    // Days Open
            daysSinceResubmission: row[6],       // Days Since Resubmission
            link: row[7]                         // Link
        }));

        // Calculate pagination
        const totalItems = submittedRows.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedRows = submittedRows.slice(startIndex, startIndex + itemsPerPage);

        return {
            headers: [
                "PR Number",
                "Description", 
                "Submitted By", 
                "Submitted Date",
                "Resubmitted Date", 
                "Days Open",
                "Days Since Resubmission",
                "Actions"
            ],
            rows: paginatedRows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage
            }
        };

    } catch (error) {
        Logger.log('ERROR: Error getting submitted list data: ' + error.toString());
        console.error('Error getting submitted list data:', error);
        throw error;
    }
}

function handlePRView(prNumber) {
  console.log('Handling PR view for:', prNumber);
  
  try {
    // Get PR data
    const prData = getPRDetails(prNumber);
    console.log('Retrieved PR data:', prData);
    
    if (!prData.success) {
      throw new Error(`Failed to get PR details: ${prData.error}`);
    }

    // Create the template
    const template = HtmlService.createTemplateFromFile('PRViewWeb');
    template.prData = prData.data;
    
    // Add some debug data
    template.debug = true;
    template.loadTime = new Date().toISOString();
    
    return template.evaluate()
      .setTitle(`PR ${prNumber}`)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log('ERROR: Error in handlePRView: ' + error.toString());
    console.error('Error in handlePRView:', error);
    return createErrorPage(error.message);
  }
}

/**
 * Creates an error page with the given message.
 * @param {string} message - The error message to display.
 * @returns {HtmlOutput} The rendered error page.
 */
function createErrorPage(message) {
  const template = HtmlService.createTemplate(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <title>Error</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-100 p-6">
        <div class="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p class="text-gray-700 mb-4">${message}</p>
          <button onclick="window.history.back()" 
                  class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Back to Dashboard
          </button>
        </div>
      </body>
    </html>
  `);
  
  return template.evaluate()
    .setTitle('Error')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function generateViewLink(prNumber) {
  try {
    const scriptId = ScriptApp.getScriptId();
    Logger.log('Script ID: ' + scriptId);
    // Construct URL that will work in any context
    const url = `https://script.google.com/macros/s/${scriptId}/exec?page=prview&pr=${encodeURIComponent(prNumber)}`;
    Logger.log('Generated URL: ' + url);
    return url;
  } catch (error) {
    Logger.log('ERROR: Error generating view link: ' + error.toString());
    console.error('Error generating view link:', error);
    throw error;
  }
}

// Test function
function testPRLink() {
  const testPR = 'PR-202411-027';
  const url = generateViewLink(testPR);
  Logger.log('Test URL generated: ' + url);
  return url;
}

/**
 * Test function to verify URL generation and routing
 */
function testRouting() {
  const testPR = 'PR-202411-027';
  const url = generateViewLink(testPR);
  Logger.log('Generated URL: ' + url);
  
  // Test template rendering
  const e = {parameter: {page: 'prview', pr: testPR}};
  const result = doGet(e);
  Logger.log('Template test successful: ' + (result.getContent().length > 0));
  
  return {
    url: url,
    templateTest: 'success'
  };
}

/**
 * Formats PR data for display
 * Uses existing column mappings from CONFIG
 * @param {Array} rowData - Raw sheet row data
 * @returns {Object} Formatted data for template
 */
function formatPRDataForDisplay(rowData) {
  // Use existing COL mappings for consistency
  return {
    prNumber: rowData[COL.PO_NUMBER],
    timestamp: rowData[COL.TIMESTAMP],
    status: rowData[COL.PR_STATUS],
    requestorName: rowData[COL.REQUESTOR_NAME],
    department: rowData[COL.DEPARTMENT],
    requestorEmail: rowData[COL.EMAIL],
    requestShortDescription: rowData[COL.DESCRIPTION],
    projectCategory: rowData[COL.PROJECT_CATEGORY],
    acquiringOrganization: rowData[COL.ORGANIZATION],
    currency: rowData[COL.CURRENCY],
    paymentFormat: rowData[COL.PAYMENT_FORMAT],
    siteLocation: rowData[COL.SITE_LOCATION],
    expenseType: rowData[COL.EXPENSE_TYPE],
    vehicle: rowData[COL.VEHICLE],
    budgetStatus: rowData[COL.BUDGET_STATUS],
    deadlineDate: rowData[COL.DEADLINE_DATE],
    urgencyStatus: rowData[COL.URGENCY],
    vendor: rowData[COL.VENDOR],
    procurementNotes: rowData[COL.PROCUREMENT_NOTES],
    lineItems: [], // TODO: Implement based on existing line item storage
    // Preserve any additional fields needed for existing functionality
  };
}

/**
 * Function: getActiveRequestors()
 * Description:
 *   Retrieves the list of active requestors from the "Requestor List" sheet.
 * Returns:
 *   - An array of objects containing requestor names, departments, and emails.
 */
function getActiveRequestors() {
  try {
    Logger.log('getActiveRequestors: Function started.');

    // Accessing CONFIG object
    if (typeof CONFIG === 'undefined') {
      Logger.log('ERROR: CONFIG object is not defined.');
      return [];
    }

    const spreadsheetId = CONFIG.SPREADSHEET_ID;
    const sheetName = CONFIG.REQUESTOR_SHEET_NAME;

    Logger.log(`getActiveRequestors: Using Spreadsheet ID: ${spreadsheetId}`);
    Logger.log(`getActiveRequestors: Using Sheet Name: ${sheetName}`);

    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(spreadsheetId);
    if (!ss) {
      Logger.log('ERROR: Unable to open spreadsheet. Check the Spreadsheet ID.');
      return [];
    }

    // Get the sheet
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`WARNING: Sheet "${sheetName}" not found.`);
      return [];
    } else {
      Logger.log(`getActiveRequestors: Sheet "${sheetName}" found.`);
    }

    // Get data range and values
    const dataRange = sheet.getDataRange();
    const dataValues = dataRange.getValues();
    Logger.log(`getActiveRequestors: Retrieved ${dataValues.length} rows from the sheet.`);

    if (dataValues.length < 2) {
      Logger.log('WARNING: No data found in the sheet beyond headers.');
      return [];
    }

    // Process headers: trim and convert to lowercase
    const headers = dataValues[0].map(header => header.toString().trim().toLowerCase());
    Logger.log(`getActiveRequestors: Headers found: ${headers.join(', ')}`);

    const nameIndex = headers.indexOf('name');
    const departmentIndex = headers.indexOf('department');
    const emailIndex = headers.indexOf('email');
    const activeIndex = headers.indexOf('active (y/n)');

    Logger.log(`getActiveRequestors: Column Indices - Name: ${nameIndex}, Department: ${departmentIndex}, Email: ${emailIndex}, Active: ${activeIndex}`);

    // Check for required columns
    if (nameIndex === -1 || departmentIndex === -1 || emailIndex === -1 || activeIndex === -1) {
      Logger.log('WARNING: One or more required columns (Name, Department, Email, Active (Y/N)) not found in the sheet.');
      return [];
    }

    const requestors = [];
    let activeCount = 0;

    for (let i = 1; i < dataValues.length; i++) {
      const row = dataValues[i];
      const name = row[nameIndex];
      const department = row[departmentIndex];
      const email = row[emailIndex];
      const isActive = row[activeIndex];

      Logger.log(`getActiveRequestors: Processing row ${i + 1}: Name="${name}", Department="${department}", Email="${email}", Active="${isActive}"`);

      if (isActive && isActive.toString().trim().toUpperCase() === 'Y') {
        requestors.push({
          name: name,
          department: department,
          email: email
        });
        activeCount++;
        Logger.log(`getActiveRequestors: Added active requestor from row ${i + 1}.`);
      }
    }

    Logger.log(`getActiveRequestors: Total active requestors found: ${activeCount}`);
    Logger.log('getActiveRequestors: Function completed successfully.');

    return requestors;
  } catch (error) {
    Logger.log(`ERROR in getActiveRequestors: ${error}`);
    return [];
  }
}

/**
 * Function: getProjectCategories()
 * Retrieves list of project categories
 */
function getProjectCategories() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Project Categories');
    
    if (!sheet) {
      Logger.log('ERROR: Sheet "Project Categories" not found');
      return [];
    }

    const dataRange = sheet.getDataRange();
    const dataValues = dataRange.getValues();
    
    Logger.log('Raw project categories data: ' + JSON.stringify(dataValues));

    // Get header row values
    const headers = dataValues[0].map(header => header.toString().trim());
    const categoryIndex = headers.indexOf('Category');
    const activeIndex = headers.indexOf('Active (Y/N)');

    if (categoryIndex === -1) {
      Logger.log('ERROR: Category column not found. Headers: ' + JSON.stringify(headers));
      return [];
    }

    const categories = [];
    for (let i = 1; i < dataValues.length; i++) {
        const row = dataValues[i];
        const categoryName = row[categoryIndex];
        const isActive = activeIndex !== -1 ? row[activeIndex].toString().trim().toUpperCase() === 'Y' : true;

        if (categoryName && isActive) {
            categories.push(categoryName.toString().trim());
        }
    }

    Logger.log('Processed categories: ' + JSON.stringify(categories));
    return categories;
  } catch (error) {
    Logger.log('ERROR: Error in getProjectCategories: ' + error.toString());
    console.error('Error in getProjectCategories:', error);
    return [];
  }
}

/**
 * Function: getActiveSites()
 * Description:
 *   Retrieves the list of active sites from the "Site List" sheet.
 * Returns:
 *   - An array of objects containing site codes and names.
 */
function getActiveSites() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Site List');
  if (!sheet) {
    console.warn('Sheet "Site List" not found');
    return [];
  }

  const dataRange = sheet.getDataRange();
  const dataValues = dataRange.getValues();

  // Process headers: trim and convert to lowercase
  const headers = dataValues[0].map(header => header.toString().trim().toLowerCase());
  const siteNameIndex = headers.indexOf('site name');
  const codeIndex = headers.indexOf('code');
  const activeIndex = headers.indexOf('active (y/n)');

  if (siteNameIndex === -1 || codeIndex === -1 || activeIndex === -1) {
    console.warn('Required columns not found in "Site List" sheet');
    return [];
  }

  const sites = [];
  for (let i = 1; i < dataValues.length; i++) {
    const row = dataValues[i];
    const siteName = row[siteNameIndex];
    const code = row[codeIndex];
    const isActive = row[activeIndex];
    if (isActive && isActive.toString().trim().toUpperCase() === 'Y') {
      sites.push({
        name: siteName,
        code: code
      });
    }
  }

  return sites;
}

/**
 * Function: getExpenseTypes()
 * Description:
 *   Retrieves the list of active expense types from the "Expense Type" sheet.
 * Returns:
 *   - An array of objects containing expense types and their codes.
 */
function getExpenseTypes() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Expense Type');
  if (!sheet) {
    console.warn('Sheet "Expense Type" not found');
    return [];
  }

  const dataRange = sheet.getDataRange();
  const dataValues = dataRange.getValues();

  // Process headers: trim and convert to lowercase
  const headers = dataValues[0].map(header => header.toString().trim().toLowerCase());
  const expenseTypeIndex = headers.indexOf('expense type');
  const codeIndex = headers.indexOf('code');
  const activeIndex = headers.indexOf('active (y/n)');

  if (expenseTypeIndex === -1 || codeIndex === -1 || activeIndex === -1) {
    console.warn('Required columns not found in "Expense Type" sheet');
    return [];
  }

  const expenseTypes = [];
  for (let i = 1; i < dataValues.length; i++) {
    const row = dataValues[i];
    const expenseType = row[expenseTypeIndex];
    const code = row[codeIndex];
    const isActive = row[activeIndex];
    if (isActive && isActive.toString().trim().toUpperCase() === 'Y') {
      expenseTypes.push({
        expenseType: expenseType,
        code: code
      });
    }
  }

  return expenseTypes;
}

/**
 * Function: getApprovedVendors()
 * Description:
 *   Retrieves the list of approved vendors from the "Vendor List" sheet.
 * Returns:
 *   - An array of vendor names.
 */
function getApprovedVendors() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Vendor List');
    
    if (!sheet) {
      console.error('Vendor List sheet not found');
      return [];
    }

    const dataRange = sheet.getDataRange();
    const dataValues = dataRange.getValues();
    
    // Process headers with correct names
    const headers = dataValues[0].map(header => header.toString().trim());
    const nameIndex = headers.indexOf('Vendor Name');  // Updated to match actual header
    const activeIndex = headers.indexOf('Approved Status (Y/N)');  // Updated to match actual header

    if (nameIndex === -1) {
      console.error('Vendor Name column not found. Headers:', headers);
      return [];
    }

    const vendors = [];
    for (let i = 1; i < dataValues.length; i++) {
      const row = dataValues[i];
      const vendorName = row[nameIndex];
      const isActive = activeIndex !== -1 ? row[activeIndex].toString().trim().toUpperCase() === 'Y' : true;
      
      if (vendorName && isActive) {
        vendors.push({
          name: vendorName.toString().trim()
        });
      }
    }

    return vendors;
  } catch (error) {
    console.error('Error in getApprovedVendors:', error);
    return [];
  }
}

/**
 * Function: getActiveApprovers()
 * Description:
 *   Retrieves the list of active approvers from the "Approver List" sheet.
 * Returns:
 *   - An array of approver objects containing names, departments, and emails.
 */
function getActiveApprovers() {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName('Approver List');

        if (!sheet) {
            Logger.log('Approver List sheet not found');
            return [];
        }

        const dataRange = sheet.getDataRange();
        const dataValues = dataRange.getValues();
        
        // Log the exact first row
        Logger.log('First row exact values:', dataValues[0]);
        
        // Use exact header names without any case conversion
        const headers = dataValues[0].map(header => header.toString().trim());
        
        // Detailed Header Analysis
        headers.forEach((header, index) => {
            const charCodes = header.split('').map(char => char.charCodeAt(0));
            Logger.log(`Header ${index + 1}: "${header}" | Length: ${header.length} | Char Codes: [${charCodes.join(', ')}]`);
        });

        // Locate column indices based on exact header names
        const nameCol = headers.indexOf('Name');
        const emailCol = 1; // Email is always in column B
        const deptCol = headers.indexOf('Department');
        const activeCol = headers.indexOf('Active Status (Y/N)');

        Logger.log('Found columns:', {
            nameCol,
            emailCol,
            deptCol,
            activeCol
        });

        // Validate that all required columns are found using strict comparison
        let allColumnsFound = true;

        if (nameCol === -1) {
            Logger.log('Could not find "Name" column');
            allColumnsFound = false;
        }
        if (deptCol === -1) {
            Logger.log('Could not find "Department" column');
            allColumnsFound = false;
        }
        if (activeCol === -1) {
            Logger.log('Could not find "Active Status (Y/N)" column');
            allColumnsFound = false;
        }

        if (!allColumnsFound) {
            Logger.log('Available headers:', headers);
            return [];
        }

        const approvers = [];

        // Process each data row
        for (let i = 1; i < dataValues.length; i++) {
            const row = dataValues[i];
            Logger.log(`Processing row ${i}:`, row);

            const name = String(row[nameCol] || '').trim();
            const email = String(row[emailCol] || '').trim();
            const dept = String(row[deptCol] || '').trim();
            const active = String(row[activeCol] || '').trim().toUpperCase(); // Normalize to uppercase for comparison

            Logger.log('Extracted values:', { name, email, dept, active });

            if (name && active === 'Y') {
                approvers.push({
                    name: name,
                    email: email,
                    department: dept
                });
                Logger.log(`Added approver: ${name} (${dept}) - ${email}`);
            }
        }

        Logger.log('Final approvers list:', approvers);
        return approvers;

    } catch (error) {
        Logger.log('Error in getActiveApprovers:', error);
        return [];
    }
}

/**
 * Function: getActiveVehicles()
 * Description:
 *   Retrieves the list of active vehicles from the "Vehicle List" sheet.
 * Returns:
 *   - An array of objects containing vehicle names and registration statuses.
 */
function getActiveVehicles() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Vehicle List');
  if (!sheet) {
    console.warn('Sheet "Vehicle List" not found');
    return [];
  }

  const dataRange = sheet.getDataRange();
  const dataValues = dataRange.getValues();

  // Process headers: trim and convert to lowercase
  const headers = dataValues[0].map(header => header.toString().trim().toLowerCase());
  const vehicleNameIndex = headers.indexOf('vehicle name');
  const registrationStatusIndex = headers.indexOf('registration status');
  const activeIndex = headers.indexOf('active (y/n)');

  if (vehicleNameIndex === -1 || registrationStatusIndex === -1 || activeIndex === -1) {
    console.warn('Required columns not found in "Vehicle List" sheet');
    return [];
  }

  const vehicles = [];
  for (let i = 1; i < dataValues.length; i++) {
    const row = dataValues[i];
    const vehicleName = row[vehicleNameIndex];
    const registrationStatus = row[registrationStatusIndex];
    const isActive = row[activeIndex];
    if (isActive && isActive.toString().trim().toUpperCase() === 'Y') {
      vehicles.push({
        name: vehicleName,
        registrationStatus: registrationStatus
      });
    }
  }

  return vehicles;
}

/**
 * Function: getPRNumber()
 * Generates a new Purchase Request number
 * Format: PR-YYYYMM-NNN (NNN: 001-999)
 * @returns {string} New PR number
 */
function getPRNumber() {
  try {
    // Get spreadsheet access
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) {
      console.error('Failed to open spreadsheet');
      return 'PR-ERROR-SS';
    }

    // Get sheet access - using correct sheet name
    const sheet = ss.getSheetByName('PR Number Tracker');
    if (!sheet) {
      console.error('Failed to open PR Number Tracker sheet');
      return 'PR-ERROR-SHEET';
    }

    // Get today's date
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentYearMonth = `${currentYear}${currentMonth.toString().padStart(2, '0')}`;

    // Get PR number column data
    const dataRange = sheet.getRange('A:A'); // Assuming PR numbers are in column A
    const prNumbers = dataRange.getValues();

    // Find highest number for current month
    let maxNumber = 0;
    const prPattern = new RegExp(`PR-${currentYearMonth}-(\\d{3})`);

    prNumbers.forEach((row, index) => {
      if (row[0] && typeof row[0] === 'string') {
        const prNum = row[0].toString();
        const match = prNum.match(prPattern);
        if (match) {
          const num = parseInt(match[1], 10);
          maxNumber = Math.max(maxNumber, num);
          console.log(`Found PR number: ${prNum}, extracted number: ${num}`);
        }
      }
    });

    console.log(`Highest number found for ${currentYearMonth}: ${maxNumber}`);

    // Increment and validate
    const nextNumber = maxNumber + 1;
    if (nextNumber > 999) {
      console.error(`PR number limit reached for ${currentYearMonth}`);
      return 'PR-LIMIT';
    }

    // Format new PR number
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const newPRNumber = `PR-${currentYearMonth}-${paddedNumber}`;
    
    // Log the new number in the tracker sheet
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1).setValue(newPRNumber);
    sheet.getRange(lastRow + 1, 2).setValue(new Date()); // Timestamp in column B
    sheet.getRange(lastRow + 1, 3).setValue(Session.getActiveUser().getEmail()); // User in column C
    
    console.log(`Generated new PR number: ${newPRNumber}`);
    return newPRNumber;

  } catch (error) {
    console.error('Error in getPRNumber:', error);
    return 'PR-ERROR-GENERAL';
  }
}

/**
 * Function: setupPRTrackerSheet()
 * Creates and configures the PR Number Tracker sheet if it doesn't exist
 */
function setupPRTrackerSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('PR Number Tracker');
  
  if (!sheet) {
    // Create new sheet
    sheet = ss.insertSheet('PR Number Tracker');
    
    // Set up headers
    sheet.getRange('A1:C1').setValues([['PR Number', 'Generated Date', 'Generated By']]);
    
    // Format headers
    sheet.getRange('A1:C1').setFontWeight('bold');
    sheet.setFrozenRows(1);
    
    // Set column widths
    sheet.setColumnWidth(1, 150); // PR Number
    sheet.setColumnWidth(2, 180); // Generated Date
    sheet.setColumnWidth(3, 200); // Generated By
    
    // Add data validation for date format
    sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
}

/**
 * Function: validatePRNumber(prNumber)
 * Validates a PR number format and checks for uniqueness
 * @param {string} prNumber - PR number to validate
 * @returns {boolean} Whether the PR number is valid
 */
function validatePRNumber(prNumber) {
  // Validate format
  const prPattern = /^PR-\d{6}-\d{3}$/;
  if (!prPattern.test(prNumber)) {
    return false;
  }

  // Check uniqueness
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PR Number Tracker');
  
  if (!sheet) {
    return false;
  }

  const dataRange = sheet.getRange('A:A');
  const existingPRs = dataRange.getValues();
  
  return !existingPRs.flat().includes(prNumber);
}

/**
 * Function: resetPRNumbersForMonth()
 * Utility function to reset PR numbers if needed
 * Only run this manually when necessary
 */
function resetPRNumbersForMonth() {
  // This function can be used if you need to perform any cleanup
  // or validation at the start of each month
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('1PWR PR MASTER TRACKING');
  
  if (!sheet) {
    console.error('Sheet not found');
    return;
  }

  // Log the reset event
  const today = new Date();
  const logSheet = ss.getSheetByName('System Log');
  if (logSheet) {
    logSheet.appendRow([
      today,
      'PR Number Reset',
      `New month started: ${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}`
    ]);
  }

  console.log('PR numbering system reset complete');
  
}

/**
 * Function: setupMonthlyTrigger()
 * Sets up automatic monthly reset of PR numbers
 * Should be run once during system setup
 */
function setupMonthlyTrigger() {
  // Remove any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'resetPRNumbersForMonth') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger for first day of each month
  ScriptApp.newTrigger('resetPRNumbersForMonth')
    .timeBased()
    .onMonthDay(1)
    .atHour(0)
    .create();
}

/**
 * Function: processForm(formData)
 * Description:
 *   Processes the form data submitted by the user. Performs authentication, validation,
 *   enriches the data with user information, and stores the data in the "Master Log" sheet.
 *   Sends notifications upon successful submission.
 * Parameters:
 *   - formData: An object containing all the form data submitted by the user.
 * Returns:
 *   - An object with a status ('success' or 'error'), PR number (if successful), and an optional message.
 */
function processForm(formData) {
  console.log('Starting form processing');
  
  try {
    // Validate session
    const user = getCurrentUserFromAuth(formData.sessionId);
    if (!user) {
      return {
        success: false,
        sessionExpired: true,
        message: 'Session expired. Please log in again.'
      };
    }

    // Add submitter info from authenticated user
    formData.requestorEmail = user.email;
    formData.requestorName = user.username;
    
    // Validate form data
    console.log('Validating form data');
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: 'Validation failed: ' + validationErrors.join(', ')
      };
    }

    // Generate PR number
    const prNumber = formData.prNumber || generatePRNumber();
    console.log('Generated PR number:', prNumber);

    // Record PR number
    recordPRNumber(prNumber, user);

    // Prepare row data
    console.log('Preparing row data');
    const rowData = prepareRowData(formData, prNumber);

    // Write to sheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.MASTER_LOG_TAB);
    if (!sheet) throw new Error('Master Log sheet not found');

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
    console.log('Data written successfully');

    // Get approver email and send notifications
    const approverEmail = getApproverEmail(formData.approverSelection);
    
    // Send submission notification
    sendSubmissionNotification({
      prNumber: prNumber,
      description: formData.requestShortDescription,
      submitter: formData.requestorName,
      department: formData.department,
      expectedDate: formData.deadlineDate,
      link: generateViewLink(prNumber),
      recipients: [
        CONFIG.PROCUREMENT_EMAIL,
        formData.requestorEmail,
        approverEmail
      ].filter(Boolean)
    });

    // Log the submission
    logSubmission(prNumber, user, formData);

    return {
      success: true,
      prNumber: prNumber,
      redirectUrl: getWebAppUrl(),
      message: 'Purchase Request submitted successfully'
    };

  } catch (error) {
    console.error('Error in processForm:', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Enhanced logging of form submissions
 */
function logSubmission(prNumber, user, formData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logSheet = ss.getSheetByName('Submission Log');
    
    if (!logSheet) {
      const newSheet = ss.insertSheet('Submission Log');
      newSheet.getRange('A1:G1').setValues([[
        'Timestamp',
        'PR Number',
        'Submitted By',
        'Email',
        'Department',
        'Description',
        'Form Data'
      ]]);
      newSheet.setFrozenRows(1);
    }

    logSheet.appendRow([
      new Date(),
      prNumber,
      user.username,
      user.email,
      formData.department,
      formData.requestShortDescription,
      JSON.stringify(formData)
    ]);

  } catch (error) {
    console.error('Error logging submission:', error);
    // Non-critical error, continue processing
  }
}

/**
 * Gets initial form data with session validation
 * @param {string} sessionId - Session ID
 * @returns {Object} Form initialization data
 */
function getFormInitialData(sessionId) {
  console.log('Getting initial form data');
  
  try {
    const user = getCurrentUserFromAuth(sessionId);
    if (!user) {
      return { sessionExpired: true };
    }

    return {
      success: true,
      requestors: getActiveRequestors(),
      projects: getProjectCategories(),
      organizations: getActiveOrganizations(),
      sites: getActiveSites(),
      expenseTypes: getExpenseTypes(),
      vendors: getApprovedVendors(),
      approvers: getActiveApprovers(),
      userContext: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    };

  } catch (error) {
    console.error('Error getting form initial data:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Prepares row data for spreadsheet insertion
 * @param {Object} formData - The form data
 * @param {string} prNumber - The PR number
 * @returns {Array} Array of values for spreadsheet row
 */
function prepareRowData(formData, prNumber) {
  // Initialize array with length matching maximum column index
  const rowData = new Array(Math.max(...Object.values(COL)) + 1).fill('');

  // Basic Information (A-T)
  rowData[COL.PR_NUMBER] = prNumber;
  rowData[COL.TIMESTAMP] = new Date();
  rowData[COL.EMAIL] = formData.requestorEmail;
  rowData[COL.REQUESTOR_NAME] = formData.requestorName;
  rowData[COL.DEPARTMENT] = formData.department;
  rowData[COL.DESCRIPTION] = formData.requestShortDescription;
  rowData[COL.PROJECT_CATEGORY] = formData.projectCategory;
  rowData[COL.ORGANIZATION] = formData.acquiringOrganization;
  rowData[COL.CURRENCY] = formData.currency === 'Other' ? formData.currencyOther : formData.currency;
  rowData[COL.PAYMENT_FORMAT] = formData.paymentFormat === 'Other' ? formData.paymentFormatOther : formData.paymentFormat;
  rowData[COL.SITE_LOCATION] = formData.siteLocation;
  rowData[COL.EXPENSE_TYPE] = formData.expenseType;
  rowData[COL.REQUEST_CONTEXT] = '';  // Will be populated if needed
  rowData[COL.VEHICLE] = formData.vehicleSelection || '';
  rowData[COL.BUDGET_STATUS] = formData.approvedBudget === 'Other' ? formData.approvedBudgetOther : formData.approvedBudget;
  rowData[COL.DEADLINE_DATE] = new Date(formData.deadlineDate);
  rowData[COL.VENDOR] = formData.vendor === 'Other' ? formData.vendorOther : formData.vendor;
  rowData[COL.URGENCY] = formData.urgencyStatus === 'Urgent' ? 'Y' : 'N';
  rowData[COL.APPROVER] = formData.approverSelection;
  rowData[COL.REQUESTOR_NOTES] = formData.requestorNotes || '';

  // Status and Processing (U-AH)
  rowData[COL.PR_STATUS] = 'Submitted';
  rowData[COL.PR_AMOUNT] = 0;  // Will be calculated later if needed
  rowData[COL.QUOTES_REQUIRED] = 'N';  // Will be updated based on amount
  rowData[COL.CONTROLS_OVERRIDE] = 'N';
  rowData[COL.OVERRIDE_JUST] = '';
  rowData[COL.OVERRIDE_DATE] = '';
  rowData[COL.OVERRIDE_BY] = '';
  rowData[COL.QUOTES_LINK] = '';
  rowData[COL.QUOTES_DATE] = '';
  rowData[COL.ADJ_REQUIRED] = 'N';  // Will be updated based on amount
  rowData[COL.ADJ_NOTES] = '';
  rowData[COL.ADJ_DATE] = '';
  rowData[COL.PR_READY] = 'N';
  rowData[COL.PO_NUMBER] = '';
  
  // PO Processing (AI-AM)
  rowData[COL.PO_DATE] = '';
  rowData[COL.PO_STATUS] = '';
  rowData[COL.PO_APPROVED_DATE] = '';
  rowData[COL.PO_NUMBER_TEXT] = '';
  rowData[COL.LINK_TO_POP] = '';
  
  // Payment and Shipping (AN-AR)
  rowData[COL.PAYMENT_DATE] = '';
  rowData[COL.EXPECTED_SHIPPING_DATE] = '';
  rowData[COL.EXPECTED_LANDING_DATE] = '';
  rowData[COL.SHIPPED] = 'N';
  rowData[COL.SHIPMENT_DATE] = '';

  // Customs and Delivery (AS-AW)
  rowData[COL.CUSTOMS_REQUIRED] = 'N';
  rowData[COL.CUSTOMS_DOCS] = '';
  rowData[COL.CUSTOMS_SUBMISSION_DATE] = '';
  rowData[COL.CUSTOMS_CLEARED] = 'N';
  rowData[COL.DATE_CLEARED] = '';
  
  // Final Status (AX-AZ)
  rowData[COL.GOODS_LANDED] = 'N';
  rowData[COL.LANDED_DATE] = '';
  
  // Tracking Fields (BA-BF)
  rowData[COL.DAYS_OPEN] = 0;
  rowData[COL.QUEUE_POSITION] = '';
  rowData[COL.COMPLETION] = 0;
  rowData[COL.TIME_TO_SHIP] = 0;
  rowData[COL.TIME_IN_CUSTOMS] = 0;
  rowData[COL.TIME_TO_LAND] = 0;
  rowData[COL.PROCUREMENT_NOTES] = '';

  // Line Items (BG-BJ)
  if (formData.lineItems && formData.lineItems.length > 0) {
    // Limit to 20 items and format for storage
    const formattedItems = formatLineItemsForStorage(formData.lineItems.slice(0, 20));
    
    rowData[COL.ITEM_LIST] = formattedItems.items;
    rowData[COL.QTY_LIST] = formattedItems.quantities;
    rowData[COL.UOM_LIST] = formattedItems.uoms;
    rowData[COL.URL_LIST] = formattedItems.urls;

    // Generate REQUEST_CONTEXT from line items for backward compatibility
    rowData[COL.REQUEST_CONTEXT] = formData.lineItems
      .slice(0, 20)
      .map(item => `${item.item} (${item.qty} ${item.uom})${item.url ? ' - ' + item.url : ''}`)
      .join('\n');
  }

  return rowData;
}

/**
 * Sends a notification about the submission
 * @param {Object} params - Notification parameters
 */
function sendSubmissionNotification(params) {
  try {
    const subject = `New PR Submitted: ${params.prNumber}`;
    const body = `
A new Purchase Requisition has been submitted:

PR Number: ${params.prNumber}
Description: ${params.description}
Submitted By: ${params.submitter}
Department: ${params.department}
Expected Date: ${formatDate(params.expectedDate)}

View PR Details: ${params.link}

This is an automated notification from the 1PWR Procurement System.
`;

    // Filter out any invalid email addresses
    const validRecipients = params.recipients.filter(email => 
      email && email.includes('@') && email.includes('.')
    );

    if (validRecipients.length === 0) {
      console.warn('No valid recipients for notification');
      return;
    }

    // Send email
    GmailApp.sendEmail(
      validRecipients.join(','),
      subject,
      body
    );

    // Log notification
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const notificationLog = ss.getSheetByName(CONFIG.NOTIFICATION_TAB);
    if (notificationLog) {
      notificationLog.appendRow([
        new Date(),
        'SUBMISSION',
        params.prNumber,
        validRecipients.join(', '),
        Session.getActiveUser().getEmail()
      ]);
    }

    console.log(`Notification sent for PR ${params.prNumber} to ${validRecipients.join(', ')}`);
    
  } catch (error) {
    console.error('Failed to send submission notification:', error);
    // Don't throw - notification failure shouldn't block PR submission
  }
}

// Helper function to format dates consistently
function formatDate(date) {
  if (!date) return 'Not specified';
  const d = new Date(date);
  return d.toLocaleDateString();
}

/**
 * Logs processing errors
 * @param {Error} error - The error object
 * @param {Object} formData - The form data that caused the error
 */
function logProcessingError(error, formData) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const errorLog = ss.getSheetByName('Error Log');
    if (!errorLog) return;

    errorLog.appendRow([
      new Date(),
      error.toString(),
      JSON.stringify(formData),
      error.stack || 'No stack trace',
      Session.getActiveUser().getEmail()
    ]);
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

/**
 * Determines if quotes are required based on business rules
 */
function calculateQuotesRequired(data) {
    // Basic implementation - can be enhanced with more complex rules later
    return 'Y'; // Default to yes for initial implementation
}

/**
 * Determines if adjudication is required based on business rules
 */
function calculateAdjRequired(data) {
    // Basic implementation - can be enhanced with more complex rules later
    return 'N'; // Default to no for initial implementation
}

/**
 * Calculates days open (initially zero)
 */
function calculateDaysOpen(timestamp) {
    return 0; // Initialize to 0, will be updated by sheet formula
}

/**
 * Function: testPRNumberGeneration()
 * Test function to verify PR number generation
 * Run this function directly to debug PR number generation
 */
function testPRNumberGeneration() {
  console.log('Starting PR number generation test...');
  
  try {
    // Test spreadsheet access
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Successfully opened spreadsheet');
    
    // List all sheets
    const sheets = ss.getSheets();
    console.log('Available sheets:');
    sheets.forEach(sheet => console.log(`- ${sheet.getName()}`));
    
    // Test specific sheet access
    const sheet = ss.getSheetByName('1PWR PR MASTER TRACKING');
    if (sheet) {
      console.log('Successfully accessed 1PWR PR MASTER TRACKING sheet');
      
      // Get sample of existing data
      const sampleRange = sheet.getRange('B1:B10').getValues();
      console.log('Sample of existing PR numbers:');
      sampleRange.forEach(row => console.log(row[0]));
      
      // Generate new PR number
      const newPRNumber = getPRNumber();
      console.log(`Generated PR number: ${newPRNumber}`);
      
    } else {
      console.log('Could not access main tracking sheet');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Function: resetPRNumbersForMonth()
 * Utility function to reset PR numbers if needed
 * Only run this manually when necessary
 */
function resetPRNumbersForMonth() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('1PWR PR MASTER TRACKING');
    
    if (!sheet) {
      console.error('Sheet not found');
      return;
    }

    // Create system log entry
    const logSheet = ss.getSheetByName('System Log');
    if (logSheet) {
      logSheet.appendRow([
        new Date(),
        'PR Number System',
        'Reset PR numbering system'
      ]);
    }

    console.log('PR numbering system reset complete');
    
  } catch (error) {
    console.error('Reset failed:', error);
  }
}

function checkSheetStructure() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('Available sheets:');
  ss.getSheets().forEach(sheet => Logger.log(sheet.getName()));
}

function initialSetup() {
  setupPRTrackerSheet();
}

function test() {
  const result = testPRNumberGeneration();
  Logger.log('Test result:', result);
}

/**
 * Function: setupAndVerify()
 * Runs initial setup and verifies the PR tracking system
 */
function setupAndVerify() {
  console.log('Starting setup and verification...');
  
  try {
    // Step 1: Setup PR Tracker Sheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Successfully connected to spreadsheet');
    
    // Get or create PR Number Tracker sheet
    let sheet = ss.getSheetByName('PR Number Tracker');
    if (!sheet) {
      console.log('PR Number Tracker sheet not found, creating new...');
      sheet = ss.insertSheet('PR Number Tracker');
      
      // Set up headers
      const headers = [['PR Number', 'Generated Date', 'Generated By']];
      sheet.getRange(1, 1, 1, 3).setValues(headers);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, 3);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E8EAED');
      
      // Set column widths
      sheet.setColumnWidths(1, 3, 150);
      
      // Freeze header row
      sheet.setFrozenRows(1);
      
      // Set date format
      sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
      
      console.log('Sheet created and formatted');
    } else {
      console.log('PR Number Tracker sheet already exists');
    }
    
    // Step 2: Generate test PR number
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentYearMonth = `${currentYear}${currentMonth}`;
    
    // Get existing numbers
    const lastRow = Math.max(1, sheet.getLastRow());
    const existingNumbers = sheet.getRange(`A1:A${lastRow}`).getValues();
    
    console.log('Current data in sheet:');
    existingNumbers.forEach(row => {
      if (row[0] && typeof row[0] === 'string') {
        console.log(`- ${row[0]}`);
      }
    });
    
    // Generate new number
    const newPRNumber = `PR-${currentYearMonth}-001`;
    
    // Add test entry if sheet is empty (besides header)
    if (lastRow <= 1) {
      const newRow = [
        newPRNumber,
        new Date(),
        Session.getActiveUser().getEmail()
      ];
      sheet.getRange(2, 1, 1, 3).setValues([newRow]);
      console.log(`Added test PR number: ${newPRNumber}`);
    }
    
    console.log('Setup and verification complete');
    return true;
    
  } catch (error) {
    console.error('Setup failed:', error);
    return false;
  }
}

/**
 * Function: testPRGeneration()
 * Tests PR number generation after setup
 */
function testPRGeneration() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('PR Number Tracker');
    
    if (!sheet) {
      throw new Error('PR Number Tracker sheet not found');
    }
    
    // Get current data
    const lastRow = sheet.getLastRow();
    console.log(`Current row count: ${lastRow}`);
    
    // Generate new PR number
    const newPR = getPRNumber();
    console.log(`Generated new PR number: ${newPR}`);
    
    // Verify it was added to sheet
    const updatedLastRow = sheet.getLastRow();
    const lastEntry = sheet.getRange(updatedLastRow, 1).getValue();
    console.log(`Last entry in sheet: ${lastEntry}`);
    
    return {
      success: true,
      newPRNumber: newPR,
      lastEntry: lastEntry
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

function runSetup() {
  const result = setupAndVerify();
  console.log('Setup result:', result);
}

function runTest() {
  const result = testPRGeneration();
  console.log('Test result:', JSON.stringify(result, null, 2));
}

/**
 * Function: reinitializePRTracker()
 * Clears and reinitializes the PR Number Tracker sheet with correct format
 */
function reinitializePRTracker() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Connected to spreadsheet');
    
    // Get the existing sheet
    let sheet = ss.getSheetByName('PR Number Tracker');
    
    if (sheet) {
      // Delete the existing sheet
      ss.deleteSheet(sheet);
      console.log('Deleted existing PR Number Tracker sheet');
    }
    
    // Create new sheet
    sheet = ss.insertSheet('PR Number Tracker');
    console.log('Created new PR Number Tracker sheet');
    
    // Set up headers
    const headers = [['PR Number', 'Generated Date', 'Generated By']];
    sheet.getRange(1, 1, 1, 3).setValues(headers);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, 3);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#E8EAED');
    headerRange.setHorizontalAlignment('center');
    
    // Set column widths
    sheet.setColumnWidth(1, 150);  // PR Number
    sheet.setColumnWidth(2, 180);  // Generated Date
    sheet.setColumnWidth(3, 200);  // Generated By
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Set date format for Generated Date column
    sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
    // Add first PR number for current month
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const firstPR = `PR-${currentYear}${currentMonth.toString().padStart(2, '0')}-001`;
    
    const firstRow = [
      firstPR,
      new Date(),
      Session.getActiveUser().getEmail()
    ];
    sheet.getRange(2, 1, 1, 3).setValues([firstRow]);
    
    // Add protection to ensure data integrity
    const protection = sheet.protect();
    protection.setDescription('PR Number Tracking Protection');
    protection.setWarningOnly(true);
    
    console.log('Sheet reinitialized successfully');
    console.log(`First PR number generated: ${firstPR}`);
    
    return {
      success: true,
      firstPRNumber: firstPR,
      message: 'PR Number Tracker reinitialized successfully'
    };
    
  } catch (error) {
    console.error('Reinitialization failed:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to reinitialize PR Number Tracker'
    };
  }
}

/**
 * Function: verifyPRTracker()
 * Verifies the PR Number Tracker sheet is properly configured
 */
function verifyPRTracker() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('PR Number Tracker');
    
    if (!sheet) {
      throw new Error('PR Number Tracker sheet not found');
    }
    
    // Verify headers
    const headers = sheet.getRange(1, 1, 1, 3).getValues()[0];
    const expectedHeaders = ['PR Number', 'Generated Date', 'Generated By'];
    
    const headersCorrect = headers.every((header, index) => 
      header === expectedHeaders[index]
    );
    
    if (!headersCorrect) {
      throw new Error('Headers do not match expected format');
    }
    
    // Verify data format of existing entries
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const lastPR = sheet.getRange(lastRow, 1).getValue();
      const prPattern = /^PR-\d{6}-\d{3}$/;
      if (!prPattern.test(lastPR)) {
        throw new Error('PR number format is incorrect');
      }
    }
    
    return {
      success: true,
      lastRow: lastRow,
      message: 'PR Number Tracker verified successfully'
    };
    
  } catch (error) {
    console.error('Verification failed:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to verify PR Number Tracker'
    };
  }
}

/**
 * Validates form data before submission
 * @param {Object} data The form data to validate
 * @returns {Array} Array of validation errors (empty if valid)
 */
function validateFormData(data) {
    const errors = [];
    
    // Check required fields for basic information
    if (!validateBasicInfo(data)) {
        errors.push('Basic information is incomplete');
    }

    // Check project and financial details
    if (!validateProjectDetails(data)) {
        errors.push('Project and financial details are incomplete');
    }

    // Check location and type
    if (!validateLocationAndType(data)) {
        errors.push('Location and type information is incomplete');
    }

    // Check vehicle details if required
    if (isVehicleRequired(data) && !validateVehicleDetails(data)) {
        errors.push('Vehicle information is required but incomplete');
    }

    // Check budget and timeline
    if (!validateBudgetAndTimeline(data)) {
        errors.push('Budget and timeline information is incomplete');
    }

    // Check line items
    if (!validateLineItems(data)) {
        errors.push('Line items are incomplete or invalid');
    }

    // Check additional information
    if (!validateAdditionalInfo(data)) {
        errors.push('Additional information is incomplete');
    }

    return errors;
}

/**
 * Validates basic requestor information
 */
function validateBasicInfo(data) {
    return !!(
        data.requestorName &&
        data.department &&
        data.requestorEmail &&
        data.requestShortDescription
    );
}

/**
 * Validates project and financial details
 */
function validateProjectDetails(data) {
    return !!(
        data.projectCategory &&
        data.acquiringOrganization &&
        data.currency &&
        data.paymentFormat &&
        (data.currency !== 'Other' || data.currencyOther) &&
        (data.paymentFormat !== 'Other' || data.paymentFormatOther)
    );
}

/**
 * Validates location and type information
 */
function validateLocationAndType(data) {
    return !!(
        data.siteLocation &&
        data.expenseType
    );
}

/**
 * Checks if vehicle information is required
 */
function isVehicleRequired(data) {
    return data.expenseType && data.expenseType.startsWith('4:');
}

/**
 * Validates vehicle details
 */
function validateVehicleDetails(data) {
    return !!(data.vehicleSelection);
}

/**
 * Validates budget and timeline information
 */
function validateBudgetAndTimeline(data) {
    return !!(
        data.approvedBudget &&
        data.deadlineDate &&
        (data.approvedBudget !== 'Other' || data.approvedBudgetOther)
    );
}

/**
 * Validates line items
 */
function validateLineItems(data) {
    if (!data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0) {
        return false;
    }

    return data.lineItems.every(item => 
        item.item && 
        item.qty && 
        item.uom
    );
}

/**
 * Validates additional information
 */
function validateAdditionalInfo(data) {
    return !!(
        data.vendor &&
        data.urgencyStatus &&
        data.approverSelection
    );
}

/**
 * Cache duration for exchange rates (4 hours in seconds)
 */
const EXCHANGE_RATE_CACHE_DURATION = 14400;

/**
 * API key for exchangerate-api.com
 */
const EXCHANGE_RATE_API_KEY = '3e0664ee236d49ee44e8c4de';

/**
 * Gets current exchange rates from API
 * @returns {Object} Exchange rates with LSL as base
 */
function getCurrentExchangeRates() {
    const cache = CacheService.getScriptCache();
    const cachedRates = cache.get('exchangeRates');
    
    if (cachedRates) {
        console.log('Using cached exchange rates');
        return JSON.parse(cachedRates);
    }

    try {
        const response = UrlFetchApp.fetch(
            `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/LSL`
        );
        
        const result = JSON.parse(response.getContentText());
        
        if (result.result === 'success') {
            // Cache the rates
            cache.put('exchangeRates', JSON.stringify(result.conversion_rates), EXCHANGE_RATE_CACHE_DURATION);
            console.log('Successfully fetched and cached new exchange rates');
            return result.conversion_rates;
        } else {
            throw new Error('Failed to fetch exchange rates: ' + JSON.stringify(result));
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to static rates if API fails
        const fallbackRates = {
            'LSL': 1,
            'USD': 19.02,
            'EUR': 20.47,
            'GBP': 23.67
        };
        console.log('Using fallback exchange rates:', fallbackRates);
        return fallbackRates;
    }
}

/**
 * Converts amount to LSL using current exchange rates
 * @param {number} amount - The amount to convert
 * @param {string} currency - The currency code
 * @returns {number} Amount in LSL
 */
function convertToLSL(amount, currency) {
    if (!amount) return 0;
    if (currency === 'LSL') return Number(amount);
    
    try {
        const rates = getCurrentExchangeRates();
        console.log(`Converting ${amount} ${currency} to LSL using rates:`, rates);
        
        // If we have a rate for this currency, convert
        if (rates[currency]) {
            // Since rates are based on LSL, we divide by the rate
            const convertedAmount = Number(amount) / rates[currency];
            console.log(`Converted amount: ${convertedAmount} LSL`);
            return convertedAmount;
        }
        
        console.warn(`Unknown currency: ${currency}. Amount not converted.`);
        return Number(amount);
    } catch (error) {
        console.error('Error converting currency:', error);
        return Number(amount);
    }
}

/**
 * Test function to verify exchange rate functionality
 */
function testExchangeRates() {
    console.log('Starting exchange rate test');
    try {
        const rates = getCurrentExchangeRates();
        console.log('Current exchange rates:', rates);
        
        const testAmounts = [
            {amount: 1000, currency: 'USD'},
            {amount: 1000, currency: 'EUR'},
            {amount: 1000, currency: 'GBP'}
        ];
        
        testAmounts.forEach(test => {
            const lslAmount = convertToLSL(test.amount, test.currency);
            console.log(`${test.amount} ${test.currency} = ${lslAmount.toFixed(2)} LSL`);
        });
        
        return {
            success: true,
            rates: rates,
            testResults: testAmounts.map(test => ({
                original: `${test.amount} ${test.currency}`,
                converted: `${convertToLSL(test.amount, test.currency).toFixed(2)} LSL`
            }))
        };
    } catch (error) {
        console.error('Exchange rate test failed:', error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

/**
 * Checks if vendor is in approved vendor list
 * @param {string} vendorName - Name of vendor to check
 * @returns {boolean} True if vendor is approved
 */
function checkApprovedVendor(vendorName) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName('Vendor List');
        
        if (!sheet) {
            console.warn('Vendor List sheet not found');
            return false;
        }

        const data = sheet.getDataRange().getValues();
        
        // Skip header row and find vendor
        for (let i = 1; i < data.length; i++) {
            if (data[i][0].trim() === vendorName) {
                return data[i][1].trim() === 'Y'; // Return true if approved
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking vendor status:', error);
        return false;
    }
}

/**
 * Calculates if quotes are required based on amount and vendor status
 * @param {number} amountLSL - Amount in LSL
 * @param {boolean} isApprovedVendor - Whether vendor is approved
 * @returns {string} 'Y' or 'N'
 */
function calculateQuotesRequired(amountLSL, isApprovedVendor) {
    const QUOTE_THRESHOLD_LOWER = 5000;  // LSL 5,000
    const QUOTE_THRESHOLD_UPPER = 50000; // LSL 50,000

    if (amountLSL >= QUOTE_THRESHOLD_UPPER) {
        return 'Y';  // Always required for amounts >= 50,000
    }
    
    if (amountLSL >= QUOTE_THRESHOLD_LOWER && !isApprovedVendor) {
        return 'Y';  // Required for amounts >= 5,000 with unapproved vendor
    }
    
    return 'N';
}

/**
 * Calculates if adjudication is required based on amount
 * @param {number} amountLSL - Amount in LSL
 * @returns {string} 'Y' or 'N'
 */
function calculateAdjudicationRequired(amountLSL) {
    const ADJ_THRESHOLD = 50000; // LSL 50,000
    return amountLSL >= ADJ_THRESHOLD ? 'Y' : 'N';
}

/**
 * Calculates the days a PR has been open
 * @param {Date} timestamp - PR submission timestamp
 * @returns {number} Number of business days open
 */
function calculateDaysOpen(timestamp) {
    if (!timestamp) return 0;
    
    const today = new Date();
    let count = 0;
    let current = new Date(timestamp);
    
    while (current <= today) {
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (current.getDay() !== 0 && current.getDay() !== 6) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return Math.max(0, count - 1); // Subtract 1 as we don't count the current day
}

/**
 * Calculates completion percentage
 * @param {Object} data - Form data
 * @returns {number} Percentage complete (0-100)
 */
function calculateCompletionPercentage(data) {
    const requiredFields = [
        'requestorName',
        'department',
        'requestorEmail',
        'requestShortDescription',
        'projectCategory',
        'acquiringOrganization',
        'currency',
        'paymentFormat',
        'siteLocation',
        'expenseType',
        'approvedBudget',
        'deadlineDate',
        'vendor',
        'urgencyStatus',
        'approverSelection'
    ];

    let filledCount = 0;
    let totalFields = requiredFields.length;

    requiredFields.forEach(field => {
        if (data[field] && data[field].toString().trim() !== '') {
            filledCount++;
        }
    });

    // Check line items if present
    if (data.lineItems && data.lineItems.length > 0) {
        const validItems = data.lineItems.filter(item => 
            item.item && item.qty && item.uom
        ).length;
        filledCount += validItems;
        totalFields += data.lineItems.length;
    }

    return Math.round((filledCount / totalFields) * 100);
}

/**
 * Calculate queue position for PR
 * @param {string} urgencyStatus - Urgency status of PR
 * @param {Date} timestamp - Submission timestamp
 * @returns {string} Queue position in format "N/M"
 */
function calculateQueuePosition(urgencyStatus, timestamp) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName('Master Log');
        
        if (!sheet) return "1/1";

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        const statusCol = headers.indexOf('po status');
        const urgencyCol = headers.indexOf('urgency status');
        const timestampCol = headers.indexOf('timestamp');
        
        if (statusCol === -1 || urgencyCol === -1 || timestampCol === -1) {
            return "1/1";
        }

        // Get active PRs
        const activePRs = data.slice(1)
            .filter(row => row[statusCol] !== 'Completed' && 
                         row[statusCol] !== 'Rejected' &&
                         row[statusCol] !== 'Canceled')
            .map(row => ({
                urgent: row[urgencyCol] === 'Urgent',
                timestamp: row[timestampCol]
            }));

        // Add current PR
        activePRs.push({
            urgent: urgencyStatus === 'Urgent',
            timestamp: timestamp
        });

        // Sort by urgency and timestamp
        activePRs.sort((a, b) => {
            if (a.urgent !== b.urgent) return b.urgent ? 1 : -1;
            return a.timestamp - b.timestamp;
        });

        // Find position of new PR
        const position = activePRs.length;
        return `${position}/${position}`;
        
    } catch (error) {
        console.error('Error calculating queue position:', error);
        return "1/1";
    }
}

/**
 * Gets the next PR number for display on form
 * Stores it in user cache to reserve it
 * @returns {string} Next PR number
 */
function getPRNumber() {
    try {
        // Get spreadsheet access
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName('PR Number Tracker');
        
        if (!sheet) {
            console.error('Failed to open PR Number Tracker sheet');
            return 'PR-ERROR-SHEET';
        }

        // Get today's date
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentYearMonth = `${currentYear}${currentMonth.toString().padStart(2, '0')}`;

        // Get PR number column data
        const dataRange = sheet.getRange('A:A'); // Assuming PR numbers are in column A
        const prNumbers = dataRange.getValues();
        
        // Find highest number for current month
        let maxNumber = 0;
        const prPattern = new RegExp(`PR-${currentYearMonth}-(\\d{3})`);
        
        prNumbers.forEach(row => {
            if (row[0]) {
                const prNum = row[0].toString();
                const match = prNum.match(prPattern);
                if (match) {
                    const num = parseInt(match[1], 10);
                    maxNumber = Math.max(maxNumber, num);
                    console.log(`Found PR number: ${prNum}, extracted number: ${num}`);
                }
            }
        });

        console.log(`Highest number found for ${currentYearMonth}: ${maxNumber}`);

        // Increment and validate
        const nextNumber = maxNumber + 1;
        if (nextNumber > 999) {
            console.error(`PR number limit reached for ${currentYearMonth}`);
            return 'PR-LIMIT';
        }

        // Format new PR number
        const paddedNumber = nextNumber.toString().padStart(3, '0');
        const newPRNumber = `PR-${currentYearMonth}-${paddedNumber}`;

        // Store in user cache to reserve it
        const userCache = CacheService.getUserCache();
        userCache.put('currentPRNumber', newPRNumber, 3600); // Cache for 1 hour

        return newPRNumber;

    } catch (error) {
        console.error('Error in getPRNumber:', error);
        return 'PR-ERROR-GENERAL';
    }
}

/**
 * Gets the reserved PR number for form submission
 * @returns {string} Reserved PR number or generates new one if none reserved
 */
function getReservedPRNumber() {
    const userCache = CacheService.getUserCache();
    const reservedNumber = userCache.get('currentPRNumber');
    
    if (reservedNumber) {
        // Clear the cache after getting the number
        userCache.remove('currentPRNumber');
        return reservedNumber;
    }
    
    // If no reserved number, generate new one
    return getPRNumber();
}

/**
 * Records the PR number in the tracker sheet
 * @param {string} prNumber - PR number to record
 */
function recordPRNumber(prNumber) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName('PR Number Tracker');
        
        if (!sheet) return;

        // Log the new number in the tracker sheet
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1).setValue(prNumber);
        sheet.getRange(lastRow + 1, 2).setValue(new Date()); // Timestamp
        sheet.getRange(lastRow + 1, 3).setValue(Session.getActiveUser().getEmail()); // User
        
    } catch (error) {
        console.error('Error recording PR number:', error);
    }
}

function getWebAppUrl(page = '') {
    Logger.log('Getting web app URL for page:', page);
    const baseUrl = ScriptApp.getService().getUrl();
    Logger.log('Base URL:', baseUrl);
    
    if (page) {
        const fullUrl = `${baseUrl}?page=${encodeURIComponent(page)}`;
        Logger.log('Generated full URL:', fullUrl);
        return fullUrl;
    }
    
    Logger.log('Returning base URL');
    return baseUrl;
}

function formatLineItemsForStorage(lineItems) {
  // Escape special characters and wrap items in numbered tags
  function escapeXml(str) {
    return str?.toString().replace(/[<>&'"]/g, char => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;'
      };
      return entities[char];
    }) || '';
  }

  const formattedColumns = {
    items: '',
    quantities: '',
    uoms: '',
    urls: ''
  };

  lineItems.forEach((item, index) => {
    const num = index + 1;
    formattedColumns.items += `<${num}>${escapeXml(item.item)}</${num}>`;
    formattedColumns.quantities += `<${num}>${escapeXml(item.qty)}</${num}>`;
    formattedColumns.uoms += `<${num}>${escapeXml(item.uom)}</${num}>`;
    if (item.url?.trim()) {
      formattedColumns.urls += `<${num}>${escapeXml(item.url)}</${num}>`;
    }
  });

  return formattedColumns;
}

function parseLineItems(row) {
  console.log('Starting parseLineItems');
  console.log('Input row data:', row);

  function extractTaggedItems(str) {
    console.log('Extracting from string:', str);
    const items = [];
    const regex = /<(\d+)>(.*?)<\/\1>/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      console.log('Found match:', match);
      items[parseInt(match[1]) - 1] = match[2].replace(/&lt;/g, '<')
                                              .replace(/&gt;/g, '>')
                                              .replace(/&amp;/g, '&')
                                              .replace(/&apos;/g, "'")
                                              .replace(/&quot;/g, '"');
    }
    console.log('Extracted items:', items);
    return items;
  }

  const items = extractTaggedItems(row[COL.ITEM_LIST] || '');
  const quantities = extractTaggedItems(row[COL.QTY_LIST] || '');
  const uoms = extractTaggedItems(row[COL.UOM_LIST] || '');
  const urls = extractTaggedItems(row[COL.URL_LIST] || '');

  const result = items.map((item, index) => ({
    item: item || '',
    qty: quantities[index] || '',
    uom: uoms[index] || '',
    url: urls[index] || ''
  })).filter(item => item.item || item.qty || item.uom);

  console.log('Final parsed line items:', result);
  return result;
}

// helper function to get approver email
function getApproverEmail(approverName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Approver List');
    
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    
    // Skip header row and find approver
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].trim() === approverName) {
        return data[i][1].trim(); // Return email from column B
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting approver email:', error);
    return null;
  }
}

/**
 * Handles POST requests for secure redirects
 * @param {Object} e - Event object from form submission
 * @returns {HtmlOutput} Appropriate page based on session
 */
function doPost(e) {
    console.log('Handling POST request with parameters:', e.parameter);
  
    try {
        // Check if this is a form submission from login
        if (!e.parameter.sessionId) {
            console.log('No session ID in POST request, showing login page');
            const loginTemplate = HtmlService.createTemplateFromFile('Login');
            loginTemplate.nonce = generateNonce();
            return loginTemplate
                .evaluate()
                .setTitle('Login - 1PWR Procurement')
                .addMetaTag('viewport', 'width=device-width, initial-scale=1')
                .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        }

        console.log('Session ID found in POST request:', e.parameter.sessionId);
        
        // Get user from session
        const user = getCurrentUserFromAuth(e.parameter.sessionId);
        if (!user) {
            console.log('No valid user found for session');
            const loginTemplate = HtmlService.createTemplateFromFile('Login');
            loginTemplate.nonce = generateNonce();
            return loginTemplate
                .evaluate()
                .setTitle('Login - 1PWR Procurement')
                .addMetaTag('viewport', 'width=device-width, initial-scale=1')
                .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        }

        // Handle AJAX requests from dashboard that include action parameter
        if (e.parameter.action) {
            // Process AJAX actions
            return processAjaxRequest(e.parameter.action, user, e.parameter);
        }
        
        console.log('Creating dashboard for user:', user.name);
        // Create dashboard page with session
        const dashboardTemplate = HtmlService.createTemplateFromFile('DashboardWeb');
        dashboardTemplate.user = user;
        dashboardTemplate.sessionId = e.parameter.sessionId;
        dashboardTemplate.nonce = generateNonce();
        
        return dashboardTemplate
            .evaluate()
            .setTitle('Dashboard - 1PWR Procurement')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
            
    } catch (error) {
        console.error('Error in doPost:', error);
        const errorTemplate = HtmlService.createTemplateFromFile('Login');
        errorTemplate.nonce = generateNonce();
        errorTemplate.error = 'An error occurred. Please try again.';
        return errorTemplate
            .evaluate()
            .setTitle('Login - 1PWR Procurement')
            .addMetaTag('viewport', 'width=device-width, initial-scale=1')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
}

// Helper function to process AJAX requests
function processAjaxRequest(action, user, params) {
    switch(action) {
        case 'updateStatus':
            return updateStatus(params.prNumber, params.newStatus, params.notes, user);
        case 'getDashboardData':
            return getDashboardData(params.organization, user);
        // Add other AJAX actions as needed
        default:
            throw new Error('Unknown action: ' + action);
    }
}

/**
 * Gets the list of requestors from the Requestor List sheet
 * @return {Array} Array of requestor objects with name and active status
 */
function getRequestorList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Requestor List');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Get column indices
    const nameCol = headers.indexOf('Name');
    const activeCol = headers.indexOf('Active (Y/N)');

    // Skip header row and map data
    return data.slice(1).map(row => ({
      name: row[nameCol],
      active: row[activeCol]
    }));
  } catch (error) {
    console.error('Error getting requestor list:', error);
    throw new Error('Failed to load requestor list');
  }
}

/**
 * Authenticates a user against the Requestor List
 * @param {string} username - The user's name
 * @param {string} password - The user's password
 * @return {Object} Authentication result with success flag and session info
 */
function authenticate(username, password) {
  Logger.log('authenticate: Started for user: ' + username);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Requestor List');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Get column indices
    const nameCol = headers.indexOf('Name');
    const passwordCol = headers.indexOf('Password');
    const activeCol = headers.indexOf('Active (Y/N)');
    const emailCol = headers.indexOf('Email');
    const roleCol = headers.indexOf('Role');
    
    // Find user row
    const userRow = data.find(row => 
      row[nameCol] === username && 
      row[activeCol] === 'Y' && 
      row[passwordCol] === password
    );
    
    Logger.log('authenticate: User found: ' + (userRow ? 'yes' : 'no'));
    
    if (!userRow) {
      Logger.log('authenticate: Invalid credentials or inactive account');
      return {
        success: false,
        error: 'Invalid credentials or inactive account'
      };
    }
    
    // Create session
    const sessionId = Utilities.getUuid();
    const userSession = {
      sessionId: sessionId,
      name: userRow[nameCol],
      email: userRow[emailCol],
      role: userRow[roleCol],
      timestamp: new Date().toISOString()
    };
    
    Logger.log('authenticate: Created session: ' + JSON.stringify(userSession));
    
    // Store session (implement your session storage method)
    CacheService.getUserCache().put(sessionId, JSON.stringify(userSession), 21600); // 6 hours
    
    // Get the script URL
    const scriptUrl = ScriptApp.getService().getUrl();
    Logger.log('authenticate: Script URL: ' + scriptUrl);
    
    const redirectUrl = `${scriptUrl}?page=dashboard&sessionId=${sessionId}`;
    Logger.log('authenticate: Redirect URL: ' + redirectUrl);
    
    return {
      success: true,
      sessionId: sessionId,
      redirectUrl: redirectUrl
    };
  } catch (error) {
    Logger.log('authenticate: Error: ' + error);
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'An error occurred during authentication'
    };
  }
}

/**
 * Generates a secure nonce for CSP headers
 * @returns {string} A secure random string
 */
function generateNonce() {
  return Utilities.getUuid();
}
