import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Eye,
  ExternalLink,
  Copy,
  BarChart3,
  DollarSign,
  Users,
  Calendar,
  Edit,
  Pause,
  Play,
  Archive,
  Download,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useTurnkeyWallet } from '@/contexts/TurnkeyWalletContext';

interface DeployedContract {
  contractId: number;
  contractAddress: string;
  eventName: string;
  category: string;
  totalSupply: number;
  ticketPrice: number;
  ticketsSold: number;
  revenue: number;
  deployBlock: number;
  deployTimestamp: number;
  isActive: boolean;
  template: string;
  metadataUri: string;
}

interface ContractStats {
  totalContracts: number;
  totalRevenue: number;
  totalTicketsSold: number;
  averagePrice: number;
  activeContracts: number;
}

// Mock data for demonstration
const mockContracts: DeployedContract[] = [
  {
    contractId: 1,
    contractAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG.bitcoin-conf-2025',
    eventName: 'Bitcoin Conference 2025',
    category: 'conference',
    totalSupply: 500,
    ticketPrice: 0.005,
    ticketsSold: 385,
    revenue: 1.925,
    deployBlock: 150000,
    deployTimestamp: Date.now() - 7200000,
    isActive: true,
    template: 'premium-event',
    metadataUri: 'https://pulse-robot.com/metadata/bitcoin-conf-2025'
  },
  {
    contractId: 2,
    contractAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG.music-festival-2025',
    eventName: 'Summer Music Festival',
    category: 'music',
    totalSupply: 1000,
    ticketPrice: 0.003,
    ticketsSold: 750,
    revenue: 2.25,
    deployBlock: 148500,
    deployTimestamp: Date.now() - 86400000,
    isActive: true,
    template: 'festival-event',
    metadataUri: 'https://pulse-robot.com/metadata/music-festival-2025'
  },
  {
    contractId: 3,
    contractAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG.tech-meetup-2025',
    eventName: 'Tech Meetup March',
    category: 'meetup',
    totalSupply: 100,
    ticketPrice: 0.001,
    ticketsSold: 100,
    revenue: 0.1,
    deployBlock: 145000,
    deployTimestamp: Date.now() - 172800000,
    isActive: false,
    template: 'basic-event',
    metadataUri: 'https://pulse-robot.com/metadata/tech-meetup-2025'
  }
];

export const ContractManagement = () => {
  const { address, isConnected } = useTurnkeyWallet();
  const [contracts, setContracts] = useState<DeployedContract[]>(mockContracts);
  const [selectedContract, setSelectedContract] = useState<DeployedContract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate stats
  const stats: ContractStats = {
    totalContracts: contracts.length,
    totalRevenue: contracts.reduce((sum, contract) => sum + contract.revenue, 0),
    totalTicketsSold: contracts.reduce((sum, contract) => sum + contract.ticketsSold, 0),
    averagePrice: contracts.length > 0 ? contracts.reduce((sum, contract) => sum + contract.ticketPrice, 0) / contracts.length : 0,
    activeContracts: contracts.filter(c => c.isActive).length
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.contractAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && contract.isActive) ||
                         (statusFilter === 'inactive' && !contract.isActive);
    return matchesSearch && matchesStatus;
  });

  const formatAddress = (address: string) => {
    const parts = address.split('.');
    if (parts.length > 1) {
      return `${parts[0].slice(0, 8)}...${parts[0].slice(-4)}.${parts[1]}`;
    }
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recently';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleContractStatus = async (contractId: number) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setContracts(prev => prev.map(contract =>
      contract.contractId === contractId
        ? { ...contract, isActive: !contract.isActive }
        : contract
    ));

    setIsLoading(false);
  };

  const refreshData = async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Refreshing contract data...');

    setIsLoading(false);
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Management</CardTitle>
          <CardDescription>
            Connect your wallet to manage your deployed contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your Turnkey wallet to access contract management
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Contract Management</h2>
          <p className="text-gray-400">Manage your deployed NFT ticketing contracts</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isLoading} 
          variant="outline"
          className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A] hover:border-[#FE5C02]/50 transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalContracts}</div>
            <div className="text-sm text-gray-400">Total Contracts</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#FE5C02]">{stats.totalRevenue.toFixed(4)}</div>
            <div className="text-sm text-gray-400">Total Revenue (sBTC)</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.totalTicketsSold.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Tickets Sold</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.averagePrice.toFixed(6)}</div>
            <div className="text-sm text-gray-400">Avg Price (sBTC)</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.activeContracts}</div>
            <div className="text-sm text-gray-400">Active Contracts</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by event name or contract address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0A0A0A] border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 bg-[#0A0A0A] border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your Contracts ({filteredContracts.length})</CardTitle>
          <CardDescription>
            Manage and monitor your deployed NFT ticketing contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300">No contracts found</h3>
              <p className="text-gray-500">No contracts match your current filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContracts.map((contract) => (
                <Card key={contract.contractId} className="bg-[#1A1A1A] border-gray-800 hover:border-gray-700 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{contract.eventName}</h3>
                          <Badge variant={contract.isActive ? 'default' : 'secondary'}>
                            {contract.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                          <Badge variant="outline" className="text-gray-400 border-gray-600">
                            {contract.template.replace('-', ' ')}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-400 mb-3 font-mono">
                          {formatAddress(contract.contractAddress)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Supply:</span>
                            <div className="font-semibold text-white">{contract.totalSupply.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Price:</span>
                            <div className="font-semibold text-white">{contract.ticketPrice} sBTC</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Sold:</span>
                            <div className="font-semibold text-green-400">
                              {contract.ticketsSold} ({((contract.ticketsSold / contract.totalSupply) * 100).toFixed(1)}%)
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Revenue:</span>
                            <div className="font-semibold text-[#FE5C02]">{contract.revenue.toFixed(4)} sBTC</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <div>Deployed: {formatTimeAgo(contract.deployTimestamp)}</div>
                          <div>Category: {contract.category}</div>
                          <div>Block: #{contract.deployBlock}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedContract(contract)}
                          className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A] hover:border-[#FE5C02]/50 transition-all duration-200"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleContractStatus(contract.contractId)}
                          disabled={isLoading}
                          className={`bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A] transition-all duration-200 ${
                            contract.isActive 
                              ? 'hover:border-yellow-500/50' 
                              : 'hover:border-green-500/50'
                          }`}
                        >
                          {contract.isActive ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://explorer.stacks.co/address/${contract.contractAddress}?chain=testnet`, '_blank')}
                          className="bg-[#1A1A1A] border-gray-700 text-[#FE5C02] hover:bg-[#2A2A2A] hover:border-[#FE5C02] transition-all duration-200 hover:shadow-[0_0_15px_rgba(254,92,2,0.3)]"
                          title="View on Stacks Explorer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-gray-800 shadow-2xl animate-in zoom-in duration-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">{selectedContract.eventName}</CardTitle>
                  <CardDescription>Contract Details & Analytics</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContract(null)}
                  className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-red-500/20 hover:border-red-500 transition-all duration-200"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-[#0A0A0A]">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0A0A0A] p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-400">Total Supply</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{selectedContract.totalSupply}</div>
                    </div>
                    <div className="bg-[#0A0A0A] p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Ticket Price</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{selectedContract.ticketPrice} sBTC</div>
                    </div>
                    <div className="bg-[#0A0A0A] p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-[#FE5C02]" />
                        <span className="text-sm text-gray-400">Sold</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{selectedContract.ticketsSold}</div>
                      <div className="text-xs text-gray-500">
                        {((selectedContract.ticketsSold / selectedContract.totalSupply) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-400">Revenue</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{selectedContract.revenue.toFixed(4)} sBTC</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <span className="text-gray-400">Template:</span>
                          <span className="text-white capitalize">{selectedContract.template.replace('-', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white capitalize">{selectedContract.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <Badge variant={selectedContract.isActive ? 'default' : 'secondary'}>
                            {selectedContract.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A] p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-3">Performance Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sales Rate:</span>
                          <span className="text-white">
                            {((selectedContract.ticketsSold / selectedContract.totalSupply) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Remaining:</span>
                          <span className="text-white">
                            {(selectedContract.totalSupply - selectedContract.ticketsSold).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Est. Total Revenue:</span>
                          <span className="text-white">
                            {(selectedContract.totalSupply * selectedContract.ticketPrice).toFixed(4)} sBTC
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Revenue Progress:</span>
                          <span className="text-white">
                            {((selectedContract.revenue / (selectedContract.totalSupply * selectedContract.ticketPrice)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300">Analytics Dashboard</h3>
                    <p className="text-gray-500">Detailed analytics coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
                    <div className="bg-[#0A0A0A] p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-3">Contract Actions</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => toggleContractStatus(selectedContract.contractId)}
                          disabled={isLoading}
                          className={selectedContract.isActive 
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-yellow-500/50 transition-all duration-200' 
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-500/50 transition-all duration-200'
                          }
                        >
                          {selectedContract.isActive ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause Contract
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Activate Contract
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A] hover:border-red-500/50 transition-all duration-200"
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4">
                  <div className="bg-[#0A0A0A] p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-white">Metadata URI</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedContract.metadataUri, '_blank')}
                        className="bg-[#1A1A1A] border-gray-700 text-[#FE5C02] hover:bg-[#2A2A2A] hover:border-[#FE5C02] transition-all duration-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                    <div className="font-mono text-sm text-gray-300 break-all bg-[#1A1A1A] p-3 rounded">
                      {selectedContract.metadataUri}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedContract(null)} 
                  className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#2A2A2A] transition-all duration-200"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.open(`https://explorer.stacks.co/address/${selectedContract.contractAddress}?chain=testnet`, '_blank')}
                  className="bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-[0_0_20px_rgba(254,92,2,0.5)] transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
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