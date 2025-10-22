/**
 * Safe number formatting utilities
 * Menghindari error "Cannot read properties of undefined (reading 'toFixed')"
 */

/**
 * Safely format number with toFixed
 * Returns '0' or default value if input is invalid
 */
export function safeToFixed(
  value: number | string | null | undefined,
  decimals: number = 2,
  defaultValue: string = '0'
): string {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  // Convert to number
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  return num.toFixed(decimals);
}

/**
 * Format microSTX to STX with safe handling
 */
export function formatMicroSTX(
  microSTX: number | string | null | undefined,
  decimals: number = 2
): string {
  if (microSTX === null || microSTX === undefined || microSTX === '') {
    return '0';
  }

  const num = typeof microSTX === 'string' ? parseInt(microSTX) : microSTX;

  if (isNaN(num) || !isFinite(num)) {
    return '0';
  }

  const stx = num / 1000000;
  return safeToFixed(stx, decimals);
}

/**
 * Format price with removal of trailing zeros
 */
export function formatPrice(
  price: number | string | null | undefined,
  decimals: number = 6
): string {
  const formatted = safeToFixed(price, decimals, '0');
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Format percentage safely
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '0';
  }
  return value.toFixed(decimals);
}

/**
 * Calculate percentage safely
 */
export function calculatePercentage(
  part: number | null | undefined,
  total: number | null | undefined,
  decimals: number = 1
): string {
  if (!part || !total || total === 0) {
    return '0';
  }

  if (isNaN(part) || isNaN(total) || !isFinite(part) || !isFinite(total)) {
    return '0';
  }

  const percentage = (part / total) * 100;
  return safeToFixed(percentage, decimals);
}

/**
 * Format currency with USD symbol
 */
export function formatUSD(
  value: number | null | undefined,
  decimals: number = 2
): string {
  return `$${safeToFixed(value, decimals, '0.00')}`;
}

/**
 * Format STX with symbol
 */
export function formatSTX(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  return `${safeToFixed(value, decimals)} STX`;
}

/**
 * Format crypto price (BTC, sBTC, etc)
 */
export function formatCrypto(
  value: number | null | undefined,
  decimals: number = 8,
  symbol: string = 'BTC'
): string {
  return `${safeToFixed(value, decimals)} ${symbol}`;
}
