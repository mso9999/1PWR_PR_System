/*******************************************************************************************
 * File: auth.gs
 * Version: 1.4
 * Last Updated: 2023-12-08
 *
 * Description:
 *   Handles user authentication, session management, and security for the PR system.
 *   Implements secure session storage using Google Apps Script Cache Service.
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
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
                               .getSheetByName('Requestor List');
    if (!sheet) {
      console.error('Requestor List sheet not found');
      return { success: false, message: 'Authentication system unavailable' };
    }

    const data = sheet.getDataRange().getValues();
    const userRow = data.find(row => 
      row[0].toString().toLowerCase() === username.toLowerCase() && 
      row[4] === password && 
      row[5] === 'Y'
    );

    if (!userRow) {
      console.log('Authentication failed for user:', username);
      return { success: false, message: 'Invalid credentials or inactive user' };
    }

    // Create session
    const sessionId = Utilities.getUuid();
    const userInfo = {
      name: userRow[0],
      email: userRow[1],
      department: userRow[2],
      role: userRow[3],
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
 * Stores a user session in cache.
 * @param {string} sessionId - Unique session identifier
 * @param {Object} userInfo - User information to store
 * @return {boolean} Success status
 */
function storeSession(sessionId, userInfo) {
  try {
    const cache = CacheService.getUserCache();
    const key = CACHE_PREFIX + sessionId;
    const value = JSON.stringify(userInfo);
    
    cache.put(key, value, SESSION_DURATION);
    return true;
  } catch (error) {
    console.error('Session storage error:', error);
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
    const cache = CacheService.getUserCache();
    const key = CACHE_PREFIX + sessionId;
    const value = cache.get(key);
    
    if (!value) {
      console.log('Session not found:', sessionId);
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

/**
 * Removes a session from cache.
 * @param {string} sessionId - Session to remove
 */
function removeSession(sessionId) {
  try {
    const cache = CacheService.getUserCache();
    const key = CACHE_PREFIX + sessionId;
    cache.remove(key);
    console.log('Session removed:', sessionId);
  } catch (error) {
    console.error('Session removal error:', error);
  }
}

/**
 * Validates a session and refreshes its expiration.
 * @param {string} sessionId - Session to validate
 * @return {boolean} Validity status
 */
function validateSession(sessionId) {
  const userInfo = getUserFromSession(sessionId);
  if (!userInfo) {
    return false;
  }

  // Refresh session
  storeSession(sessionId, userInfo);
  return true;
}

/**
 * Gets the web app URL with enhanced error handling and logging
 * @param {string} page - Optional page parameter
 * @return {string} Web app URL
 */
function getWebAppUrl(page) {
  console.log('Getting web app URL for page:', page);
  
  try {
    const baseUrl = ScriptApp.getService().getUrl();
    console.log('Base URL:', baseUrl);
    
    if (!baseUrl) {
      throw new Error('Failed to get base URL');
    }

    if (page) {
      const fullUrl = `${baseUrl}?page=${encodeURIComponent(page)}`;
      console.log('Generated full URL:', fullUrl);
      return fullUrl;
    }
    
    console.log('Returning base URL');
    return baseUrl;
  } catch (error) {
    console.error('Error getting web app URL:', error);
    throw error;
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
 * Gets the web app URL with enhanced error handling and logging
 * @param {string} page - Optional page parameter
 * @return {string} Web app URL
 */
function getWebAppUrlFromAuth(page = 'dashboard') {
  console.log('Getting web app URL for page:', page);
  
  try {
    // Get the deployment ID from the current web app
    const webAppUrl = ScriptApp.getService().getUrl();
    const deploymentId = webAppUrl.match(/\/exec([^?#]*)/)?.[1] || '';
    
    // Construct the proper web app URL
    const baseUrl = `https://script.google.com/macros/s/${ScriptApp.getScriptId()}/exec${deploymentId}`;
    console.log('Base URL:', baseUrl);
    
    const fullUrl = `${baseUrl}?page=${encodeURIComponent(page)}`;
    console.log('Generated full URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('Error getting web app URL:', error);
    throw error;
  }
}
