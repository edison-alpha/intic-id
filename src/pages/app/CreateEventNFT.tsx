import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/app/AppLayout';
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ImageIcon,
  Loader2,
  Upload,
  Check,
  AlertCircle,
  Rocket,
  Info,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTurnkeyWallet } from '@/contexts/TurnkeyWalletContext';
import {
  uploadImageToPinata,
  uploadMetadataToPinata,
  generateTicketMetadata,
  testPinataConnection,
  type NFTMetadata,
} from '@/services/pinataService';
import { searchVenues, type VenueLocation } from '@/services/openstreetmap';

interface FormData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  venueAddress: string;
  category: string;
  description: string;
  ticketType: string;
  ticketPrice: string;
  totalSupply: string;
  royaltyPercentage: string;
}

const CreateEventNFT = () => {
  const { isConnected, address, publicKey, stxBalance, connectWallet, deployNFTContract } = useTurnkeyWallet();
  const [step, setStep] = useState<'form' | 'upload' | 'deploy'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    eventName: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    venueAddress: '',
    category: 'concert',
    description: '',
    ticketType: 'General Admission',
    ticketPrice: '0.1',
    totalSupply: '100',
    royaltyPercentage: '5',
  });

  // Image & Metadata
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageIpfsUrl, setImageIpfsUrl] = useState<string | null>(null);
  const [metadataIpfsUrl, setMetadataIpfsUrl] = useState<string | null>(null);
  const [metadataCid, setMetadataCid] = useState<string | null>(null);
  const [deployedTxId, setDeployedTxId] = useState<string | null>(null);

  // Venue search
  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<VenueLocation[]>([]);
  const [isSearchingVenue, setIsSearchingVenue] = useState(false);
  const [showVenueResults, setShowVenueResults] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<VenueLocation | null>(null);

  // Debounced venue search
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (venueQuery.length >= 3) {
        setIsSearchingVenue(true);
        try {
          const results = await searchVenues(venueQuery);
          setVenueResults(results);
          setShowVenueResults(true);
        } catch (error) {
          console.error('Error searching venues:', error);
        } finally {
          setIsSearchingVenue(false);
        }
      } else {
        setVenueResults([]);
        setShowVenueResults(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [venueQuery]);

  const handleVenueSelect = (venue: VenueLocation) => {
    setSelectedVenue(venue);
    setFormData((prev) => ({
      ...prev,
      venue: venue.name,
      venueAddress: venue.address,
    }));
    setVenueQuery(venue.name);
    setShowVenueResults(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    if (!formData.eventName.trim()) {
      toast.error('Event name is required');
      return false;
    }
    if (!formData.eventDate) {
      toast.error('Event date is required');
      return false;
    }
    if (!formData.venue.trim()) {
      toast.error('Venue is required');
      return false;
    }
    if (!formData.ticketPrice || parseFloat(formData.ticketPrice) <= 0) {
      toast.error('Valid ticket price is required');
      return false;
    }
    if (!formData.totalSupply || parseInt(formData.totalSupply) <= 0) {
      toast.error('Valid total supply is required');
      return false;
    }
    if (!selectedImage) {
      toast.error('Event image is required');
      return false;
    }
    return true;
  };

  const handleUploadToIPFS = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setStep('upload');

    try {
      // Test Pinata connection
      toast.loading('Testing Pinata connection...');
      const isConnected = await testPinataConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to Pinata');
      }
      toast.dismiss();

      // Upload image
      toast.loading('Uploading image to IPFS...');
      const imageUrl = await uploadImageToPinata(selectedImage!);
      setImageIpfsUrl(imageUrl);
      toast.dismiss();
      toast.success('Image uploaded to IPFS!');

      // Generate metadata
      const metadata = generateTicketMetadata(
        {
          eventName: formData.eventName,
          eventDate: `${formData.eventDate} ${formData.eventTime}`,
          venue: formData.venue,
          description: formData.description,
          ticketType: formData.ticketType,
          category: formData.category,
          price: formData.ticketPrice,
          totalSupply: parseInt(formData.totalSupply),
        },
        imageUrl
      );

      // Upload metadata
      toast.loading('Uploading metadata to IPFS...');
      const { ipfsUrl, cid } = await uploadMetadataToPinata(metadata);
      setMetadataIpfsUrl(ipfsUrl);
      setMetadataCid(cid);
      toast.dismiss();
      toast.success('Metadata uploaded to IPFS!');

      console.log('✅ Upload complete:', {
        imageUrl,
        metadataUrl: ipfsUrl,
        cid,
      });

      setStep('deploy');
    } catch (error: any) {
      console.error('Error uploading to IPFS:', error);
      toast.error(error.message || 'Failed to upload to IPFS');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployContract = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      connectWallet();
      return;
    }

    if (!metadataCid || !address) {
      toast.error('Missing required data for deployment');
      return;
    }

    // Check user's STX balance
    const requiredSTX = 0.25; // 0.25 STX for deployment
    if (parseFloat(stxBalance) < requiredSTX) {
      toast.error(
        `Insufficient STX balance. Required: ${requiredSTX} STX, Available: ${stxBalance} STX. Please fund your wallet from testnet faucet.`
      );
      return;
    }

    setIsLoading(true);

    try {
      toast.loading('Deploying NFT contract with your Turnkey wallet...');

      console.log('🚀 Deploying contract with USER\'S Turnkey wallet');
      console.log('   User address:', address);
      console.log('   User STX balance:', stxBalance, 'STX');
      console.log('   User will pay for deployment:', requiredSTX, 'STX');

      // Deploy using user's Turnkey wallet
      const result = await deployNFTContract(
        formData.eventName,
        parseFloat(formData.royaltyPercentage)
      );

      if (!result) {
        throw new Error('Deployment failed');
      }

      // Get txId from localStorage (stored by deployNFTContract)
      const deployments = JSON.parse(localStorage.getItem('nft_deployments') || '[]');
      const latestDeployment = deployments[deployments.length - 1];

      if (latestDeployment && latestDeployment.txId) {
        setDeployedTxId(latestDeployment.txId);
      }

      toast.dismiss();
      toast.success('NFT Contract deployed successfully! 🎉');

      console.log('✅ Deployment complete!');
      console.log('💡 Contract deployed by USER\'s Turnkey wallet - user OWNS the contract fully');
    } catch (error: any) {
      console.error('❌ Error deploying contract:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to deploy contract');
    } finally {
      setIsLoading(false);
    }
  };

  // Render different steps
  if (!isConnected) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Please connect your wallet to create and deploy NFT tickets
            </p>
            <button
              onClick={connectWallet}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create NFT Event Tickets</h1>
          <p className="text-gray-400">
            Upload your event details and deploy NFT tickets to Stacks Testnet
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 'form' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Info className="w-4 h-4" />
            <span className="font-medium">1. Event Details</span>
          </div>
          <div className="w-8 h-px bg-gray-700" />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 'upload' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">2. Upload to IPFS</span>
          </div>
          <div className="w-8 h-px bg-gray-700" />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 'deploy' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span className="font-medium">3. Deploy Contract</span>
          </div>
        </div>

        {/* Form Content */}
        {step === 'form' && (
          <div className="bg-[#1A1A1A] rounded-xl p-6 space-y-6">
            {/* Event Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Image *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-gray-700 rounded-lg p-8 hover:border-primary transition-colors cursor-pointer group"
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p>Click to change image</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 mb-1">Click to upload event image</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="e.g., Summer Music Festival 2025"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Time
                </label>
                <input
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Venue Search with OpenStreetMap */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Venue * (Search using OpenStreetMap)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={venueQuery}
                  onChange={(e) => setVenueQuery(e.target.value)}
                  placeholder="Search for venue (e.g., Madison Square Garden)"
                  className="w-full pl-11 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  required
                />
                {venueQuery && (
                  <button
                    onClick={() => {
                      setVenueQuery('');
                      setShowVenueResults(false);
                      setSelectedVenue(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {isSearchingVenue && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}

                {/* Search Results Dropdown */}
                {showVenueResults && venueResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {venueResults.map((venue) => (
                      <button
                        key={venue.placeId}
                        onClick={() => handleVenueSelect(venue)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{venue.name}</p>
                            <p className="text-sm text-gray-400 line-clamp-2">{venue.address}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Venue Display */}
              {selectedVenue && (
                <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{selectedVenue.name}</p>
                      <p className="text-sm text-gray-400">{selectedVenue.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates: {parseFloat(selectedVenue.lat).toFixed(6)}, {parseFloat(selectedVenue.lon).toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Venue Address (Read-only, auto-filled from search) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Venue Address (Auto-filled from search)
              </label>
              <input
                type="text"
                name="venueAddress"
                value={formData.venueAddress}
                onChange={handleChange}
                placeholder="Select venue from search above"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                readOnly={!!selectedVenue}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="concert">Concert</option>
                <option value="festival">Festival</option>
                <option value="conference">Conference</option>
                <option value="sports">Sports</option>
                <option value="theater">Theater</option>
                <option value="comedy">Comedy</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Ticket Details */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ticket Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ticket Type
                  </label>
                  <input
                    type="text"
                    name="ticketType"
                    value={formData.ticketType}
                    onChange={handleChange}
                    placeholder="e.g., General Admission"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (STX) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="ticketPrice"
                      value={formData.ticketPrice}
                      onChange={handleChange}
                      placeholder="0.1"
                      step="0.01"
                      min="0"
                      className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Supply *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="totalSupply"
                      value={formData.totalSupply}
                      onChange={handleChange}
                      placeholder="100"
                      min="1"
                      className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Royalty Percentage
                </label>
                <input
                  type="number"
                  name="royaltyPercentage"
                  value={formData.royaltyPercentage}
                  onChange={handleChange}
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Percentage of secondary sales you'll receive
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleUploadToIPFS}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload to IPFS & Continue
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="bg-[#1A1A1A] rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Uploading to IPFS</h3>
            <p className="text-gray-400">
              Please wait while we upload your image and metadata to IPFS via Pinata...
            </p>
          </div>
        )}

        {/* Deploy Step */}
        {step === 'deploy' && (
          <div className="space-y-6">
            {/* IPFS Success Card */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Successfully Uploaded to IPFS!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Image: </span>
                      <a
                        href={imageIpfsUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {imageIpfsUrl?.substring(0, 50)}...
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-400">Metadata CID: </span>
                      <code className="text-green-400">{metadataCid}</code>
                    </div>
                    <div>
                      <span className="text-gray-400">Metadata URL: </span>
                      <a
                        href={metadataIpfsUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View on IPFS
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deploy Contract Card */}
            <div className="bg-[#1A1A1A] rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Deploy NFT Contract</h3>
              <p className="text-gray-400 mb-4">
                Ready to deploy your NFT ticket contract to Stacks Testnet. This will create a
                smart contract that manages your event tickets.
              </p>

              {/* Balance Info */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Your STX Balance:</span>
                  <span className="text-white font-semibold">{stxBalance} STX</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Deployment Cost:</span>
                  <span className="text-white font-semibold">0.25 STX</span>
                </div>
                <div className="pt-2 mt-2 border-t border-blue-500/20">
                  {parseFloat(stxBalance) >= 0.25 ? (
                    <p className="text-sm text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Sufficient balance. Your wallet will pay for deployment.
                    </p>
                  ) : (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Insufficient balance. Get testnet STX from faucet.
                    </p>
                  )}
                </div>
              </div>

              {deployedTxId ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">Contract Deployed!</p>
                      <p className="text-sm text-gray-400 mb-2">
                        Transaction ID: <code className="text-green-400">{deployedTxId}</code>
                      </p>
                      <a
                        href={`https://explorer.hiro.so/txid/${deployedTxId}?chain=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View on Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleDeployContract}
                  disabled={isLoading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deploying Contract...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      Deploy to Stacks Testnet
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400">
                  <p>
                    <strong className="text-white">Note:</strong> Deployment may take a few minutes
                    to complete on the Stacks blockchain. You can track the transaction using the
                    explorer link above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CreateEventNFT;
