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
 * Stores a user session in cache and sheet.
 * @param {string} sessionId - Unique session identifier
 * @param {Object} userInfo - User information to store
 * @return {boolean} Success status
 */
function storeSession(sessionId, userInfo) {
  console.log('Storing session:', sessionId);
  try {
    // Store in cache first
    const cache = CacheService.getUserCache();
    const key = CACHE_PREFIX + sessionId;
    const value = JSON.stringify(userInfo);
    cache.put(key, value, SESSION_DURATION);
    console.log('Session stored in cache');
    
    // Get or create ActiveSessions sheet
    console.log('Opening spreadsheet:', CONFIG.SPREADSHEET_ID);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    if (!ss) {
      throw new Error('Failed to open spreadsheet');
    }
    
    let sheet = ss.getSheetByName('ActiveSessions');
    if (!sheet) {
      console.log('Creating ActiveSessions sheet');
      sheet = ss.insertSheet('ActiveSessions');
      if (!sheet) {
        throw new Error('Failed to create ActiveSessions sheet');
      }
      
      // Set up header row
      sheet.getRange('A1:D1').setValues([['SessionID', 'UserInfo', 'Active', 'LastAccessed']]);
      sheet.setFrozenRows(1);
      
      // Set column widths for better readability
      sheet.setColumnWidth(1, 250); // SessionID
      sheet.setColumnWidth(2, 300); // UserInfo
      sheet.setColumnWidth(3, 100); // Active
      sheet.setColumnWidth(4, 200); // LastAccessed
      console.log('Sheet created and formatted');
    }
    
    // Find existing session or get next empty row
    const data = sheet.getDataRange().getValues();
    console.log('Current sheet data:', JSON.stringify(data));
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionId) {
        rowIndex = i + 1;
        console.log('Found existing session at row:', rowIndex);
        break;
      }
    }
    
    if (rowIndex === -1) {
      rowIndex = data.length + 1;
      console.log('Adding new session at row:', rowIndex);
    }
    
    // Update or insert session data
    const now = new Date();
    const rowData = [
      sessionId,
      value,
      'TRUE',  // Use string 'TRUE' which Google Sheets will convert to boolean true
      now.toISOString()
    ];
    console.log('Writing row data:', JSON.stringify(rowData));
    
    sheet.getRange(rowIndex, 1, 1, 4).setValues([rowData]);
    
    // Format the cells
    const range = sheet.getRange(rowIndex, 1, 1, 4);
    range.setWrap(true);
    range.setVerticalAlignment('top');
    
    // Format LastAccessed column
    sheet.getRange(rowIndex, 4).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
    // Verify the data was written correctly
    const verifyData = sheet.getRange(rowIndex, 1, 1, 4).getValues()[0];
    console.log('Verifying written data:', JSON.stringify(verifyData));
    
    // Check session ID and active status (which will be boolean true)
    if (verifyData[0] !== sessionId || verifyData[2] !== true) {
      console.error('Verification failed. Expected:', sessionId, 'true', 'Got:', verifyData[0], verifyData[2]);
      throw new Error('Session data verification failed');
    }
    
    console.log('Session stored successfully in both cache and sheet');
    return true;
  } catch (error) {
    console.error('Session storage error:', error.toString());
    console.error('Stack trace:', error.stack);
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
    // Try cache first
    const cache = CacheService.getUserCache();
    const key = CACHE_PREFIX + sessionId;
    const value = cache.get(key);
    
    if (value) {
      console.log('Session found in cache');
      return JSON.parse(value);
    }

    // If not in cache, check active sessions sheet
    console.log('Session not in cache, checking sheet');
    console.log('Opening spreadsheet:', CONFIG.SPREADSHEET_ID);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    if (!ss) {
      throw new Error('Failed to open spreadsheet');
    }
    
    const sheet = ss.getSheetByName('ActiveSessions');
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
          
          // Store back in cache
          storeSession(sessionId, userInfo);
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
 * Removes a session from cache and sheet.
 * @param {string} sessionId - Session to remove
 */
function removeSession(sessionId) {
  try {
    // Remove from cache
    const cache = CacheService.getUserCache();
    const key = CACHE_PREFIX + sessionId;
    cache.remove(key);
    
    // Remove from sheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ActiveSessions');
    
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
  console.log('Starting session validation for:', sessionId);
  
  if (!sessionId) {
    console.log('No session ID provided');
    return false;
  }

  try {
    // Try cache first
    const cache = CacheService.getUserCache();
    const key = CACHE_PREFIX + sessionId;
    const value = cache.get(key);
    
    if (value) {
      console.log('Session found in cache');
      return true;
    }

    console.log('Session not in cache, checking sheet');
    
    // Check sheet if not in cache
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ActiveSessions');
    
    if (!sheet) {
      console.log('ActiveSessions sheet not found');
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('Found', data.length - 1, 'sessions in sheet');
    console.log('Header row:', JSON.stringify(data[0]));
    
    // Log all sessions for debugging
    console.log('All sessions in sheet:');
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log(`Row ${i}:`, {
        id: row[0],
        active: row[2],
        activeType: typeof row[2],
        lastAccessed: row[3],
        matches: row[0] === sessionId
      });
    }
    
    // Look for our session
    console.log('Looking for session:', sessionId);
    let found = false;
    let foundRow = null;
    let foundIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === sessionId) {
        found = true;
        foundRow = row;
        foundIndex = i;
        break;
      }
    }
    
    if (found) {
      console.log('Found session at row', foundIndex + 1, ':', {
        id: foundRow[0],
        active: foundRow[2],
        activeType: typeof foundRow[2],
        lastAccessed: foundRow[3]
      });
      
      // Check if session is active (handle both boolean true and string 'TRUE')
      const isActive = foundRow[2] === true || foundRow[2] === 'TRUE';
      console.log('Is session active?', isActive);
      
      if (isActive) {
        console.log('Session is active');
        
        // Update LastAccessed timestamp
        const now = new Date().toISOString();
        console.log('Updating LastAccessed to:', now);
        sheet.getRange(foundIndex + 1, 4).setValue(now);
        
        // Refresh cache with user info
        const userInfo = JSON.parse(foundRow[1]);
        cache.put(key, JSON.stringify(userInfo), SESSION_DURATION);
        console.log('Session refreshed in cache');
        
        return true;
      } else {
        console.log('Session found but not active');
        return false;
      }
    }
    
    console.log('Session not found in sheet');
    return false;
  } catch (error) {
    console.error('Session validation error:', error.toString());
    console.error('Stack trace:', error.stack);
    return false;
  }
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
  
  try {
    if (!sessionId) {
      console.error('No session ID provided');
      return getWebAppUrlFromAuth('login');
    }

    console.log('Validating session:', sessionId);
    const isValid = validateSession(sessionId);
    console.log('Session validation result:', isValid);

    if (!isValid) {
      console.error('Invalid or expired session:', sessionId);
      return getWebAppUrlFromAuth('login');
    }

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
      
      // Get the current deployment URL
      const baseUrl = ScriptApp.getService().getUrl().split('?')[0];
      console.log('Using base URL:', baseUrl);
      
      // Add session ID and page parameters
      const dashboardUrl = `${baseUrl}?sessionId=${encodeURIComponent(sessionId)}&page=dashboard`;
      console.log('Generated dashboard URL with session ID');
      return dashboardUrl;
    } catch (urlError) {
      console.error('Error constructing dashboard URL:', urlError);
      throw urlError;
    }
  } catch (error) {
    console.error('Error in getDashboardUrl:', error);
    return getWebAppUrlFromAuth('login');
  }
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

    const cache = CacheService.getUserCache();
    const key = CACHE_PREFIX + sessionId;
    const value = cache.get(key);
    
    if (!value) {
      console.log('Session not found:', sessionId);
      return null;
    }

    const userInfo = JSON.parse(value);
    
    // Validate user info structure
    if (!userInfo.email || !userInfo.role) {
      console.error('Invalid user info structure:', userInfo);
      return null;
    }

    // Refresh session
    cache.put(key, JSON.stringify(userInfo), SESSION_DURATION);
    console.log('Session refreshed for user:', userInfo.email);

    return userInfo;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
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
  
  // Create template and set security headers using shared utility
  const template = HtmlService.createTemplateFromFile(page === 'dashboard' ? 'DashboardPage' : 'LoginPage');
  const output = template.evaluate()
    .setTitle('1PWR PR System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  
  // Apply security headers consistently with Code.gs
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.IFRAME);
  
  console.log(`${page} template evaluated successfully`);
  return output;
}
