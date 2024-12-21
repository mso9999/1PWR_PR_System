/*******************************************************************************************
 * File: PRForm.gs
 * Version: 1.0
 * Last Updated: 2023-12-08
 *
 * Description:
 *   Handles PR form submission, validation, and processing.
 *   Manages form data and interactions with the Master Log sheet.
 *
 * Dependencies:
 *   - SharedUtils.gs: Utility functions
 *   - PRNumbering.gs: PR number management
 *   - ExchangeRates.gs: Currency conversion
 *   - NotificationSystem.gs: Email notifications
 ********************************************************************************************/

/**
 * Processes the form data submitted by the user
 * @param {Object} formData - The form data
 * @returns {Object} Processing result with status and message
 */
function processForm(formData) {
  console.log('Processing form submission');
  
  try {
    // Validate session
    const sessionId = formData.sessionId;
    const user = getCurrentUserFromAuth(sessionId);
    if (!user) {
      throw new Error('Invalid session');
    }
    
    // Validate form data
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors
      };
    }
    
    // Get PR number
    const prNumber = getReservedPRNumber();
    
    // Prepare row data
    const rowData = prepareRowData(formData, prNumber);
    
    // Insert into Master Log
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Master Log');
    sheet.appendRow(rowData);
    
    // Record PR number
    recordPRNumber(prNumber);
    
    // Send notifications
    sendSubmissionNotification({
      prNumber: prNumber,
      user: user,
      formData: formData
    });
    
    // Log submission
    logSubmission(prNumber, user, formData);
    
    return {
      success: true,
      prNumber: prNumber
    };
    
  } catch (error) {
    console.error('Form processing error:', error);
    logProcessingError(error, formData);
    return {
      success: false,
      error: 'Form submission failed: ' + error.toString()
    };
  }
}

/**
 * Validates form data before submission
 * @param {Object} data - The form data to validate
 * @returns {Array} Array of validation errors (empty if valid)
 */
function validateFormData(data) {
  const errors = [];
  
  // Basic info
  if (!data.requestor || !data.email || !data.department) {
    errors.push('Missing required requestor information');
  }
  
  // Project details
  if (!data.projectCategory || !data.description) {
    errors.push('Missing required project details');
  }
  
  // Location and type
  if (!data.site || !data.expenseType) {
    errors.push('Missing required location or expense type');
  }
  
  // Vehicle details if required
  if (isVehicleRequired(data) && !data.vehicle) {
    errors.push('Vehicle information required for this expense type');
  }
  
  // Budget and timeline
  if (!data.estimatedAmount || !data.currency || !data.requiredDate) {
    errors.push('Missing required budget or timeline information');
  }
  
  // Line items
  if (!data.lineItems || data.lineItems.length === 0) {
    errors.push('At least one line item is required');
  }
  
  return errors;
}

/**
 * Prepares row data for spreadsheet insertion
 * @param {Object} formData - The form data
 * @param {string} prNumber - The PR number
 * @returns {Array} Array of values for spreadsheet row
 */
function prepareRowData(formData, prNumber) {
  const now = new Date();
  const amountLSL = convertToLSL(formData.estimatedAmount, formData.currency);
  const isApprovedVendor = checkApprovedVendor(formData.vendor);
  
  return [
    prNumber,                    // PR Number
    now,                         // Timestamp
    formData.email,             // Email
    formData.requestor,         // Requestor
    formData.department,        // Department
    formData.projectCategory,   // Project Category
    formData.description,       // Description
    formData.site,             // Site
    formData.expenseType,      // Expense Type
    formData.vehicle || '',     // Vehicle
    formData.estimatedAmount,   // Estimated Amount
    formData.currency,         // Currency
    amountLSL,                 // Amount (LSL)
    formData.requiredDate,     // Required Date
    formData.vendor || '',     // Vendor
    calculateQuotesRequired(amountLSL, isApprovedVendor),  // Quotes Required
    calculateAdjRequired(amountLSL),  // Adjudication Required
    'Submitted',               // Status
    calculateDaysOpen(now),    // Days Open
    formatLineItemsForStorage(formData.lineItems)  // Line Items
  ];
}

/**
 * Gets initial form data with session validation
 * @param {string} sessionId - Session ID
 * @returns {Object} Form initialization data
 */
function getFormInitialData(sessionId) {
  try {
    const user = getCurrentUserFromAuth(sessionId);
    if (!user) {
      throw new Error('Invalid session');
    }
    
    return {
      success: true,
      data: {
        prNumber: getPRNumber(),
        user: user,
        requestors: getRequestorList(),
        approvers: getActiveApprovers(),
        sites: getActiveSites(),
        expenseTypes: getExpenseTypes(),
        vendors: getApprovedVendors(),
        vehicles: getActiveVehicles(),
        projectCategories: getProjectCategories()
      }
    };
    
  } catch (error) {
    console.error('Error getting form data:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Formats line items for storage in spreadsheet
 * @param {Array} lineItems - Array of line items
 * @returns {string} Formatted line items string
 */
function formatLineItemsForStorage(lineItems) {
  if (!lineItems || lineItems.length === 0) {
    return '';
  }
  
  return lineItems.map(item => 
    `${item.description}|${item.quantity}|${item.unitPrice}|${item.currency}`
  ).join(';');
}

/**
 * Parses line items from storage format
 * @param {string} data - Stored line items string
 * @returns {Array} Array of line item objects
 */
function parseLineItems(data) {
  if (!data) {
    return [];
  }
  
  return data.split(';').map(item => {
    const [description, quantity, unitPrice, currency] = item.split('|');
    return {
      description: description,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      currency: currency
    };
  });
}

/**
 * Logs form submission
 * @param {string} prNumber - PR number
 * @param {Object} user - User who submitted
 * @param {Object} formData - Form data
 */
function logSubmission(prNumber, user, formData) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Submission Log');
    if (!sheet) {
      console.warn('Submission Log sheet not found');
      return;
    }
    
    sheet.appendRow([
      new Date(),
      prNumber,
      user.email,
      JSON.stringify(formData)
    ]);
    
  } catch (error) {
    console.error('Error logging submission:', error);
  }
}

/**
 * Logs processing errors
 * @param {Error} error - The error object
 * @param {Object} formData - The form data that caused the error
 */
function logProcessingError(error, formData) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Error Log');
    if (!sheet) {
      console.warn('Error Log sheet not found');
      return;
    }
    
    sheet.appendRow([
      new Date(),
      error.toString(),
      error.stack,
      JSON.stringify(formData)
    ]);
    
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
}
