/*******************************************************************************************
 * File: DataLists.gs
 * Version: 1.0
 * Last Updated: 2023-12-08
 *
 * Description:
 *   Provides functions for retrieving various data lists used in the PR system,
 *   such as requestors, approvers, vendors, sites, etc.
 *
 * Dependencies:
 *   - SharedUtils.gs: Utility functions
 ********************************************************************************************/

/**
 * Gets the list of requestors from the Requestor List sheet
 * @return {Object} Object with success flag and either requestor list or error message
 */
function getRequestorList() {
  console.log('Getting requestor list');
  
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log('Opened spreadsheet:', ss.getName());
    
    const sheet = ss.getSheetByName('Requestor List');
    if (!sheet) {
      const error = 'Requestor List sheet not found';
      console.error(error);
      return {
        success: false,
        error: error
      };
    }
    console.log('Found Requestor List sheet');

    console.log('Getting data from sheet');
    const data = sheet.getDataRange().getValues();
    console.log(`Found ${data.length} rows (including header)`);
    
    if (data.length < 2) {
      const error = 'No requestors found in sheet';
      console.error(error);
      return {
        success: false,
        error: error
      };
    }

    // Log header row to verify column structure
    console.log('Header row:', data[0]);

    // Skip header row and filter active requestors
    const requestors = data.slice(1)
      .filter(row => {
        const isActive = row[3] === 'Y';  // Filter by Active column (index 3)
        console.log(`Row ${row[0]}: Active=${row[3]}, isActive=${isActive}`);
        return isActive;
      })
      .map(row => ({
        name: row[0],      // Name
        email: row[1],     // Email
        department: row[2], // Department
        role: row[5]       // Role is in column F (index 5)
      }));

    console.log(`Found ${requestors.length} active requestors`);
    if (requestors.length > 0) {
      console.log('First requestor:', JSON.stringify(requestors[0]));
    } else {
      console.log('No active requestors found');
    }
    
    return {
      success: true,
      requestors: requestors
    };
    
  } catch (error) {
    console.error('Error getting requestor list:', error);
    return {
      success: false,
      error: 'Failed to load requestor list: ' + error.toString()
    };
  }
}

/**
 * Gets the list of active approvers
 * @returns {Array} Array of approver objects
 */
function getActiveApprovers() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Approver List');
    if (!sheet) {
      throw new Error('Approver List sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    return data.slice(1)  // Skip header row
      .filter(row => row[5] === 'Y')  // Only active approvers
      .map(row => ({
        name: row[0],
        email: row[1],
        department: row[2],
        role: row[3],
        approvalLimit: row[4]
      }));

  } catch (error) {
    console.error('Error getting approvers:', error);
    throw new Error('Failed to load approver list');
  }
}

/**
 * Gets the list of project categories
 * @returns {Array} Array of category objects
 */
function getProjectCategories() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Project Categories');
    if (!sheet) {
      throw new Error('Project Categories sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    return data.slice(1)  // Skip header row
      .filter(row => row[2] === 'Y')  // Only active categories
      .map(row => ({
        code: row[0],
        name: row[1]
      }));

  } catch (error) {
    console.error('Error getting project categories:', error);
    throw new Error('Failed to load project categories');
  }
}

/**
 * Gets the list of active sites
 * @returns {Array} Array of site objects
 */
function getActiveSites() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Site List');
    if (!sheet) {
      throw new Error('Site List sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    return data.slice(1)  // Skip header row
      .filter(row => row[2] === 'Y')  // Only active sites
      .map(row => ({
        code: row[0],
        name: row[1]
      }));

  } catch (error) {
    console.error('Error getting sites:', error);
    throw new Error('Failed to load site list');
  }
}

/**
 * Gets the list of expense types
 * @returns {Array} Array of expense type objects
 */
function getExpenseTypes() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Expense Type');
    if (!sheet) {
      throw new Error('Expense Type sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    return data.slice(1)  // Skip header row
      .filter(row => row[2] === 'Y')  // Only active expense types
      .map(row => ({
        code: row[0],
        name: row[1]
      }));

  } catch (error) {
    console.error('Error getting expense types:', error);
    throw new Error('Failed to load expense types');
  }
}

/**
 * Gets the list of approved vendors
 * @returns {Array} Array of vendor objects
 */
function getApprovedVendors() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Vendor List');
    if (!sheet) {
      throw new Error('Vendor List sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    return data.slice(1)  // Skip header row
      .filter(row => row[3] === 'Y')  // Only approved vendors
      .map(row => ({
        name: row[0],
        category: row[1],
        rating: row[2]
      }));

  } catch (error) {
    console.error('Error getting vendors:', error);
    throw new Error('Failed to load vendor list');
  }
}

/**
 * Gets the list of active vehicles
 * @returns {Array} Array of vehicle objects
 */
function getActiveVehicles() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName('Vehicle List');
    if (!sheet) {
      throw new Error('Vehicle List sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    return data.slice(1)  // Skip header row
      .filter(row => row[2] === 'Y')  // Only active vehicles
      .map(row => ({
        name: row[0],
        registration: row[1]
      }));

  } catch (error) {
    console.error('Error getting vehicles:', error);
    throw new Error('Failed to load vehicle list');
  }
}
