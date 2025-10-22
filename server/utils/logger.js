/**
 * Production-ready logging utility for Node.js backend
 * Automatically disables debug logs in production environment
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEBUG = process.env.DEBUG === 'true';

/**
 * Debug log - only shows in development or when DEBUG=true
 */
const debug = (...args) => {
  if (!IS_PRODUCTION || IS_DEBUG) {
    console.log(...args);
  }
};

/**
 * Info log - shows in all environments
 */
const info = (...args) => {
  console.log(...args);
};

/**
 * Warning log - shows in all environments
 */
const warn = (...args) => {
  console.warn(...args);
};

/**
 * Error log - shows in all environments
 */
const error = (...args) => {
  console.error(...args);
};

/**
 * Performance timing utility
 */
const time = (label) => {
  if (!IS_PRODUCTION || IS_DEBUG) {
    console.time(label);
  }
};

const timeEnd = (label) => {
  if (!IS_PRODUCTION || IS_DEBUG) {
    console.timeEnd(label);
  }
};

// Export logger
module.exports = {
  debug,
  info,
  warn,
  error,
  time,
  timeEnd,
};
