/*******************************************************************************************
 * File: Login.gs
 * Version: 1.0
 * Last Updated: 2023-12-08
 *
 * Description:
 *   Handles login functionality and user authentication for the PR system.
 *   Works in conjunction with auth.gs for session management.
 *
 * Dependencies:
 *   - auth.gs: Core authentication and session management
 *   - SharedUtils.gs: Utility functions
 ********************************************************************************************/

/**
 * Handles POST requests for secure redirects
 * @param {Object} e - Event object from form submission
 * @returns {HtmlOutput} Appropriate page based on session
 */
function doPost(e) {
  console.log('Processing POST request');
  
  try {
    const formData = e.parameter;
    const action = formData.action;

    if (action === 'login') {
      const result = authenticate(formData.username, formData.password);
      if (!result.success) {
        return createErrorPage('Authentication failed: ' + result.message);
      }
      
      const redirectUrl = getWebAppUrlFromAuth('dashboard');
      return HtmlService.createHtmlOutput(
        `<script>window.top.location.href = '${redirectUrl}';</script>`
      );
    }
    
    return createErrorPage('Invalid action specified');
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return createErrorPage('An error occurred: ' + error.toString());
  }
}

/**
 * Authenticates a user against the Requestor List
 * @param {string} username - The user's name
 * @param {string} password - The user's password
 * @return {Object} Authentication result with success flag and session info
 */
function authenticate(username, password) {
  console.log('Authenticating user:', username);
  
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

    // Create session using auth.gs
    const sessionResult = authenticateUser(username, password);
    if (!sessionResult.success) {
      return sessionResult;
    }

    logAuthEvent(username, true, 'Successful login');
    return sessionResult;

  } catch (error) {
    console.error('Authentication error:', error);
    logAuthEvent(username, false, 'Login error: ' + error.toString());
    return { success: false, message: 'Authentication error occurred' };
  }
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
