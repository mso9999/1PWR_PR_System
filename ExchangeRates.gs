/*******************************************************************************************
 * File: ExchangeRates.gs
 * Version: 1.0
 * Last Updated: 2023-12-08
 *
 * Description:
 *   Handles currency conversion and exchange rate management.
 *   Caches exchange rates to minimize API calls.
 *
 * Dependencies:
 *   - SharedUtils.gs: Utility functions
 ********************************************************************************************/

// Cache duration for exchange rates (4 hours in seconds)
const EXCHANGE_RATE_CACHE_DURATION = 14400;

/**
 * Gets current exchange rates from API
 * @returns {Object} Exchange rates with LSL as base
 */
function getCurrentExchangeRates() {
  const cache = CacheService.getScriptCache();
  const cachedRates = cache.get('exchange_rates');
  
  if (cachedRates) {
    return JSON.parse(cachedRates);
  }
  
  try {
    // Note: Replace with actual API call when available
    // For now, using static rates
    const rates = {
      LSL: 1.0,
      USD: 0.053,
      EUR: 0.049,
      GBP: 0.042,
      ZAR: 1.0
    };
    
    cache.put('exchange_rates', JSON.stringify(rates), EXCHANGE_RATE_CACHE_DURATION);
    return rates;
    
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw new Error('Failed to get exchange rates');
  }
}

/**
 * Converts amount to LSL using current exchange rates
 * @param {number} amount - The amount to convert
 * @param {string} currency - The currency code
 * @returns {number} Amount in LSL
 */
function convertToLSL(amount, currency) {
  if (!amount || !currency) {
    return 0;
  }
  
  try {
    const rates = getCurrentExchangeRates();
    if (!rates[currency]) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    
    return amount / rates[currency];
    
  } catch (error) {
    console.error('Error converting currency:', error);
    throw new Error('Failed to convert currency');
  }
}

/**
 * Test function to verify exchange rate functionality
 */
function testExchangeRates() {
  try {
    const rates = getCurrentExchangeRates();
    console.log('Current rates:', rates);
    
    const testAmount = 100;
    const currencies = ['USD', 'EUR', 'GBP', 'ZAR'];
    
    currencies.forEach(currency => {
      const lsl = convertToLSL(testAmount, currency);
      console.log(`${testAmount} ${currency} = ${lsl.toFixed(2)} LSL`);
    });
    
  } catch (error) {
    console.error('Exchange rate test failed:', error);
  }
}
