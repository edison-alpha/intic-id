const axios = require('axios');

/**
 * Make a request to Hiro API with retry logic and rate limit handling
 * @param {string} url - The full URL to request
 * @param {object} options - Axios options (method, headers, data, etc.)
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @returns {Promise} - Axios response
 */
async function makeHiroRequest(url, options = {}, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios({
        url,
        timeout: 10000,
        ...options
      });
      
      return response;
      
    } catch (error) {
      lastError = error;
      
      // Handle rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '5');
        
        if (attempt < maxRetries) {
          console.warn(`⚠️  Rate limited by Hiro API. Retrying after ${retryAfter}s (attempt ${attempt + 1}/${maxRetries})`);
          await sleep(retryAfter * 1000);
          continue;
        } else {
          console.error('❌ Rate limit exceeded, no more retries');
          throw error;
        }
      }
      
      // Handle 5xx server errors - retry
      if (error.response?.status >= 500 && attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
        console.warn(`⚠️  Server error ${error.response.status}. Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(backoffMs);
        continue;
      }
      
      // Don't retry on 4xx errors (except 429)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Network errors - retry with backoff
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.warn(`⚠️  Network error: ${error.message}. Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(backoffMs);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a debounced function that batches multiple calls
 */
function createBatchedRequest(batchWindow = 100) {
  const pending = new Map();
  let timeoutId = null;
  
  return async function(key, requestFn) {
    // If already pending, return the existing promise
    if (pending.has(key)) {
      return pending.get(key);
    }
    
    // Create new promise
    const promise = new Promise((resolve, reject) => {
      pending.set(key, { resolve, reject, requestFn });
    });
    
    // Schedule batch execution
    if (!timeoutId) {
      timeoutId = setTimeout(async () => {
        timeoutId = null;
        const batch = Array.from(pending.entries());
        pending.clear();
        
        // Execute all requests
        for (const [key, { resolve, reject, requestFn }] of batch) {
          try {
            const result = await requestFn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      }, batchWindow);
    }
    
    return promise;
  };
}

module.exports = {
  makeHiroRequest,
  sleep,
  createBatchedRequest
};
