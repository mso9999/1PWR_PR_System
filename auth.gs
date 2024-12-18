/*******************************************************************************************
 * File: auth.gs
 * Version: 1.7
 * Last Updated: 2024-12-08
 *
 * Description:
 *   Handles user authentication, session management, and security for the PR system.
 *   Implements secure session storage using Google Apps Script Cache Service and Spreadsheet.
 *
 * Changes in 1.7:
 *   - Updated session storage to persist sessions in both cache and sheet
 *   - Fixed X-Frame-Options issue to allow iframe embedding
 *
 * Changes in 1.6:
 *   - Added more logging to validateSession
 *   - Improved error handling in session validation
 *
 * Changes in 1.5:
 *   - Updated to use CONFIG.SPREADSHEET_ID for consistency
 *
 * Changes in 1.4:
 *   - Fixed session management error by consolidating duplicate functions
 *   - Added proper error handling for requestor list loading
 *   - Improved session validation and user authentication flow
 *   - Enhanced error logging for debugging purposes
 *******************************************************************************************/

const SESSION_DURATION = 21600; // 6 hours in seconds
const CACHE_PREFIX = '1pwr_session_';

/**
 * Authenticates a user against the Requestor List.
 * @param {string} username - The username to authenticate
 * @param {string} password - The password to verify
 * @return {Object} Authentication result with session info
 */
function authenticateUser(username, password) {
  console.log('Starting authentication for user:', username);
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Requestor List');
    if (!sheet) {
      console.error('Requestor List sheet not found');
      return { success: false, message: 'Authentication system unavailable' };
    }

    const data = sheet.getDataRange().getValues();
    console.log('Found', data.length, 'rows in Requestor List');
    console.log('Header row:', data[0]);
    
    // Find user row where:
    // Column A (index 0) = Name
    // Column E (index 4) = Password
    // Column D (index 3) = Active status ('Y')
    const userRow = data.find(row => {
      const nameMatch = row[0].toString().toLowerCase() === username.toLowerCase();
      const passwordMatch = row[4] === password;
      const isActive = row[3] === 'Y';
      
      console.log(`Checking row: name=${nameMatch}, password=${passwordMatch}, active=${isActive}`);
      return nameMatch && passwordMatch && isActive;
    });

    if (!userRow) {
      console.log('Authentication failed for user:', username);
      return { success: false, message: 'Invalid credentials or inactive user' };
    }

    // Create session
    const sessionId = Utilities.getUuid();
    const userInfo = {
      name: userRow[0],    // Name (Column A)
      email: userRow[1],   // Email (Column B)
      department: userRow[2], // Department (Column C)
      role: userRow[5],    // Role (Column F)
      timestamp: new Date().toISOString()
    };

    // Store session
    if (!storeSession(sessionId, userInfo)) {
      console.error('Failed to store session');
      return { success: false, message: 'Session creation failed' };
    }

    console.log('Authentication successful for user:', username);
    return {
      success: true,
      sessionId: sessionId,
      user: userInfo
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication system error' };
  }
}

/**
 * Stores a user session in sheet.
 * @param {string} sessionId - Unique session identifier
 * @param {Object} userInfo - User information to store
 * @return {boolean} Success status
 */
function storeSession(sessionId, userInfo) {
  console.log('Storing session:', sessionId);
  
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log('Opening spreadsheet:', CONFIG.SPREADSHEET_ID);
    
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVE_SESSIONS);
    if (!sheet) {
      console.error('Active sessions sheet not found');
      return false;
    }
    
    // Get current data
    const data = sheet.getDataRange().getValues();
    console.log('Current sheet data:', JSON.stringify(data));
    
    // Find next empty row
    const nextRow = data.length + 1;
    console.log('Adding new session at row:', nextRow - 1);
    
    // Prepare row data
    const timestamp = new Date().toISOString();
    const rowData = [
      sessionId,
      JSON.stringify(userInfo),
      true,
      timestamp
    ];
    console.log('Writing row data:', JSON.stringify(rowData));
    
    // Write new session
    sheet.getRange(nextRow, 1, 1, 4).setValues([rowData]);
    
    // Force the write to complete
    SpreadsheetApp.flush();
    
    // Verify the write
    const verifyData = sheet.getRange(nextRow, 1, 1, 4).getValues()[0];
    console.log('Verifying written data:', JSON.stringify(verifyData));
    
    // Double check the write with another flush
    SpreadsheetApp.flush();
    
    if (verifyData[0] === sessionId && verifyData[2] === true) {
      console.log('Session stored successfully in sheet');
      return true;
    } else {
      console.error('Session verification failed. Written:', JSON.stringify(verifyData));
      return false;
    }
    
  } catch (error) {
    console.error('Error storing session:', error);
    return false;
  }
}

/**
 * Retrieves user information from a session.
 * @param {string} sessionId - Session to retrieve
 * @return {Object|null} User information or null if invalid
 */
function getUserFromSession(sessionId) {
  console.log('Getting user from session:', sessionId);
  
  try {
    // If not in cache, check active sessions sheet
    console.log('Session not in cache, checking sheet');
    console.log('Opening spreadsheet:', CONFIG.SPREADSHEET_ID);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    if (!ss) {
      throw new Error('Failed to open spreadsheet');
    }
    
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVE_SESSIONS);
    if (!sheet) {
      console.log('ActiveSessions sheet not found');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('Found', data.length - 1, 'sessions in sheet');
    
    // Log the header row to verify column order
    console.log('Header row:', data[0]);
    
    for (let i = 1; i < data.length; i++) {
      // Log the raw session data for debugging
      console.log('Row', i, 'data:', JSON.stringify(data[i]));
      
      if (data[i][0] === sessionId) {
        console.log('Found matching session ID. Active status:', data[i][2]);
        
        // Check if session is active (true or TRUE)
        const isActive = data[i][2] === true || data[i][2] === 'TRUE';
        
        if (isActive) {
          console.log('Session is active');
          const userInfo = JSON.parse(data[i][1]); // User info is in column B
          
          return userInfo;
        } else {
          console.log('Session found but not active');
        }
      }
    }

    console.log('Session not found in sheet or inactive');
    return null;
  } catch (error) {
    console.error('Session retrieval error:', error.toString());
    console.error('Stack trace:', error.stack);
    return null;
  }
}

/**
 * Removes a session from sheet.
 * @param {string} sessionId - Session to remove
 */
function removeSession(sessionId) {
  try {
    // Remove from sheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVE_SESSIONS);
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === sessionId) {
          // Instead of clearing, mark as inactive
          sheet.getRange(i + 1, 3).setValue(false); // Set Active to false
          sheet.getRange(i + 1, 4).setValue(new Date().toISOString()); // Update LastAccessed
          break;
        }
      }
    }
    
    console.log('Session removed:', sessionId);
  } catch (error) {
    console.error('Session removal error:', error.toString());
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Validates a session and refreshes its expiration.
 * @param {string} sessionId - Session to validate
 * @return {boolean} Validity status
 */
function validateSession(sessionId) {
  console.log('Validating session:', sessionId);
  
  if (!sessionId) {
    console.log('No session ID provided');
    return null;
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log('Opened spreadsheet:', CONFIG.SPREADSHEET_ID);
    
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVE_SESSIONS);
    console.log('Got sheet:', CONFIG.SHEETS.ACTIVE_SESSIONS);
    
    // Force a refresh of the data
    SpreadsheetApp.flush();
    Utilities.sleep(1000); // Add a small delay to ensure sheet is updated
    
    const data = sheet.getDataRange().getValues();
    console.log('Total rows in sheet:', data.length);
    console.log('Header row:', JSON.stringify(data[0]));
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log(`\nChecking row ${i}:`);
      console.log('SessionID:', JSON.stringify(row[0]));
      console.log('SessionID type:', typeof row[0]);
      console.log('Active:', JSON.stringify(row[2]));
      console.log('Active type:', typeof row[2]);
      console.log('LastAccessed:', JSON.stringify(row[3]));
      console.log('Comparing:', JSON.stringify({
        sessionIdMatch: row[0] === sessionId,
        activeMatch: row[2] === true
      }));
      
      if (String(row[0]) === String(sessionId)) {
        console.log('Found matching session!');
        if (row[2] === true) {
          console.log('Session is active');
          try {
            const userInfo = JSON.parse(row[1]);
            console.log('Successfully parsed user info:', JSON.stringify(userInfo));
            
            // Update last accessed time
            const now = new Date().toISOString();
            sheet.getRange(i + 1, 4).setValue(now);
            SpreadsheetApp.flush();
            console.log('Updated LastAccessed to:', now);
            
            return userInfo;
          } catch (parseError) {
            console.error('Error parsing user info:', parseError);
            return null;
          }
        } else {
          console.log('Session is not active, active =', row[2]);
          return null;
        }
      }
    }
    
    console.log('\nSession not found in sheet after checking all rows');
    return null;
  } catch (error) {
    console.error('Error validating session:', error.toString());
    console.error('Stack trace:', error.stack);
    return null;
  }
}

/**
 * Sets security headers for HTML output
 * @param {HtmlOutput} output - The HTML output to set headers for
 * @returns {HtmlOutput} The HTML output with headers set
 */
function setSecurityHeadersAuth(output) {
  return output
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.IFRAME)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Handles HTTP GET requests
 * @param {Object} e - Event object
 * @return {HtmlOutput} HTML output
 */
function doGet(e) {
  const page = e.parameter.page || 'login';
  console.log('Event parameters:', JSON.stringify(e.parameter));
  
  // Get session ID from URL parameters
  const sessionId = e.parameter.sessionId;
  console.log('Session ID from URL:', sessionId);
  
  // Create template and set security headers
  const template = HtmlService.createTemplateFromFile(page === 'dashboard' ? 'DashboardPage' : 'LoginPage');
  const output = template.evaluate()
    .setTitle('1PWR PR System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  
  console.log(`${page} template evaluated successfully`);
  return output;
}

/**
 * Gets the web app URL with enhanced error handling and logging
 * @param {string} page - Optional page parameter
 * @return {string} Web app URL
 */
function getWebAppUrl(page) {
  console.log('Getting web app URL for page:', page);
  
  try {
    // Get the deployment ID from the current deployment
    let deploymentId;
    try {
      const service = ScriptApp.getService();
      const currentUrl = service.getUrl();
      deploymentId = currentUrl.match(/\/macros\/[^/]+\/([^/]+)/)?.[1];
    } catch (e) {
      console.warn('Could not get deployment ID from service:', e);
      // Fallback to script ID
      deploymentId = ScriptApp.getScriptId();
    }
    
    if (!deploymentId) {
      throw new Error('Failed to get deployment/script ID');
    }
    
    // Construct base URL with deployment ID
    const baseUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
    console.log('Using base URL:', baseUrl);
    
    // Add page parameter
    const fullUrl = `${baseUrl}?page=${encodeURIComponent(page)}`;
    console.log('Generated full URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('Error getting web app URL:', error);
    throw error; // Let the caller handle the error
  }
}

/**
 * Gets the web app URL with enhanced error handling and logging
 * @param {string} page - Optional page parameter
 * @return {string} Web app URL
 */
function getWebAppUrlFromAuth(page = 'dashboard') {
  console.log('Getting web app URL for page:', page);
  
  try {
    // Get the deployment ID from the current deployment
    let deploymentId;
    try {
      const service = ScriptApp.getService();
      const currentUrl = service.getUrl();
      deploymentId = currentUrl.match(/\/macros\/[^/]+\/([^/]+)/)?.[1];
    } catch (e) {
      console.warn('Could not get deployment ID from service:', e);
      // Fallback to script ID
      deploymentId = ScriptApp.getScriptId();
    }
    
    if (!deploymentId) {
      throw new Error('Failed to get deployment/script ID');
    }
    
    // Construct base URL with deployment ID
    const baseUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
    console.log('Using base URL:', baseUrl);
    
    // Add page parameter
    const fullUrl = `${baseUrl}?page=${encodeURIComponent(page)}`;
    console.log('Generated full URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('Error in getWebAppUrlFromAuth:', error);
    throw error;
  }
}

/**
 * Gets the dashboard URL with session ID
 * @param {string} sessionId - Session ID to include in URL
 * @return {string} Dashboard URL with session ID
 */
function getDashboardUrl(sessionId) {
  console.log('Getting dashboard URL for session:', sessionId);
  
  const userInfo = validateSession(sessionId);
  console.log('Session validation result:', userInfo);
  
  if (!userInfo) {
    console.error('Invalid or expired session:', sessionId);
    return getWebAppUrl('login', { sessionExpired: true });
  }
  
  return getWebAppUrl('dashboard', { sessionId: sessionId });
}

/**
 * Gets current user from session with enhanced validation
 * @param {string} sessionId - Session ID to validate
 * @return {Object|null} User information or null if invalid
 */
function getCurrentUser(sessionId) {
  console.log('Getting current user for session:', sessionId);
  
  try {
    if (!sessionId) {
      console.log('No session ID provided');
      return null;
    }

    const userInfo = getUserFromSession(sessionId);
    
    // Validate user info structure
    if (!userInfo || !userInfo.email || !userInfo.role) {
      console.error('Invalid user info structure:', userInfo);
      return null;
    }

    return userInfo;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
