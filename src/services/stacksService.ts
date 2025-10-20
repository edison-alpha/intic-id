/**
 * Stacks Blockchain Service
 * Utility functions for interacting with Stacks blockchain
 */

// Hiro API Base URL
const HIRO_API_BASE = 'https://api.testnet.hiro.so'; // Change to mainnet for production

/**
 * Get STX balance for a Stacks address
 * @param address - Stacks address (e.g., ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX)
 * @returns Balance in STX (with decimals)
 */
export async function getSTXBalance(address: string): Promise<number> {
  try {
    
    // Fetch account balance from Hiro API
    const response = await fetch(
      `${HIRO_API_BASE}/extended/v1/address/${address}/balances`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const accountInfo = await response.json();
    
    // Convert microSTX to STX (1 STX = 1,000,000 microSTX)
    const microSTX = parseInt(accountInfo.stx.balance);
    const stx = microSTX / 1000000;
    
    console.log('✅ STX Balance fetched:', {
      address: address.substring(0, 10) + '...',
      microSTX,
      stx: stx.toFixed(6),
    });
    
    return stx;
  } catch (error) {
    console.error('❌ Failed to get STX balance:', error);
    throw new Error('Failed to fetch STX balance');
  }
}

/**
 * Check if user has enough STX for a transaction
 * @param address - User's Stacks address
 * @param requiredAmount - Amount needed in STX (e.g., 0.1 for ticket price)
 * @param includeGasFee - Add gas fee buffer (default: true)
 * @returns Object with balance check results
 */
export async function hasEnoughSTX(
  address: string,
  requiredAmount: number,
  includeGasFee: boolean = true
): Promise<{ 
  sufficient: boolean; 
  balance: number; 
  required: number;
  shortfall?: number;
}> {
  try {
    const balance = await getSTXBalance(address);
    
    // Add gas fee buffer (estimated ~0.05 STX for typical transactions)
    const gasFeeBuffer = includeGasFee ? 0.05 : 0;
    const totalRequired = requiredAmount + gasFeeBuffer;
    
    const sufficient = balance >= totalRequired;
    const shortfall = sufficient ? 0 : totalRequired - balance;
    
    console.log('💳 Balance check:', {
      balance: balance.toFixed(6),
      required: totalRequired.toFixed(6),
      gasFee: gasFeeBuffer.toFixed(6),
      sufficient: sufficient ? '✅' : '❌',
      shortfall: shortfall > 0 ? shortfall.toFixed(6) : '0',
    });
    
    return {
      sufficient,
      balance,
      required: totalRequired,
      shortfall: shortfall > 0 ? shortfall : undefined,
    };
  } catch (error) {
    console.error('❌ Balance check failed:', error);
    throw error;
  }
}

/**
 * Format STX amount with proper decimals
 * @param microSTX - Amount in microSTX
 * @returns Formatted STX string (e.g., "0.100000")
 */
export function formatSTX(microSTX: number): string {
  const stx = microSTX / 1000000;
  return stx.toFixed(6);
}

/**
 * Convert STX to microSTX
 * @param stx - Amount in STX (e.g., 0.1)
 * @returns Amount in microSTX (e.g., 100000)
 */
export function stxToMicroSTX(stx: number): number {
  return Math.floor(stx * 1000000);
}

/**
 * Convert microSTX to STX
 * @param microSTX - Amount in microSTX (e.g., 100000)
 * @returns Amount in STX (e.g., 0.1)
 */
export function microSTXToSTX(microSTX: number): number {
  return microSTX / 1000000;
}
