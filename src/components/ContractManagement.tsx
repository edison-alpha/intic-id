import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';

import { ContractManagementFullSkeleton } from './ContractManagementSkeleton.tsx';

import {
  Eye,
  ExternalLink,
  Copy,
  BarChart3,
  DollarSign,
  Users,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileCode,
  Activity,
  Hash,
  Calendar,
  MoreVertical,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UpdateEventDetails from './UpdateEventDetails';
import {
  getTransactionStatus,
  indexAllContractsByAddress,
  type ContractTransaction
} from '@/services/hiroIndexer';
import {
  getNFTTicketData,
  indexAllNFTTickets,
  type NFTTicketMetadata,
} from '@/services/nftIndexer';
import { getEventDataFromContract } from '@/services/nftIndexer';

interface DeployedContract {
  contractAddress: string;
  contractName: string;
  eventName: string;
  image?: string;
  totalSupply: number;
  ticketPrice: number;
  pricingMode?: 'fixed' | 'usd-dynamic';
  currency?: 'STX' | 'sBTC';
  royaltyPercent: number;
  eventDate: number;
  deployedAt: number;
  txId: string;
  metadataUri?: string;
  // Data from blockchain via Hiro Indexer
  ticketsSold?: number;
  ticketsRemaining?: number;
  revenue?: number;
  eventCancelled?: boolean;
  baseUri?: string;
  // Analytics from Hiro Indexer
  totalTransactions?: number;
  uniqueUsers?: number;
  recentActivity?: ContractTransaction[];
}

interface DeploymentQueueItem {
  contractName: string;
  eventName: string;
  txId: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  metadataUri?: string;
}

interface ContractStats {
  totalContracts: number;
  totalRevenue: number;
  totalTicketsSold: number;
  averagePrice: number;
  pendingDeployments: number;
}

export const ContractManagement = () => {
  const { wallet, isWalletConnected } = useWallet();
  const [contracts, setContracts] = useState<DeployedContract[]>([]);
  const [deploymentQueue, setDeploymentQueue] = useState<DeploymentQueueItem[]>([]);
  const [selectedContract, setSelectedContract] = useState<DeployedContract | null>(null);
  const [indexedContracts, setIndexedContracts] = useState<any[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);

  // NFT Ticket specific state
  const [nftTicketData, setNftTicketData] = useState<Map<string, NFTTicketMetadata>>(new Map());

  // Update Event Details modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [contractToUpdate, setContractToUpdate] = useState<any | null>(null);

  // Auto-refresh state (hidden from UI, always enabled)
  // const [isAutoRefreshing, setIsAutoRefreshing] = useState(false); // removed unused

  // Load deployment queue and contracts from localStorage
  useEffect(() => {
    if (isWalletConnected && wallet?.address) {
      loadDeploymentQueue();
      loadContracts();

      // Load cached indexed contracts first
      const cachedIndexed = localStorage.getItem(`hiro-indexed-contracts-${wallet.address}`);
      if (cachedIndexed) {
        try {
          const parsed = JSON.parse(cachedIndexed);
          setIndexedContracts(parsed);

          // Load cached NFT data
          const cachedNFT = localStorage.getItem(`nft-ticket-data-${wallet.address}`);
          if (cachedNFT) {
            const nftCacheData = JSON.parse(cachedNFT);
            const nftMap = new Map<string, NFTTicketMetadata>(nftCacheData);
            setNftTicketData(nftMap);
          }

          // Auto-refresh data immediately after loading cache
          console.log('🔄 Auto-refreshing data after loading cache...');
          setTimeout(() => {
            refreshData();
          }, 1000);
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      } else {
        // No cache - auto-load data from blockchain
        console.log('🔍 No cache found, loading from blockchain...');
        setTimeout(() => {
          indexContractsFromHiro();
        }, 500);
      }
    }
  }, [wallet?.address]);

  // Auto-refresh pending deployments every 30 seconds
  useEffect(() => {
    if (!isWalletConnected || deploymentQueue.length === 0) {
      return;
    }

    const hasPending = deploymentQueue.some(d => d.status === 'pending');
    if (!hasPending) {
      return;
    }

    const interval = setInterval(() => {
      checkDeploymentStatus();
    }, 30000); // Check every 30 seconds

    // Initial check after 5 seconds
    const initialTimeout = setTimeout(() => {
      checkDeploymentStatus();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [isWalletConnected, deploymentQueue]);

  // Auto-refresh contract data every 30 seconds (background, silent)
  useEffect(() => {
    if (!isWalletConnected || indexedContracts.length === 0) {
      return;
    }

    console.log('🔄 Auto-refresh enabled: every 30s');

    const interval = setInterval(async () => {
      console.log('🔄 Auto-refreshing contract data...');
      await refreshData();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isWalletConnected, indexedContracts.length]);

  const loadDeploymentQueue = () => {
    try {
      const queueData = localStorage.getItem(`deployment-queue-${wallet?.address}`);
      if (queueData) {
        const queue: DeploymentQueueItem[] = JSON.parse(queueData);
        setDeploymentQueue(queue);
      }
    } catch (error) {
      console.error('Error loading deployment queue:', error);
    }
  };

  const loadContracts = () => {
    try {
      const contractsData = localStorage.getItem(`deployed-contracts-${wallet?.address}`);

      if (contractsData) {
        const parsedContracts: DeployedContract[] = JSON.parse(contractsData);
        
        // Filter out contracts that don't belong to current wallet
        const validContracts = parsedContracts.filter(contract => {
          const contractAddress = contract.contractAddress.split('.')[0];
          return contractAddress === wallet?.address;
        });

        if (validContracts.length !== parsedContracts.length) {
          console.warn('⚠️ Some contracts filtered out (not from current wallet)');
          // Update localStorage with valid contracts only
          if (wallet?.address) {
            localStorage.setItem(`deployed-contracts-${wallet.address}`, JSON.stringify(validContracts));
          }
        }

        setContracts(validContracts);

        // Enrich with on-chain data (non-blocking)
        (async () => {
          try {
            const enriched = await Promise.all(validContracts.map(async (c) => {
              try {
                const onChain = await getEventDataFromContract(c.contractAddress);
                if (onChain) {
                  return {
                    ...c,
                    eventName: onChain.eventName || c.eventName,
                    ticketsSold: onChain.minted || c.ticketsSold,
                    ticketsRemaining: (onChain.available ?? onChain.available) || c.ticketsRemaining,
                    revenue: c.revenue,
                    eventCancelled: onChain.isCancelled ?? c.eventCancelled,
                    totalSupply: onChain.totalSupply || c.totalSupply,
                    ticketPrice: onChain.price || c.ticketPrice,
                    image: onChain.image || (c as any).image || undefined,
                  } as DeployedContract;
                }
              } catch (err) {
                console.warn('Could not fetch on-chain data for', c.contractAddress, err);
              }
              return c;
            }));

            setContracts(enriched);

            // Cache enriched contracts
            if (wallet?.address) {
              localStorage.setItem(`deployed-contracts-${wallet.address}`, JSON.stringify(enriched));
            }
          } catch (err) {
            console.error('Error enriching contracts with on-chain data:', err);
          }
        })();

        // Note: fetchContractData removed - we now use Stacks.js via indexNFTTicketData instead
        // The old Hiro API method has been deprecated in favor of more reliable Stacks.js reads
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  // Index all contracts deployed by connected address from Hiro
  const indexContractsFromHiro = async () => {

    if (!wallet?.address) {
      console.error('❌ No wallet address available');
      return;
    }

  setIsIndexing(true);

    try {
      const indexed = await indexAllContractsByAddress(wallet.address);
      // Validate each contract has required fields
      const validatedContracts = indexed.filter(contract => {
        const isValid = contract.contractId && contract.txId;
        if (!isValid) {
          console.warn('⚠️ Invalid contract data:', contract);
        }
        return isValid;
      });
      setIndexedContracts(validatedContracts);
      if (wallet?.address && validatedContracts.length > 0) {
        localStorage.setItem(`hiro-indexed-contracts-${wallet.address}`, JSON.stringify(validatedContracts));
      }
      await indexNFTTicketData(validatedContracts);
    } catch (error) {
      console.error('❌ Error indexing contracts from Hiro:', error);
    } finally {
      setIsIndexing(false);
    }
  };

  // Index NFT Ticket data for contracts
  const indexNFTTicketData = async (contracts: any[]) => {
    try {

      // Index ALL contracts (assume all are NFT tickets)
      const nftContracts = contracts;
      console.log('🎫 Contract names:', nftContracts.map(c => c.contractName));

      if (nftContracts.length === 0) {
        return;
      }

      // Get contract IDs
      const contractIds = nftContracts.map(c => c.contractId);

      // Index all NFT tickets
      const nftData = await indexAllNFTTickets(contractIds);

      // Store in Map for easy lookup
      const nftDataMap = new Map<string, NFTTicketMetadata>();
      nftData.forEach(data => {
        nftDataMap.set(data.contractId, data);
      });

      setNftTicketData(nftDataMap);

      // Cache to localStorage
      if (wallet?.address) {
        const cacheData = Array.from(nftDataMap.entries());
        localStorage.setItem(`nft-ticket-data-${wallet.address}`, JSON.stringify(cacheData));
      }
      
      if (nftData.length > 0) {
  // Data loaded, no toast
      } else {
        console.log('ℹ️ No NFT data available (contracts might not be in registry yet)');
        // Don't show error - this is normal for new contracts
      }

    } catch (error) {
      console.error('❌ Error indexing NFT ticket data:', error);
      // Don't show error toast - this shouldn't block the main display
    }
  };

  // Refresh NFT data for a specific contract
  const refreshNFTData = async (contractId: string) => {
    try {
      const nftData = await getNFTTicketData(contractId);

      if (nftData) {
        setNftTicketData(prev => {
          const newMap = new Map(prev);
          newMap.set(contractId, nftData);
          return newMap;
        });
  // Data refreshed, no toast
      }
    } catch (error) {
      console.error('❌ Error refreshing NFT data:', error);
  // No toast on error
    }
  };

  /**
   * @deprecated - Legacy function using Hiro API callContractReadOnly
   * Replaced by Stacks.js implementation via indexNFTTicketData & refreshNFTData
   * Kept for reference only
   */
  /*
  const fetchContractData = async (contract: DeployedContract) => {
    const contractRef = contract;
    try {
      const contractParts = contract.contractAddress.split('.');
      const address: string = contractParts[0] || '';
      const name: string = contractParts[1] || '';

      if (!address || !name) {
        console.error('❌ Invalid contract address format:', contract.contractAddress);
        return;
      }

      // Check if contract belongs to current wallet
      if (address !== wallet?.address) {
        console.warn('⚠️ Contract not from current wallet:', contract.contractAddress);
        return;
      }

      // Use Hiro Indexer to check contract status
      const contractInfo = await getContractInfo(contract.contractAddress);

      if (!contractInfo) {
        
        // Mark as pending in UI
        setContracts(prev => prev.map(c =>
          c.contractAddress === contract.contractAddress
            ? {
                ...c,
                ticketsSold: 0, // Set to 0 instead of undefined
                ticketsRemaining: c.totalSupply,
                revenue: 0, // Set to 0 instead of undefined
                eventCancelled: false,
              }
            : c
        ));
        return;
      }

      // Get contract analytics from Hiro Indexer
      const analytics = await getContractAnalytics(contract.contractAddress);

      // Call contract's get-event-info read-only function via Hiro
      try {
        const eventInfoResponse = await callContractReadOnly(
          address,
          name,
          'get-event-info',
          [],
          address
        );

        if (eventInfoResponse.okay && eventInfoResponse.result) {

          // Parse Clarity tuple response using Hiro parser
          const eventInfo = parseClarityValue(eventInfoResponse.result);

          // Extract values from parsed response
          const sold = eventInfo?.sold || 0;
          const remaining = eventInfo?.remaining || contract.totalSupply;
          const cancelled = eventInfo?.cancelled || false;

          // Update contract with blockchain data and analytics
          setContracts(prev => prev.map(c =>
            c.contractAddress === contract.contractAddress
              ? {
                  ...c,
                  ticketsSold: sold,
                  ticketsRemaining: remaining,
                  revenue: sold * c.ticketPrice,
                  eventCancelled: cancelled,
                  totalTransactions: analytics?.totalTransactions || 0,
                  uniqueUsers: analytics?.uniqueUsers || 0,
                  recentActivity: analytics?.recentTransactions || [],
                }
              : c
          ));

          // Save to localStorage
          const updatedContracts = contracts.map(c =>
            c.contractAddress === contract.contractAddress
              ? {
                  ...c,
                  ticketsSold: sold,
                  ticketsRemaining: remaining,
                  revenue: sold * c.ticketPrice,
                  eventCancelled: cancelled,
                  totalTransactions: analytics?.totalTransactions || 0,
                  uniqueUsers: analytics?.uniqueUsers || 0,
                }
              : c
          );
          if (wallet?.address) {
            localStorage.setItem(`deployed-contracts-${wallet.address}`, JSON.stringify(updatedContracts));
          }
        }
      } catch (readError) {
        console.error('Error reading contract data:', readError);
        // Set basic data if read fails
        setContracts(prev => prev.map(c =>
          c.contractAddress === contractRef.contractAddress
            ? {
                ...c,
                ticketsSold: 0,
                ticketsRemaining: c.totalSupply,
                revenue: 0,
                eventCancelled: false,
                totalTransactions: analytics?.totalTransactions || 0,
                uniqueUsers: analytics?.uniqueUsers || 0,
                recentActivity: analytics?.recentTransactions || [],
              }
            : c
        ));
      }
    } catch (error) {
      console.error('Error fetching contract data for', contractRef.contractName, ':', error);

      // Fallback: set basic data if API call fails
      setContracts(prev => prev.map(c =>
        c.contractAddress === contractRef.contractAddress
          ? {
              ...c,
              ticketsSold: 0,
              ticketsRemaining: c.totalSupply,
              revenue: 0,
              eventCancelled: false,
            }
          : c
      ));
    }
  };
  */

  // Background refresh without UI notification
  const refreshData = async () => {
    try {
      // Only refresh NFT data silently in background
      if (indexedContracts.length > 0) {
        await indexNFTTicketData(indexedContracts);
      }

      // Check deployment queue status
      await checkDeploymentStatus();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const checkDeploymentStatus = async () => {
    const pendingDeployments = deploymentQueue.filter(d => d.status === 'pending');

    if (pendingDeployments.length === 0) {
      return;
    }

    for (const deployment of pendingDeployments) {
      try {
        // Use Hiro Indexer to get transaction status
        const txData = await getTransactionStatus(deployment.txId);
        
        if (!txData) {
          continue;
        }

        if (txData.tx_status === 'success') {
          // Check if contract already exists in deployed contracts
          const existingContract = contracts.find(c => c.txId === deployment.txId);

          if (!existingContract) {
            // Update status in queue to confirmed
            const updatedQueue = deploymentQueue.map(d =>
              d.txId === deployment.txId ? { ...d, status: 'confirmed' as const } : d
            );
            setDeploymentQueue(updatedQueue);
            localStorage.setItem(`deployment-queue-${wallet?.address}`, JSON.stringify(updatedQueue));

            // Deployment success, no toast

            // Reload contracts to fetch latest data
            setTimeout(() => {
              loadContracts();
            }, 1000);
          }
        } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
          // Update status to failed
          const updatedQueue = deploymentQueue.map(d =>
            d.txId === deployment.txId ? { ...d, status: 'failed' as const } : d
          );
          setDeploymentQueue(updatedQueue);
          localStorage.setItem(`deployment-queue-${wallet?.address}`, JSON.stringify(updatedQueue));

          // Deployment failed, no toast
        }
      } catch (error) {
        console.error('Error checking deployment status for', deployment.contractName, ':', error);
      }
    }
  };

  // Calculate stats from indexed contracts and NFT data
  const stats: ContractStats = React.useMemo(() => {
    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let totalPrice = 0;
    let contractsWithPrice = 0;

    indexedContracts.forEach((contract) => {
      const nftData = nftTicketData.get(contract.contractId);
      
      if (nftData) {
        // Calculate revenue: mintedCount * price
        if (nftData.mintedCount && nftData.mintPrice) {
          const priceInSTX = parseFloat(nftData.mintPrice) / 1000000;
          totalRevenue += nftData.mintedCount * priceInSTX;
        }
        
        // Total tickets sold
        if (nftData.mintedCount) {
          totalTicketsSold += nftData.mintedCount;
        }
        
        // Average price calculation
        if (nftData.mintPrice) {
          totalPrice += parseFloat(nftData.mintPrice) / 1000000;
          contractsWithPrice++;
        }
      }
    });

    return {
      totalContracts: indexedContracts.length,
      totalRevenue,
      totalTicketsSold,
      averagePrice: contractsWithPrice > 0 ? totalPrice / contractsWithPrice : 0,
      pendingDeployments: deploymentQueue.filter(d => d.status === 'pending').length,
    };
  }, [indexedContracts, nftTicketData, deploymentQueue]);

  const formatAddress = (address: string | undefined) => {
    if (!address) return 'N/A';
    const parts = address.split('.');
    if (parts.length > 1 && parts[0] && parts[1]) {
      return `${parts[0].slice(0, 8)}...${parts[0].slice(-4)}.${parts[1]}`;
    }
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatTimeAgo = (timestamp: number | string) => {
    const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recently';
  };

  const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  // Copied, no toast
  };

  if (!isWalletConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="bg-[#1A1A1A] border-gray-800 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-4">
            Please connect your Stacks wallet to view and manage your NFT ticket contracts
          </p>
          <p className="text-sm text-gray-500">
            Your event contracts will appear here once you connect your wallet
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">My NFT Tickets</h2>
          <p className="text-gray-400">Manage your event ticket contracts on Stacks blockchain</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalContracts}</div>
            <div className="text-sm text-gray-400">Deployed</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#FE5C02]">{stats.totalRevenue?.toFixed(4) || '0.0000'}</div>
            <div className="text-sm text-gray-400">Total Revenue (STX)</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.totalTicketsSold?.toLocaleString() || '0'}</div>
            <div className="text-sm text-gray-400">Tickets Sold</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.averagePrice?.toFixed(6) || '0.000000'}</div>
            <div className="text-sm text-gray-400">Avg Price (STX)</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingDeployments}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* My Ticket Contracts */}
      <div className="space-y-4">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <CardTitle className="text-xl font-bold text-white">
                      Event Ticket Contracts
                    </CardTitle>
                    {wallet?.address && (
                      <Badge variant="outline" className="font-mono text-xs text-gray-400 border-gray-700">
                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-gray-500">
                    View and manage your deployed NFT ticket contracts
                  </CardDescription>
                </div>
                <Button
                  onClick={indexContractsFromHiro}
                  disabled={isIndexing}
                  size="sm"
                  className="bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50"
                  title="Load your events from blockchain"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isIndexing ? 'animate-spin' : ''}`} />
                  {isIndexing ? 'Loading...' : 'Load Events'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isIndexing ? (
                <div className="py-6">
                  {/* Skeleton loading for contract management */}
                  <ContractManagementFullSkeleton />
                </div>
              ) : indexedContracts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white">No Events Found</h3>
                  <p className="text-gray-400 mb-2 mt-2">
                    You haven't deployed any event contracts yet
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    Deploy your first NFT ticket contract to get started!
                  </p>
                  <Button
                    onClick={indexContractsFromHiro}
                    variant="outline"
                    className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {indexedContracts.map((contract, index) => {
                    // Get NFT data if available
                    const nftData = nftTicketData.get(contract.contractId);
                    const queueId = `#${10000 + index + 1}`;
                    
                    return (
                      <Card key={contract.contractId || contract.txId || `indexed-${index}`} className="bg-[#0A0A0A] border-gray-800 hover:border-gray-700 transition-all">
                        <CardContent className="p-5">
                          {/* Header: Event Name, Status & Details Button */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">
                                {nftData?.eventName || contract.contractName}
                              </h3>
                              <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Convert indexed contract to DeployedContract format for detail view
                                const detailContract = {
                                  contractAddress: contract.contractId,
                                  contractName: contract.contractName,
                                  eventName: nftData?.eventName || contract.contractName,
                                  totalSupply: nftData?.maxSupply || 0,
                                  ticketPrice: nftData?.mintPrice ? parseFloat(nftData.mintPrice) / 1000000 : 0,
                                  royaltyPercent: 0,
                                  eventDate: 0,
                                  deployedAt: contract.deployedAt || Date.now(),
                                  txId: contract.txId || '',
                                  ticketsSold: nftData?.mintedCount,
                                  ticketsRemaining: nftData?.remainingSupply,
                                  totalTransactions: contract.analytics?.totalTransactions,
                                  uniqueUsers: contract.analytics?.uniqueUsers,
                                };
                                setSelectedContract(detailContract as any);
                              }}
                              className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Details
                            </Button>
                          </div>

                          {/* Grid Information */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 mb-4">
                            {/* Queue ID */}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">Queue ID:</div>
                              <div className="text-sm font-semibold text-[#FE5C02]">{queueId}</div>
                            </div>

                            {/* Template */}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">Template:</div>
                              <div className="text-sm font-semibold text-white">Premium Event</div>
                            </div>

                            {/* Category */}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">Category:</div>
                              <div className="text-sm font-semibold text-white">Conference</div>
                            </div>

                            {/* Supply */}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">Supply:</div>
                              <div className="text-sm font-semibold text-white">
                                {nftData ? `${(nftData.maxSupply || nftData.totalSupply || 0)?.toLocaleString()} tickets` : 'Loading...'}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">Price:</div>
                              <div className="text-sm font-semibold text-white">
                                {nftData?.mintPriceFormatted || 'N/A'}
                              </div>
                            </div>

                            {/* Minted */}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500">Minted:</div>
                              <div className="text-sm font-semibold text-green-400">
                                {nftData ? `${nftData.mintedCount || 0} / ${nftData.maxSupply || nftData.totalSupply || 0}` : 'Loading...'}
                              </div>
                            </div>
                          </div>

                          {/* Timestamps */}
                          <div className="flex items-center gap-6 mb-4 text-xs text-gray-500">
                            <div>
                              <span>Created:</span> {contract.deployedAt ? formatTimeAgo(contract.deployedAt) : 'Unknown'}
                            </div>
                            <div>
                              <span>Processed:</span> {contract.deployedAt ? formatTimeAgo(contract.deployedAt) : 'Unknown'}
                            </div>
                          </div>

                          {/* Contract Address Box with Actions */}
                          <div className="bg-[#0D2818] border border-green-900/30 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400 mb-2">Contract Address:</div>
                                <div className="text-sm font-mono text-green-400 break-all">
                                  {contract.contractId}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(contract.contractId)}
                                  className="bg-[#1A1A1A] border border-gray-700 text-white hover:bg-[#2A2A2A] h-9 w-9 p-0"
                                  title="Copy contract ID"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(`https://explorer.hiro.so/txid/${contract.txId}?chain=testnet`, '_blank')}
                                  className="bg-[#FE5C02] hover:bg-orange-600 text-white h-9 w-9 p-0"
                                  title="View on Explorer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                
                                {/* Dropdown Menu (Three Dots) */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="bg-[#1A1A1A] border border-gray-700 text-white hover:bg-[#2A2A2A] h-9 w-9 p-0"
                                      title="More actions"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-gray-700">
                                    <DropdownMenuLabel className="text-white">Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setContractToUpdate(contract);
                                        setShowUpdateModal(true);
                                      }}
                                      className="text-white hover:bg-[#2A2A2A] cursor-pointer"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Update Event Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => setSelectedContract(contract)}
                                      className="text-white hover:bg-[#2A2A2A] cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem 
                                      onClick={() => window.open(`https://explorer.hiro.so/txid/${contract.txId}?chain=testnet`, '_blank')}
                                      className="text-blue-400 hover:bg-[#2A2A2A] cursor-pointer"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View on Explorer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">{selectedContract.eventName}</CardTitle>
                  <CardDescription>Contract Details</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContract(null)}
                  className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-red-500/20 hover:border-red-500"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Total Supply</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{selectedContract.totalSupply?.toLocaleString() || 'N/A'}</div>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Ticket Price</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {selectedContract.pricingMode === 'usd-dynamic'
                      ? `$${selectedContract.ticketPrice?.toFixed(2) || '0.00'} USD`
                      : `${selectedContract.ticketPrice?.toFixed(selectedContract.currency === 'sBTC' ? 8 : 4) || '0'} ${selectedContract.currency || 'STX'}`
                    }
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedContract.pricingMode === 'usd-dynamic'
                      ? `Dynamic pricing in ${selectedContract.currency || 'STX'} via Pyth Oracle`
                      : `Fixed price in ${selectedContract.currency || 'STX'}`
                    }
                  </div>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-[#FE5C02]" />
                    <span className="text-sm text-gray-400">Sold</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{selectedContract.ticketsSold !== undefined ? selectedContract.ticketsSold.toLocaleString() : '0'}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedContract.ticketsSold !== undefined && selectedContract.totalSupply && selectedContract.totalSupply > 0
                      ? `${((selectedContract.ticketsSold / selectedContract.totalSupply) * 100).toFixed(1)}% sold`
                      : 'No sales yet'}
                  </div>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-400">Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {(selectedContract.revenue || 0).toFixed(selectedContract.currency === 'sBTC' ? 8 : 4)} {selectedContract.currency || 'STX'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ${(selectedContract.currency === 'sBTC'
                      ? ((selectedContract.revenue || 0) * 50000)
                      : ((selectedContract.revenue || 0) * 0.5)
                    ).toFixed(2)} USD (est)
                  </div>
                </div>
              </div>

              {/* Additional Stats Row with Hiro Analytics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Remaining Tickets</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {selectedContract.ticketsRemaining !== undefined 
                      ? selectedContract.ticketsRemaining.toLocaleString() 
                      : selectedContract.totalSupply?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400">Royalty</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{selectedContract.royaltyPercent || 0}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    On secondary sales
                  </div>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-gray-400">Total Transactions</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{selectedContract.totalTransactions || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Via Hiro Indexer
                  </div>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-pink-400" />
                    <span className="text-sm text-gray-400">Unique Users</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{selectedContract.uniqueUsers || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Wallet addresses
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0A0A] p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Contract Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Address:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{formatAddress(selectedContract.contractAddress)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(selectedContract.contractAddress)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contract Name:</span>
                    <span className="text-white font-mono">{selectedContract.contractName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">TX ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">
                        {selectedContract.txId ? `${selectedContract.txId.slice(0, 8)}...${selectedContract.txId.slice(-8)}` : 'N/A'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => selectedContract.txId && window.open(`https://explorer.hiro.so/txid/${selectedContract.txId}?chain=testnet`, '_blank')}
                        className="h-6 w-6 p-0"
                        disabled={!selectedContract.txId}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deployed:</span>
                    <span className="text-white">{new Date(selectedContract.deployedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Event Date:</span>
                    <span className="text-white">{new Date(selectedContract.eventDate).toLocaleDateString()}</span>
                  </div>
                  {selectedContract.metadataUri && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Metadata:</span>
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => window.open(selectedContract.metadataUri, '_blank')}
                        className="h-auto p-0 text-[#FE5C02] hover:underline"
                      >
                        View on IPFS
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity from Hiro Indexer */}
              {selectedContract.recentActivity && selectedContract.recentActivity.length > 0 && (
                <div className="bg-[#0A0A0A] p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#FE5C02]" />
                    Recent Activity (via Hiro Indexer)
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedContract.recentActivity.map((tx) => (
                      <div key={tx.tx_id} className="bg-[#1A1A1A] p-3 rounded border border-gray-800">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            {tx.tx_status === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-sm font-medium text-white">
                              {tx.contract_call?.function_name || tx.tx_type}
                            </span>
                            <Badge variant={tx.tx_status === 'success' ? 'default' : 'destructive'} className="text-xs">
                              {tx.tx_status}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`https://explorer.hiro.so/txid/${tx.tx_id}?chain=testnet`, '_blank')}
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            <span className="font-mono">
                              {tx.tx_id ? `${tx.tx_id.slice(0, 12)}...${tx.tx_id.slice(-12)}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {tx.burn_block_time_iso ? new Date(tx.burn_block_time_iso).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="font-mono">
                              {tx.sender_address ? `${tx.sender_address.slice(0, 10)}...${tx.sender_address.slice(-6)}` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://explorer.hiro.so/address/${selectedContract.contractAddress}?chain=testnet`, '_blank')}
                    className="w-full mt-3 bg-[#1A1A1A] border-gray-700 text-[#FE5C02] hover:bg-[#2A2A2A]"
                  >
                    View All Transactions on Hiro Explorer
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              )}

              {/* Update Event Details - Owner Only */}
              {wallet?.address === selectedContract.contractAddress && (
                <div className="mb-6">
                  <UpdateEventDetails
                    contractAddress={selectedContract.contractAddress}
                    contractName={selectedContract.contractName}
                    currentDetails={{
                      name: selectedContract.eventName,
                      venue: nftTicketData.get(selectedContract.contractAddress)?.venue || undefined,
                      venueAddress: undefined,
                      venueCoordinates: undefined,
                      imageUri: nftTicketData.get(selectedContract.contractAddress)?.imageUri || undefined,
                      eventDate: selectedContract.eventDate
                    }}
                  />
                </div>
              )}

              {/* Contract Actions */}
              <div className="bg-[#0A0A0A] p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://explorer.hiro.so/address/${selectedContract.contractAddress}?chain=testnet`, '_blank')}
                    className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A]"
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    View Source
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      copyToClipboard(selectedContract.contractAddress);
                    }}
                    className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A]"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Address
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Use Stacks.js to refresh data
                      refreshNFTData(selectedContract.contractAddress);
                    }}
                    className="bg-[#1A1A1A] border-gray-700 text-blue-400 hover:bg-[#2A2A2A]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                  {selectedContract.metadataUri && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedContract.metadataUri, '_blank')}
                      className="bg-[#1A1A1A] border-gray-700 text-purple-400 hover:bg-[#2A2A2A]"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      IPFS Metadata
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setSelectedContract(null)}
                  className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A]"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.open(`https://explorer.hiro.so/txid/${selectedContract.txId}?chain=testnet`, '_blank')}
                  className="bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Event Details Modal */}
      {showUpdateModal && contractToUpdate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Update Event Details
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-1">
                    {contractToUpdate.eventName || 'Event Contract'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setContractToUpdate(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <UpdateEventDetails
                contractAddress={contractToUpdate.contractAddress || contractToUpdate.contractId?.split('.')[0] || ''}
                contractName={contractToUpdate.contractName || contractToUpdate.contractId?.split('.')[1] || ''}
                currentDetails={{
                  name: contractToUpdate.eventName,
                  venue: nftTicketData.get(contractToUpdate.contractAddress || contractToUpdate.contractId)?.venue || undefined,
                  venueAddress: undefined,
                  venueCoordinates: undefined,
                  imageUri: nftTicketData.get(contractToUpdate.contractAddress || contractToUpdate.contractId)?.imageUri || undefined,
                  eventDate: contractToUpdate.eventDate || contractToUpdate.deployedAt
                }}
              />
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setContractToUpdate(null);
                  }}
                  className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A]"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContractManagement;
