/*******************************************************************************************
 * File: auth.gs
 * Version: 1.8.2
 * Last Updated: 2024-12-08
 *
 * Description:
 *   Handles user authentication, session management, and security for the PR system.
 *   Implements secure session storage using Google Apps Script Cache Service and Spreadsheet.
 *
 * Changes in 1.8.2:
 *   - Improved session handling with better logging and defensive programming
 *
 * Changes in 1.8.1:
 *   - Added blue dot and version marker to log messages
 *
 * Changes in 1.8.0:
 *   - Added version tracking and improved session comparison logic
 *   - Updated session storage to persist sessions in both cache and sheet
 *   - Fixed X-Frame-Options issue to allow iframe embedding
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

const AUTH_VERSION = '1.8.2'; // Version tracking
const SESSION_DURATION = 21600; // 6 hours in seconds
const CACHE_PREFIX = '1pwr_session_';

/**
 * Authenticates a user against the Requestor List.
 * @param {string} username - The username to authenticate
 * @param {string} password - The password to verify
 * @return {Object} Authentication result with session info
 */
function authenticateUser(username, password) {
  console.log('[AUTH] Starting authentication for user:', username);
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Requestor List');
    if (!sheet) {
      console.error('[AUTH] Requestor List sheet not found');
      return { success: false, message: 'Authentication system unavailable' };
    }

    const data = sheet.getDataRange().getValues();
    console.log('[AUTH] Found', data.length, 'rows in Requestor List');
    console.log('[AUTH] Header row:', data[0]);
    
    // Find user row where:
    // Column A (index 0) = Name
    // Column E (index 4) = Password
    // Column D (index 3) = Active status ('Y')
    const userRow = data.find(row => {
      const nameMatch = row[0].toString().toLowerCase() === username.toLowerCase();
      const passwordMatch = row[4] === password;
      const isActive = row[3] === 'Y';
      
      console.log('[AUTH] Checking row: name=${nameMatch}, password=${passwordMatch}, active=${isActive}');
      return nameMatch && passwordMatch && isActive;
    });

    if (!userRow) {
      console.log('[AUTH] Authentication failed for user:', username);
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
      console.error('[AUTH] Failed to store session');
      return { success: false, message: 'Session creation failed' };
    }

    console.log('[AUTH] Authentication successful for user:', username);
    return {
      success: true,
      sessionId: sessionId,
      user: userInfo
    };
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    return { success: false, message: 'Authentication system error' };
  }
}

/**
 * Stores a user session in both cache and sheet.
 * @param {string} sessionId - Unique session identifier
 * @param {Object} userInfo - User information to store
 * @return {boolean} Success status
 */
function storeSession(sessionId, userInfo) {
  console.log('[AUTH][v1.8.2] Storing session:', sessionId);
  
  try {
    // First store in cache for quick access
    const cache = CacheService.getUserCache();
    const cacheKey = CACHE_PREFIX + sessionId;
    cache.put(cacheKey, JSON.stringify(userInfo), SESSION_DURATION);
    console.log('[AUTH] Session stored in cache with key:', cacheKey);
    
    // Then store in spreadsheet for persistence
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log('[AUTH] Opening spreadsheet:', CONFIG.SPREADSHEET_ID);
    
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVE_SESSIONS);
    if (!sheet) {
      console.error('[AUTH] Active sessions sheet not found');
      return false;
    }
    
    // Get current data
    const data = sheet.getDataRange().getValues();
    console.log('[AUTH] Found', data.length - 1, 'existing sessions');
    
    // Clear any existing sessions for this user
    let foundExisting = false;
    let updatedRow = -1;
    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];
        const existingInfo = JSON.parse(row[1]);
        console.log('[AUTH] Checking row', i + 1, 'email:', existingInfo.email);
        if (existingInfo.email === userInfo.email) {
          console.log('[AUTH] Found existing session at row:', i + 1);
          // Deactivate old session
          sheet.getRange(i + 1, 3).setValue(false);
          SpreadsheetApp.flush();
          console.log('[AUTH] Deactivated old session');
          updatedRow = i;
          foundExisting = true;
        }
      } catch (e) {
        console.error('[AUTH] Error checking row', i + 1, ':', e);
      }
    }
    
    // Always add as new row
    const nextRow = data.length + 1;
    console.log('[AUTH] Adding new session at row:', nextRow);
    
    const timestamp = new Date().toISOString();
    const rowData = [
      sessionId,
      JSON.stringify(userInfo),
      true,
      timestamp
    ];
    console.log('[AUTH] Writing new session data');
    
    sheet.getRange(nextRow, 1, 1, 4).setValues([rowData]);
    SpreadsheetApp.flush();
    
    // Verify the write
    const verifyData = sheet.getRange(nextRow, 1, 1, 4).getValues()[0];
    console.log('[AUTH] Verifying written data:', JSON.stringify({
      sessionId: verifyData[0],
      active: verifyData[2],
      timestamp: verifyData[3]
    }));
    
    if (verifyData[0] !== sessionId || verifyData[2] !== true) {
      console.error('[AUTH] Session verification failed');
      return false;
    }
    
    console.log('[AUTH] Session stored and verified');
    return true;
    
  } catch (error) {
    console.error('[AUTH] Error storing session:', error);
    return false;
  }
}

/**
 * Retrieves user information from a session.
 * @param {string} sessionId - Session to retrieve
 * @return {Object|null} User information or null if invalid
 */
function getUserFromSession(sessionId) {
  console.log('[AUTH] Getting user from session:', sessionId);
  
  try {
    // If not in cache, check active sessions sheet
    console.log('[AUTH] Session not in cache, checking sheet');
    console.log('[AUTH] Opening spreadsheet:', CONFIG.SPREADSHEET_ID);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    if (!ss) {
      throw new Error('Failed to open spreadsheet');
    }
    
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVE_SESSIONS);
    if (!sheet) {
      console.log('[AUTH] ActiveSessions sheet not found');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('[AUTH] Found', data.length - 1, 'sessions in sheet');
    
    // Log the header row to verify column order
    console.log('[AUTH] Header row:', data[0]);
    
    for (let i = 1; i < data.length; i++) {
      // Log the raw session data for debugging
      console.log('[AUTH] Row', i, 'data:', JSON.stringify(data[i]));
      
      if (data[i][0] === sessionId) {
        console.log('[AUTH] Found matching session ID. Active status:', data[i][2]);
        
        // Check if session is active (true or TRUE)
        const isActive = data[i][2] === true || data[i][2] === 'TRUE';
        
        if (isActive) {
          console.log('[AUTH] Session is active');
          const userInfo = JSON.parse(data[i][1]); // User info is in column B
          
          return userInfo;
        } else {
          console.log('[AUTH] Session found but not active');
        }
      }
    }

    console.log('[AUTH] Session not found in sheet or inactive');
    return null;
  } catch (error) {
    console.error('[AUTH] Session retrieval error:', error.toString());
    console.error('[AUTH] Stack trace:', error.stack);
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
    
    console.log('[AUTH] Session removed:', sessionId);
  } catch (error) {
    console.error('[AUTH] Session removal error:', error.toString());
    console.error('[AUTH] Stack trace:', error.stack);
  }
}

/**
 * Validates a session and refreshes its expiration.
 * @param {string} sessionId - Session to validate
 * @return {Object|null} User information or null if invalid
 */
function validateSession(sessionId) {
  console.log('[AUTH][v1.8.2] Validating session:', sessionId);
  
  if (!sessionId) {
    console.log('[AUTH] No session ID provided');
    return null;
  }
  
  try {
    // First check cache
    const cache = CacheService.getUserCache();
    const cacheKey = CACHE_PREFIX + sessionId;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log('[AUTH] Session found in cache');
      const userInfo = JSON.parse(cachedData);
      console.log('[AUTH] Cache hit for user:', userInfo.email);
      return userInfo;
    }
    
    console.log('[AUTH] Cache miss, checking sheet');
    
    // Check spreadsheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVE_SESSIONS);
    
    // Force a refresh
    SpreadsheetApp.flush();
    
    const data = sheet.getDataRange().getValues();
    console.log('[AUTH] Checking', data.length - 1, 'rows for session');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log('[AUTH] Row', i + 1, 'check:', JSON.stringify({
        id: row[0],
        active: row[2],
        match: row[0] === sessionId
      }));
      
      if (row[0] === sessionId && row[2] === true) {
        console.log('[AUTH] Found active session in row:', i + 1);
        try {
          const userInfo = JSON.parse(row[1]);
          console.log('[AUTH] Session belongs to:', userInfo.email);
          
          // Update cache and last accessed
          cache.put(cacheKey, row[1], SESSION_DURATION);
          sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
          SpreadsheetApp.flush();
          console.log('[AUTH] Updated cache and last accessed time');
          
          return userInfo;
        } catch (e) {
          console.error('[AUTH] Error parsing user info:', e);
          return null;
        }
      }
    }
    
    console.log('[AUTH] Session not found in sheet');
    return null;
    
  } catch (error) {
    console.error('[AUTH] Error validating session:', error);
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
  console.log('[AUTH] Event parameters:', JSON.stringify(e.parameter));
  
  // Get session ID from URL parameters
  const sessionId = e.parameter.sessionId;
  console.log('[AUTH] Session ID from URL:', sessionId);
  
  // Create template and set security headers
  const template = HtmlService.createTemplateFromFile(page === 'dashboard' ? 'DashboardPage' : 'LoginPage');
  const output = template.evaluate()
    .setTitle('1PWR PR System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  
  console.log('[AUTH] ' + page + ' template evaluated successfully');
  return output;
}

/**
 * Gets the web app URL with enhanced error handling and logging
 * @param {string} page - Optional page parameter
 * @return {string} Web app URL
 */
function getWebAppUrl(page) {
  console.log('[AUTH] Getting web app URL for page:', page);
  
  try {
    // Get the deployment ID from the current deployment
    let deploymentId;
    try {
      const service = ScriptApp.getService();
      const currentUrl = service.getUrl();
      deploymentId = currentUrl.match(/\/macros\/[^/]+\/([^/]+)/)?.[1];
    } catch (e) {
      console.warn('[AUTH] Could not get deployment ID from service:', e);
      // Fallback to script ID
      deploymentId = ScriptApp.getScriptId();
    }
    
    if (!deploymentId) {
      throw new Error('Failed to get deployment/script ID');
    }
    
    // Construct base URL with deployment ID
    const baseUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
    console.log('[AUTH] Using base URL:', baseUrl);
    
    // Add page parameter
    const fullUrl = `${baseUrl}?page=${encodeURIComponent(page)}`;
    console.log('[AUTH] Generated full URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('[AUTH] Error getting web app URL:', error);
    throw error; // Let the caller handle the error
  }
}

/**
 * Gets the web app URL with enhanced error handling and logging
 * @param {string} page - Optional page parameter
 * @return {string} Web app URL
 */
function getWebAppUrlFromAuth(page = 'dashboard') {
  console.log('[AUTH] Getting web app URL for page:', page);
  
  try {
    // Get the deployment ID from the current deployment
    let deploymentId;
    try {
      const service = ScriptApp.getService();
      const currentUrl = service.getUrl();
      deploymentId = currentUrl.match(/\/macros\/[^/]+\/([^/]+)/)?.[1];
    } catch (e) {
      console.warn('[AUTH] Could not get deployment ID from service:', e);
      // Fallback to script ID
      deploymentId = ScriptApp.getScriptId();
    }
    
    if (!deploymentId) {
      throw new Error('Failed to get deployment/script ID');
    }
    
    // Construct base URL with deployment ID
    const baseUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
    console.log('[AUTH] Using base URL:', baseUrl);
    
    // Add page parameter
    const fullUrl = `${baseUrl}?page=${encodeURIComponent(page)}`;
    console.log('[AUTH] Generated full URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('[AUTH] Error in getWebAppUrlFromAuth:', error);
    throw error;
  }
}

/**
 * Gets the dashboard URL with session ID
 * @param {string} sessionId - Session ID to include in URL
 * @return {string} Dashboard URL with session ID
 */
function getDashboardUrl(sessionId) {
  console.log('[AUTH] Getting dashboard URL for session:', sessionId);
  
  const userInfo = validateSession(sessionId);
  console.log('[AUTH] Session validation result:', userInfo);
  
  if (!userInfo) {
    console.error('[AUTH] Invalid or expired session:', sessionId);
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
  console.log('[AUTH] Getting current user for session:', sessionId);
  
  try {
    if (!sessionId) {
      console.log('[AUTH] No session ID provided');
      return null;
    }

    const userInfo = getUserFromSession(sessionId);
    
    // Validate user info structure
    if (!userInfo || !userInfo.email || !userInfo.role) {
      console.error('[AUTH] Invalid user info structure:', userInfo);
      return null;
    }

    return userInfo;
  } catch (error) {
    console.error('[AUTH] Error getting current user:', error);
    return null;
  }
}
