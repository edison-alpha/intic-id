/**
 * Production-ready logging utility
 * Automatically disables debug logs in production environment
 */

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEBUG = import.meta.env.VITE_DEBUG === 'true';

/**
 * Debug log - only shows in development or when DEBUG=true
 */
export const debug = (...args: any[]) => {
  if (!IS_PRODUCTION || IS_DEBUG) {
    console.log(...args);
  }
};

/**
 * Info log - shows in all environments
 */
export const info = (...args: any[]) => {
  console.log(...args);
};

/**
 * Warning log - shows in all environments
 */
export const warn = (...args: any[]) => {
  console.warn(...args);
};

/**
 * Error log - shows in all environments
 */
export const error = (...args: any[]) => {
  console.error(...args);
};

/**
 * Performance timing utility
 */
export const time = (label: string) => {
  if (!IS_PRODUCTION || IS_DEBUG) {
    console.time(label);
  }
};

export const timeEnd = (label: string) => {
  if (!IS_PRODUCTION || IS_DEBUG) {
    console.timeEnd(label);
  }
};

// Export logger object
export const logger = {
  debug,
  info,
  warn,
  error,
  time,
  timeEnd,
};

export default logger;
