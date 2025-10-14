import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Image, FileText, DollarSign, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTurnkeyWallet } from '@/contexts/TurnkeyWalletContext';

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  features: string[];
  category: 'basic' | 'premium' | 'festival';
}

const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'basic-event',
    name: 'Basic Event',
    description: 'Simple NFT tickets with QR code validation',
    baseFee: 0.005,
    features: ['Basic NFT tickets', 'QR code generation', 'Simple validation', 'Transfer functionality'],
    category: 'basic'
  },
  {
    id: 'premium-event',
    name: 'Premium Event',
    description: 'Advanced features with tiers and royalties',
    baseFee: 0.02,
    features: ['Multi-tier tickets', 'Early access', 'Royalty system', 'Advanced metadata', 'Secondary market'],
    category: 'premium'
  },
  {
    id: 'festival-event',
    name: 'Festival Event',
    description: 'Multi-day events with wristband NFTs',
    baseFee: 0.05,
    features: ['Multi-day access', 'Wristband NFTs', 'Exclusive areas', 'Collectible badges', 'VIP features'],
    category: 'festival'
  }
];

interface DeploymentFormData {
  templateId: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  imageUri: string;
  metadataUri: string;
  totalSupply: number;
  ticketPrice: number;
  category: string;
}

export const ContractDeployment = () => {
  const { isConnected, address, sbtcBalance } = useTurnkeyWallet();
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [formData, setFormData] = useState<DeploymentFormData>({
    templateId: '',
    eventName: '',
    eventDescription: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    imageUri: '',
    metadataUri: '',
    totalSupply: 100,
    ticketPrice: 0.001,
    category: 'music'
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    queueId?: number;
  }>({ type: null, message: '' });

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({ ...prev, templateId: template.id }));
  };

  const handleInputChange = (field: keyof DeploymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalCost = () => {
    const deploymentFee = 0.01; // Base deployment fee
    const templateFee = selectedTemplate?.baseFee || 0;
    return deploymentFee + templateFee;
  };

  const handleDeploy = async () => {
    if (!isConnected || !selectedTemplate) return;

    const totalCost = calculateTotalCost();
    if (parseFloat(sbtcBalance) < totalCost) {
      setDeploymentStatus({
        type: 'error',
        message: `Insufficient sBTC balance. Required: ${totalCost} sBTC, Available: ${sbtcBalance} sBTC`
      });
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus({ type: null, message: '' });

    try {
      // In production, this would call the contract factory
      console.log('Deploying contract with data:', {
        template: selectedTemplate.id,
        ...formData,
        deployer: address,
        totalCost
      });

      // Simulate deployment request
      await new Promise(resolve => setTimeout(resolve, 2000));

      const queueId = Math.floor(Math.random() * 10000);

      setDeploymentStatus({
        type: 'success',
        message: `Contract deployment request submitted successfully! Queue ID: ${queueId}`,
        queueId
      });

      // Reset form
      setFormData({
        templateId: '',
        eventName: '',
        eventDescription: '',
        eventDate: '',
        eventTime: '',
        venue: '',
        imageUri: '',
        metadataUri: '',
        totalSupply: 100,
        ticketPrice: 0.001,
        category: 'music'
      });
      setSelectedTemplate(null);

    } catch (error: any) {
      setDeploymentStatus({
        type: 'error',
        message: error.message || 'Deployment request failed'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-white">Deploy Your NFT Ticketing Contract</CardTitle>
          <CardDescription className="text-gray-400">
            Connect your wallet to deploy individual NFT ticketing contracts for your events
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-gray-300">
              Please connect your Turnkey wallet to deploy contracts
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#FE5C02] to-orange-400 bg-clip-text text-transparent mb-2">
          Deploy Your NFT Ticketing Contract
        </h2>
        <p className="text-gray-400">
          Create your own smart contract for event ticketing with customizable parameters
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#0A0A0A] border border-gray-800 p-1">
          <TabsTrigger 
            value="templates"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FE5C02] data-[state=active]:to-orange-500 data-[state=active]:text-white transition-all duration-300"
          >
            Choose Template
          </TabsTrigger>
          <TabsTrigger 
            value="configure" 
            disabled={!selectedTemplate}
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FE5C02] data-[state=active]:to-orange-500 data-[state=active]:text-white disabled:opacity-50 transition-all duration-300"
          >
            Configure Event
          </TabsTrigger>
          <TabsTrigger 
            value="deploy" 
            disabled={!selectedTemplate || !formData.eventName}
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FE5C02] data-[state=active]:to-orange-500 data-[state=active]:text-white disabled:opacity-50 transition-all duration-300"
          >
            Deploy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-6">
          <Card className="bg-[#0A0A0A] border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-white">Select Contract Template</CardTitle>
              <CardDescription className="text-gray-400">
                Choose the template that best fits your event needs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CONTRACT_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer border-2 transition-all duration-300 bg-[#1A1A1A] ${
                      selectedTemplate?.id === template.id
                        ? 'border-[#FE5C02] shadow-lg shadow-[#FE5C02]/20'
                        : 'border-gray-700 hover:border-gray-600 hover:shadow-lg'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-white">{template.name}</CardTitle>
                        <Badge className={
                          template.category === 'basic' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          template.category === 'premium' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 
                          'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }>
                          {template.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-800">
                          <span className="text-sm font-medium text-gray-400">Base Fee:</span>
                          <span className="text-lg font-bold text-[#FE5C02]">
                            {template.baseFee} sBTC
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2 text-white">Features:</p>
                          <ul className="text-xs space-y-1.5">
                            {template.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-gray-400">
                                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure" className="space-y-4 mt-6">
          <Card className="bg-[#0A0A0A] border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-white">Configure Your Event</CardTitle>
              <CardDescription className="text-gray-400">
                Set up your event details and ticket parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventName" className="text-white">Event Name <span className="text-[#FE5C02]">*</span></Label>
                  <Input
                    id="eventName"
                    placeholder="Bitcoin Conference 2025"
                    value={formData.eventName}
                    onChange={(e) => handleInputChange('eventName', e.target.value)}
                    className="bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className="bg-[#1A1A1A] border-gray-700 text-white focus:border-[#FE5C02] focus:ring-[#FE5C02]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-700">
                      <SelectItem value="music" className="text-white hover:bg-[#2A2A2A]">Music</SelectItem>
                      <SelectItem value="conference" className="text-white hover:bg-[#2A2A2A]">Conference</SelectItem>
                      <SelectItem value="sports" className="text-white hover:bg-[#2A2A2A]">Sports</SelectItem>
                      <SelectItem value="arts" className="text-white hover:bg-[#2A2A2A]">Arts</SelectItem>
                      <SelectItem value="festival" className="text-white hover:bg-[#2A2A2A]">Festival</SelectItem>
                      <SelectItem value="other" className="text-white hover:bg-[#2A2A2A]">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDescription" className="text-white">Event Description</Label>
                <Textarea
                  id="eventDescription"
                  placeholder="Describe your event..."
                  rows={3}
                  value={formData.eventDescription}
                  onChange={(e) => handleInputChange('eventDescription', e.target.value)}
                  className="bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate" className="flex items-center gap-1 text-white">
                    <Calendar className="w-4 h-4 text-[#FE5C02]" />
                    Event Date
                  </Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    className="bg-[#1A1A1A] border-gray-700 text-white focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime" className="flex items-center gap-1 text-white">
                    <Clock className="w-4 h-4 text-[#FE5C02]" />
                    Event Time
                  </Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => handleInputChange('eventTime', e.target.value)}
                    className="bg-[#1A1A1A] border-gray-700 text-white focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue" className="flex items-center gap-1 text-white">
                    <MapPin className="w-4 h-4 text-[#FE5C02]" />
                    Venue
                  </Label>
                  <Input
                    id="venue"
                    placeholder="Convention Center"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    className="bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUri" className="flex items-center gap-1 text-white">
                    <Image className="w-4 h-4 text-[#FE5C02]" />
                    Event Image URI
                  </Label>
                  <Input
                    id="imageUri"
                    placeholder="https://example.com/event-image.jpg"
                    value={formData.imageUri}
                    onChange={(e) => handleInputChange('imageUri', e.target.value)}
                    className="bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metadataUri" className="flex items-center gap-1 text-white">
                    <FileText className="w-4 h-4 text-[#FE5C02]" />
                    Metadata URI
                  </Label>
                  <Input
                    id="metadataUri"
                    placeholder="https://example.com/metadata.json"
                    value={formData.metadataUri}
                    onChange={(e) => handleInputChange('metadataUri', e.target.value)}
                    className="bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSupply" className="flex items-center gap-1 text-white">
                    <Users className="w-4 h-4 text-[#FE5C02]" />
                    Total Supply <span className="text-[#FE5C02]">*</span>
                  </Label>
                  <Input
                    id="totalSupply"
                    type="number"
                    min="1"
                    placeholder="1000"
                    value={formData.totalSupply}
                    onChange={(e) => handleInputChange('totalSupply', parseInt(e.target.value) || 0)}
                    className="bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                  />
                  <p className="text-xs text-gray-500">Maximum number of tickets to mint</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice" className="flex items-center gap-1 text-white">
                    <DollarSign className="w-4 h-4 text-[#FE5C02]" />
                    Ticket Price (sBTC) <span className="text-[#FE5C02]">*</span>
                  </Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    step="0.00000001"
                    min="0"
                    placeholder="0.001"
                    value={formData.ticketPrice}
                    onChange={(e) => handleInputChange('ticketPrice', parseFloat(e.target.value) || 0)}
                    className="bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FE5C02] focus:ring-[#FE5C02]"
                  />
                  <p className="text-xs text-gray-500">Price per ticket in sBTC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4 mt-6">
          <Card className="bg-[#0A0A0A] border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-white">Review & Deploy</CardTitle>
              <CardDescription className="text-gray-400">
                Review your configuration and deploy your NFT ticketing contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Deployment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Event Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-[#1A1A1A] rounded border border-gray-800">
                      <strong className="text-gray-400">Name:</strong>
                      <span className="text-white">{formData.eventName}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-[#1A1A1A] rounded border border-gray-800">
                      <strong className="text-gray-400">Category:</strong>
                      <span className="text-white capitalize">{formData.category}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-[#1A1A1A] rounded border border-gray-800">
                      <strong className="text-gray-400">Date:</strong>
                      <span className="text-white">{formData.eventDate} at {formData.eventTime}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-[#1A1A1A] rounded border border-gray-800">
                      <strong className="text-gray-400">Venue:</strong>
                      <span className="text-white">{formData.venue}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-[#1A1A1A] rounded border border-gray-800">
                      <strong className="text-gray-400">Supply:</strong>
                      <span className="text-white">{formData.totalSupply.toLocaleString()} tickets</span>
                    </div>
                    <div className="flex justify-between p-2 bg-[#1A1A1A] rounded border border-gray-800">
                      <strong className="text-gray-400">Price:</strong>
                      <span className="text-white">{formData.ticketPrice} sBTC per ticket</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Cost Breakdown</h3>
                  <div className="space-y-3 p-4 bg-[#1A1A1A] rounded-lg border border-gray-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Platform Fee:</span>
                      <span className="text-white">0.01 sBTC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Template Fee ({selectedTemplate?.name}):</span>
                      <span className="text-white">{selectedTemplate?.baseFee} sBTC</span>
                    </div>
                    <div className="border-t border-gray-700 pt-3 flex justify-between font-bold">
                      <span className="text-white">Total Cost:</span>
                      <span className="text-[#FE5C02] text-lg">{calculateTotalCost()} sBTC</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Your Balance: <span className="text-green-400">{sbtcBalance} sBTC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deploy Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying || parseFloat(sbtcBalance) < calculateTotalCost()}
                  className="bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-[#E54F02] hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-800 px-8 py-3 text-lg shadow-lg hover:shadow-2xl hover:shadow-[#FE5C02]/50 transition-all duration-300 relative overflow-hidden group"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  {isDeploying ? (
                    <div className="flex items-center relative z-10">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Deploying Contract...</span>
                    </div>
                  ) : (
                    <span className="relative z-10">Deploy NFT Contract</span>
                  )}
                </Button>
              </div>

              {/* Status Alert */}
              {deploymentStatus.type && (
                <Alert className={`${
                  deploymentStatus.type === 'error' 
                    ? 'bg-gradient-to-r from-red-500/10 to-red-600/5 border-red-500/50' 
                    : 'bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/50'
                } backdrop-blur-sm`}>
                  {deploymentStatus.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  <AlertDescription className={`${
                    deploymentStatus.type === 'error' ? 'text-red-300' : 'text-green-300'
                  } ml-2`}>
                    {deploymentStatus.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractDeployment;