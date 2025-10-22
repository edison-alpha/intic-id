/**
 * Hiro Indexer Service (Updated to use Express Server)
 * Uses Express Server to cache and optimize Hiro API calls
 */

const SERVER_BASE = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8000';

const getServerHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

// Contract Information
export interface ContractInfo {
  tx_id: string;
  canonical: boolean;
  contract_id: string;
  block_height: number;
  source_code: string;
  abi: string;
}

export interface TransactionStatus {
  tx_id: string;
  tx_status: 'success' | 'abort_by_response' | 'abort_by_post_condition' | 'pending';
  tx_result: {
    hex: string;
    repr: string;
  };
  tx_type: string;
  fee_rate: string;
  sender_address: string;
  sponsored: boolean;
  post_condition_mode: string;
  block_hash: string;
  block_height: number;
  burn_block_time: number;
  burn_block_time_iso: string;
  canonical: boolean;
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_signature: string;
  };
  events: any[];
}

export interface ContractEvent {
  event_index: number;
  event_type: string;
  tx_id: string;
  contract_log?: {
    contract_id: string;
    topic: string;
    value: {
      hex: string;
      repr: string;
    };
  };
  stx_transfer_event?: any;
  ft_transfer_event?: any;
  nft_transfer_event?: any;
}

export interface ContractTransaction {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  sender_address: string;
  fee_rate: string;
  nonce: number;
  block_height: number;
  burn_block_time: number;
  burn_block_time_iso: string;
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_args: any[];
  };
  events: ContractEvent[];
}

export interface ContractHistory {
  limit: number;
  offset: number;
  total: number;
  results: ContractTransaction[];
}

/**
 * Get contract information by contract ID
 */
export const getContractInfo = async (contractId: string): Promise<ContractInfo | null> => {
  try {
    const [address, name] = contractId.split('.');
    
    if (!address || !name) {
      console.error('❌ Invalid contract ID format:', contractId);
      return null;
    }

    const url = `${SERVER_BASE}/api/hiro/contract/${contractId}`;
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        headers: getServerHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status !== 404) {
          console.error(`❌ Error ${response.status}: ${response.statusText}`);
        }
        return null;
      }

      const data = await response.json();
      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.warn('⏱️ Request timeout after 10s:', contractId);
      } else {
        console.error('❌ Network error fetching contract info:', fetchError.message);
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching contract info:', error);
    return null;
  }
};

/**
 * Get transaction status
 */
export const getTransactionStatus = async (txId: string): Promise<TransactionStatus | null> => {
  try {
    const response = await fetch(
      `${SERVER_BASE}/api/hiro/transaction/${txId}`,
      {
        headers: getServerHeaders(),
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    return null;
  }
};

/**
 * Get all transactions for a contract
 */
export const getContractTransactions = async (
  contractId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ContractHistory> => {
  try {
    const response = await fetch(
      `${SERVER_BASE}/api/hiro/contract/${contractId}/transactions?limit=${limit}&offset=${offset}`,
      {
        headers: getServerHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch contract transactions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching contract transactions:', error);
    return {
      limit,
      offset,
      total: 0,
      results: [],
    };
  }
};

/**
 * Get contract events
 */
export const getContractEvents = async (
  contractId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ limit: number; offset: number; total: number; results: ContractEvent[] }> => {
  try {
    const response = await fetch(
      `${SERVER_BASE}/api/hiro/contract/${contractId}/events?limit=${limit}&offset=${offset}`,
      {
        headers: getServerHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch contract events: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching contract events:', error);
    return {
      limit,
      offset,
      total: 0,
      results: [],
    };
  }
};

/**
 * Get transactions by address
 */
export const getAddressTransactions = async (
  address: string,
  limit: number = 50,
  offset: number = 0
): Promise<ContractHistory> => {
  try {
    const response = await fetch(
      `${SERVER_BASE}/api/hiro/address/${address}/transactions?limit=${limit}&offset=${offset}`,
      {
        headers: getServerHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch address transactions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    return {
      limit,
      offset,
      total: 0,
      results: [],
    };
  }
};

/**
 * Get all contract deployments by address
 * Filters transactions to only show smart_contract type (contract deployments)
 */
export const getContractDeploymentsByAddress = async (
  address: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  total: number;
  results: Array<{
    tx_id: string;
    contract_id: string;
    tx_status: string;
    block_height: number;
    burn_block_time: number;
    burn_block_time_iso: string;
    canonical: boolean;
    contract_name: string;
    source_code?: string;
  }>;
}> => {
  try {
    
    // Validate address format
    if (!address || address.length < 20) {
      console.error('❌ Invalid address format:', address);
      return {
        total: 0,
        results: [],
      };
    }

    // Stacks addresses should start with ST or SP
    if (!address.startsWith('ST') && !address.startsWith('SP')) {
      console.error('❌ Address does not start with ST or SP:', address);
      return {
        total: 0,
        results: [],
      };
    }
    
    const url = `${SERVER_BASE}/api/hiro/address/${address}/deployments?limit=${limit}&offset=${offset}`;
    
    const response = await fetch(url, {
      headers: getServerHeaders(),
    });

    if (!response.ok) {
      console.error('❌ API Response not OK:', response.status, response.statusText);
      
      // Try to get error details
      try {
        const errorData = await response.text();
        console.error('❌ Error details:', errorData);
      } catch (e) {
        // Ignore
      }
      
      throw new Error(`Failed to fetch contract deployments: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      total: data.total,
      results: data.results,
    };
  } catch (error) {
    console.error('❌ Error fetching contract deployments:', error);
    return {
      total: 0,
      results: [],
    };
  }
};

/**
 * Get detailed info for all deployed contracts by address
 * This will fetch full contract info for each deployment
 */
export const indexAllContractsByAddress = async (
  address: string
): Promise<Array<{
  contractId: string;
  contractName: string;
  txId: string;
  deployedAt: number;
  deployedAtISO: string;
  blockHeight: number;
  status: string;
  canonical: boolean;
  contractInfo?: ContractInfo | null;
  analytics?: any | null;
}>> => {
  try {

    // First, get all contract deployments
    const deployments = await getContractDeploymentsByAddress(address, 100, 0);

    if (deployments.results.length === 0) {
      return [];
    }

    // Fetch detailed info for each contract
    const contractsWithDetails = await Promise.all(
      deployments.results.map(async (deployment) => {
        try {
          // Get contract info
          const contractInfo = await getContractInfo(deployment.contract_id);

          // Get contract analytics
          let analytics = null;
          if (contractInfo) {
            analytics = await getContractAnalytics(deployment.contract_id);
          }

          return {
            contractId: deployment.contract_id,
            contractName: deployment.contract_name,
            txId: deployment.tx_id,
            deployedAt: deployment.burn_block_time * 1000, // Convert to milliseconds
            deployedAtISO: deployment.burn_block_time_iso,
            blockHeight: deployment.block_height,
            status: deployment.tx_status,
            canonical: deployment.canonical,
            contractInfo,
            analytics,
          };
        } catch (error) {
          console.error(`Error fetching details for ${deployment.contract_id}:`, error);
          return {
            contractId: deployment.contract_id,
            contractName: deployment.contract_name,
            txId: deployment.tx_id,
            deployedAt: deployment.burn_block_time * 1000,
            deployedAtISO: deployment.burn_block_time_iso,
            blockHeight: deployment.block_height,
            status: deployment.tx_status,
            canonical: deployment.canonical,
            contractInfo: null,
            analytics: null,
          };
        }
      })
    );
    return contractsWithDetails;
  } catch (error) {
    console.error('Error indexing contracts by address:', error);
    return [];
  }
};

/**
 * Call read-only contract function via Hiro API (using Express Server)
 */
export const callContractReadOnly = async (
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: any[] = [],
  sender?: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${SERVER_BASE}/api/hiro/contract/${contractAddress}/${contractName}/call-read/${functionName}`,
      {
        method: 'POST',
        headers: getServerHeaders(),
        body: JSON.stringify({
          arguments: functionArgs,
          sender: sender || contractAddress,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to call read-only function: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling read-only function:', error);
    throw error;
  }
};

/**
 * Get mempool transactions (pending transactions)
 */
export const getMempoolTransactions = async (
  address?: string,
  limit: number = 50
): Promise<ContractTransaction[]> => {
  try {
    // Mempool transactions endpoint might not be implemented in server yet
    // For now, return empty array until server is updated
    console.warn('getMempoolTransactions is not yet implemented in the server');
    return [];
  } catch (error) {
    console.error('Error fetching mempool transactions:', error);
    return [];
  }
};

/**
 * Parse Clarity value from Hiro API response
 */
export const parseClarityValue = (value: any): any => {
  if (!value) return null;

  // Handle different Clarity types
  if (value.type === 'uint') {
    return parseInt(value.value);
  } else if (value.type === 'int') {
    return parseInt(value.value);
  } else if (value.type === 'bool') {
    return value.value === 'true' || value.value === true;
  } else if (value.type === 'principal') {
    return value.value;
  } else if (value.type === 'tuple') {
    const tuple: any = {};
    for (const [key, val] of Object.entries(value.data || {})) {
      tuple[key] = parseClarityValue(val);
    }
    return tuple;
  } else if (value.type === 'list') {
    return (value.value || []).map((item: any) => parseClarityValue(item));
  } else if (value.type === 'optional') {
    return value.value ? parseClarityValue(value.value) : null;
  } else if (value.type === 'response') {
    if (value.success) {
      return parseClarityValue(value.value);
    } else {
      throw new Error(`Contract error: ${JSON.stringify(value.value)}`);
    }
  }

  return value.value || value;
};

/**
 * Get contract analytics from indexed data
 */
export const getContractAnalytics = async (contractId: string) => {
  try {
    const [transactions, events] = await Promise.all([
      getContractTransactions(contractId, 100),
      getContractEvents(contractId, 100),
    ]);

    // Calculate statistics
    const totalTransactions = transactions.total;
    const successfulTxs = transactions.results.filter(tx => tx.tx_status === 'success').length;
    const failedTxs = transactions.results.filter(tx => tx.tx_status !== 'success' && tx.tx_status !== 'pending').length;
    const totalEvents = events.total;

    // Calculate daily activity
    const dailyActivity: { [date: string]: number } = {};
    transactions.results.forEach(tx => {
      const date = new Date(tx.burn_block_time_iso).toISOString().split('T')[0];
      if (date) {
        dailyActivity[date] = (dailyActivity[date] || 0) + 1;
      }
    });

    // Get unique users
    const uniqueUsers = new Set(transactions.results.map(tx => tx.sender_address));

    // Calculate function call distribution
    const functionCalls: { [name: string]: number } = {};
    transactions.results.forEach(tx => {
      if (tx.contract_call?.function_name) {
        const fnName = tx.contract_call.function_name;
        functionCalls[fnName] = (functionCalls[fnName] || 0) + 1;
      }
    });

    return {
      totalTransactions,
      successfulTransactions: successfulTxs,
      failedTransactions: failedTxs,
      totalEvents,
      uniqueUsers: uniqueUsers.size,
      dailyActivity,
      functionCalls,
      recentTransactions: transactions.results.slice(0, 10),
      recentEvents: events.results.slice(0, 10),
    };
  } catch (error) {
    console.error('Error getting contract analytics:', error);
    return null;
  }
};

export default {
  getContractInfo,
  getTransactionStatus,
  getContractTransactions,
  getContractEvents,
  getAddressTransactions,
  getContractDeploymentsByAddress,
  indexAllContractsByAddress,
  callContractReadOnly,
  getMempoolTransactions,
  parseClarityValue,
  getContractAnalytics,
};
