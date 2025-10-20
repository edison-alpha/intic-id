import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnectModal } from '@/components/WalletConnectModal';
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
  Settings,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadImageToPinata,
  uploadMetadataToPinata,
  generateTicketMetadata,
  testPinataConnection,
} from '@/services/pinataService';
import { searchVenues, type VenueLocation } from '@/services/openstreetmap';
import { indexAllContractsByAddress } from '@/services/hiroIndexer';
import { getNFTTicketData } from '@/services/nftIndexer';
import { timestampToBlockHeight } from '@/services/eventRegistryService';
import { getRegistryContract, DEPLOYMENT_COSTS } from '@/config/contracts';
import {
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
} from '@stacks/transactions';

// Import logos
import stxLogo from '@/assets/stx.jpg';
import sbtcLogo from '@/assets/sbtc.png';

interface FormData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  venueAddress: string;
  category: string;
  description: string;
  ticketType: string;
  pricingMode: 'fixed' | 'usd-dynamic';
  ticketPrice: string;
  currency: 'STX' | 'sBTC';
  totalSupply: string;
  royaltyPercentage: string;
}

const useCryptoPrice = (currency: 'STX' | 'sBTC') => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      setError(null);

      try {
        // Using CoinGecko API to get cryptocurrency prices
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${currency === 'STX' ? 'blockstack' : 'bitcoin'}&vs_currencies=usd`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch price data');
        }

        const data = await response.json();
        const currencyId = currency === 'STX' ? 'blockstack' : 'bitcoin';
        const priceValue = data[currencyId]?.usd;

        if (priceValue !== undefined) {
          setPrice(parseFloat(priceValue));
        } else {
          setError('Price data not available');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Fetch price immediately and then every 30 seconds
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [currency]);

  return { price, loading, error };
};

const CreateEventNFT = () => {
  const [step, setStep] = useState<'form' | 'upload' | 'deploy'>('form');
  const { wallet, isWalletConnected, connectWallet, deployContract, getBalance, callContractFunction } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-step deployment state management
  const [deploymentStep, setDeploymentStep] = useState<'idle' | 'deploying' | 'registering' | 'success' | 'error'>('idle');
  const [registrationTxId, setRegistrationTxId] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Wallet integration with Turnkey
  const address = wallet?.address || '';
  const [stxBalance, setStxBalance] = useState('0');

  useEffect(() => {
    const fetchBalance = async () => {
      if (isWalletConnected) {
        const balance = await getBalance();
        setStxBalance(balance.toString());
      }
    };
    fetchBalance();
  }, [isWalletConnected, getBalance]);

  const openWalletModal = () => setShowWalletModal(true);

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Form data
  const [formData, setFormData] = useState<FormData>({
    eventName: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    venueAddress: '',
    category: 'concert',
    description: '',
    ticketType: 'Regular',
    pricingMode: 'fixed',
    ticketPrice: '0.1',
    currency: 'STX',
    totalSupply: '100',
    royaltyPercentage: '5',
  });

  // Price preview
  const { price: cryptoPrice, loading: priceLoading, error: priceError } = useCryptoPrice(formData.currency);

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

  // Event name validation state
  const [eventNameWarning, setEventNameWarning] = useState<string | null>(null);

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

    // ✅ Real-time validation for event name uppercase
    if (name === 'eventName') {
      if (value.length > 3) {
        const uppercaseCount = (value.match(/[A-Z]/g) || []).length;
        const letterCount = (value.match(/[A-Za-z]/g) || []).length;
        const hasConsecutiveUppercase = /[A-Z]{4,}/.test(value);

        if (letterCount > 0) {
          const uppercasePercentage = (uppercaseCount / letterCount) * 100;

          if (uppercasePercentage > 50 || hasConsecutiveUppercase) {
            setEventNameWarning(
              'Too many uppercase letters detected. Use Title Case to prevent deployment errors.'
            );
          } else {
            setEventNameWarning(null);
          }
        } else {
          setEventNameWarning(null);
        }
      } else {
        setEventNameWarning(null);
      }
    }
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

    // ✅ NEW: Validate for invalid characters that could break contract deployment
    const invalidCharsRegex = /[^\x00-\x7F]/g; // Non-ASCII characters (emojis, special chars)
    if (invalidCharsRegex.test(formData.eventName)) {
      toast.error('Event name contains invalid characters. Please use only letters, numbers, and basic punctuation (no emojis or special symbols).');
      return false;
    }

    // ✅ CRITICAL: Detect excessive uppercase letters (causes blockchain broadcast errors)
    const uppercaseCount = (formData.eventName.match(/[A-Z]/g) || []).length;
    const letterCount = (formData.eventName.match(/[A-Za-z]/g) || []).length;
    const uppercasePercentage = letterCount > 0 ? (uppercaseCount / letterCount) * 100 : 0;

    // Check for consecutive uppercase words (e.g., "ALL-STARS", "ALL STARS")
    const hasConsecutiveUppercase = /[A-Z]{4,}/.test(formData.eventName); // 4+ uppercase in a row

    if (uppercasePercentage > 50 || hasConsecutiveUppercase) {
      toast.error(
        'Event name has too many uppercase letters. Please use Title Case (e.g., "Summer Music Festival" instead of "SUMMER MUSIC FESTIVAL"). ' +
        'Excessive uppercase causes blockchain deployment errors.',
        { duration: 8000 }
      );
      return false;
    }

    if (formData.description && invalidCharsRegex.test(formData.description)) {
      toast.error('Description contains invalid characters. Please use only letters, numbers, and basic punctuation (no emojis or special symbols).');
      return false;
    }

    if (formData.venue && invalidCharsRegex.test(formData.venue)) {
      toast.error('Venue name contains invalid characters. Please use only letters, numbers, and basic punctuation.');
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
      // Test Pinata connection (silent check)
      const isConnected = await testPinataConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to storage service');
      }

      // Upload image (background process)
      const imageUrl = await uploadImageToPinata(selectedImage!);
      setImageIpfsUrl(imageUrl); // Save IPFS image URL

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

      // Upload metadata (background process)
      const { ipfsUrl, cid } = await uploadMetadataToPinata(metadata);
      setMetadataIpfsUrl(ipfsUrl);
      setMetadataCid(cid);

      // Fetch metadata JSON from IPFS and populate preview/form fields
      try {
        const { fetchIPFSMetadata } = await import('@/services/nftIndexer');
        const meta = await fetchIPFSMetadata(ipfsUrl);
        if (meta) {
          // Use image from metadata
          if (meta.image) {
            setImagePreview(meta.image);
          }

          // Populate form fields if available in properties or attributes
          const props = meta.properties || {};
          const attrs = meta.attributes || [];

          const eventName = meta.name || props.event_name || attrs.find((a: any) => a.trait_type === 'Event Name')?.value;
          const eventDate = props.event_date || meta.event_date || attrs.find((a: any) => a.trait_type === 'Event Date')?.value;
          const venue = props.venue || meta.venue || attrs.find((a: any) => a.trait_type === 'Venue')?.value;
          const price = props.price || attrs.find((a: any) => a.trait_type === 'Price')?.value;
          const totalSupply = props.total_supply || attrs.find((a: any) => a.trait_type === 'Total Supply')?.value;

          setFormData(prev => ({
            ...prev,
            eventName: eventName || prev.eventName,
            eventDate: eventDate ? eventDate.split(' ')[0] : prev.eventDate,
            eventTime: eventDate ? eventDate.split(' ')[1] || prev.eventTime : prev.eventTime,
            venue: venue || prev.venue,
            ticketPrice: price ? String(price).replace(/ STX$/, '') : prev.ticketPrice,
            totalSupply: totalSupply ? String(totalSupply) : prev.totalSupply,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch metadata from IPFS to prefill form:', err);
      }

      // Show single success message
      toast.success('Event prepared successfully!');
      setStep('deploy');
    } catch (error: any) {
      console.error('Error preparing event:', error);
      toast.error(error.message || 'Failed to prepare event. Please try again.');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployContract = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet first');
      openWalletModal();
      return;
    }

    if (!metadataCid || !address) {
      toast.error('Missing required data for deployment');
      return;
    }

    // Check user's STX balance
    const requiredSTX = DEPLOYMENT_COSTS.eventContract + DEPLOYMENT_COSTS.registryFee; // 0.25 + 0.01 STX
    if (parseFloat(stxBalance) < requiredSTX) {
      toast.error(
        `Insufficient STX balance. Required: ${requiredSTX.toFixed(2)} STX (${DEPLOYMENT_COSTS.eventContract} deploy + ${DEPLOYMENT_COSTS.registryFee} registry), Available: ${stxBalance} STX. Please fund your wallet from testnet faucet.`
      );
      return;
    }

    setIsLoading(true);
    setDeploymentStep('deploying');

    try {
      console.log('📝 Step 1/2: Deploying your NFT contract to the blockchain...');

      // Generate contract name FIRST (before using it in template)
      // ✅ IMPROVED: More aggressive sanitization to ensure blockchain compatibility
      const sanitizedName = formData.eventName
        .normalize('NFD') // Normalize unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
        .replace(/[^\x00-\x7F]/g, '') // Remove ALL non-ASCII (emojis, special unicode)
        .replace(/[^a-zA-Z0-9\s\-]/g, '') // ✅ FIXED: Properly escaped hyphen - keep letters/numbers/spaces/hyphens only
        .trim() // Remove leading/trailing spaces
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .toLowerCase()
        .substring(0, 40); // Limit length

      if (!sanitizedName || sanitizedName.length < 3) {
        throw new Error('Event name is too short or contains only invalid characters. Please use at least 3 letters or numbers.');
      }

      const nftName = sanitizedName.replace(/-/g, ''); // NFT name without hyphens for Clarity
      const contractName = `${sanitizedName}-${Date.now()}`;

      // Validate contract name
      if (contractName.length > 128) {
        throw new Error('Contract name too long (max 128 characters)');
      }

      // Calculate price in smallest unit (microSTX or satoshis)
      const priceInSmallestUnit = formData.currency === 'STX'
        ? Math.floor(parseFloat(formData.ticketPrice) * 1000000) // Convert STX to microSTX
        : Math.floor(parseFloat(formData.ticketPrice) * 100000000); // Convert sBTC to satoshis

      // sBTC support planned for mainnet - currently using STX

      // Pyth oracle contracts v3 (Testnet)
      // Reference: https://docs.hiro.so/resources/clarity/external-data
      const pythOracleContract = 'ST3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-oracle-v3';
      const pythStorageContract = 'ST3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-storage-v3';
      const pythDecoderContract = 'ST3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.pyth-pnau-decoder-v2';
      const wormholeCoreContract = 'ST3R4F6C1J3JQWWCVZ3S7FRRYPMYG6ZW6RZK31FXY.wormhole-core-v3';

      // Price feed IDs (same for testnet and mainnet)
      const btcUsdFeedId = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
      const stxUsdFeedId = '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17';

      // ✅ CRITICAL: Sanitize ALL string inputs for Clarity contract
      const sanitizeForClarity = (str: string, maxLength: number = 256): string => {
        if (!str) return '';
        return str
          .normalize('NFD') // Normalize unicode
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII (emojis)
          .replace(/"/g, '\\"') // Escape quotes
          .replace(/\\/g, '\\\\') // Escape backslashes
          .substring(0, maxLength)
          .trim();
      };

      const safeEventName = sanitizeForClarity(formData.eventName, 100);
      const safeVenue = sanitizeForClarity(formData.venue, 100);
      const safeVenueAddress = sanitizeForClarity(formData.venueAddress, 200);
      const safeDescription = sanitizeForClarity(formData.description, 500);
      const safeCategory = sanitizeForClarity(formData.category, 50);

      const contractCode = `
;; ${safeEventName} - NFT Ticket Contract
;; Generated by intic.id
;; Implements SIP-009 NFT Standard
;; Payment Currency: ${formData.currency} (currently STX only)
;; Pricing Mode: ${formData.pricingMode === 'fixed' ? 'Fixed Price' : 'Dynamic USD (Pyth Oracle)'}

${formData.currency === 'sBTC' ? `;; sBTC support planned for mainnet` : ''}

;; Define NFT
(define-non-fungible-token ${nftName}-ticket uint)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-sold-out (err u102))
(define-constant err-invalid-token (err u103))
(define-constant err-ticket-used (err u104))
(define-constant err-event-cancelled (err u105))
(define-constant err-insufficient-payment (err u106))
(define-constant err-transfer-failed (err u107))
(define-constant err-price-too-old (err u108))

;; Event Registry Integration (Auto-register to discovery platform)
;; TODO: Update with actual deployed registry contract address
;; (define-constant event-registry-contract 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.event-registry)
(define-constant registry-enabled false) ;; Will be enabled after registry deployment

;; Event configuration - IMMUTABLE (Financial terms for fairness)
(define-constant total-supply u${formData.totalSupply})
${formData.pricingMode === 'fixed'
  ? `(define-constant ticket-price u${priceInSmallestUnit})`
  : `(define-constant ticket-price-usd u${Math.floor(parseFloat(formData.ticketPrice) * 100000000)}) ;; Price in USD with 8 decimals`
}
(define-constant royalty-percent u${Math.floor(parseFloat(formData.royaltyPercentage) * 100)})
(define-constant payment-currency "${formData.currency}")
(define-constant pricing-mode "${formData.pricingMode}")

;; Event details - MUTABLE (Can be updated by owner)
(define-data-var event-date uint u${new Date(formData.eventDate).getTime()})
(define-data-var token-uri (string-ascii 256) "${metadataIpfsUrl || 'ipfs://placeholder'}")
(define-data-var event-image-uri (string-ascii 256) "${imageIpfsUrl || 'ipfs://placeholder'}")
(define-data-var event-name (string-ascii 256) "${safeEventName}")
(define-data-var event-venue (string-ascii 256) "${safeVenue}")
(define-data-var venue-address (string-ascii 512) "${safeVenueAddress}")
(define-data-var venue-coordinates (string-ascii 64) "${selectedVenue?.lat && selectedVenue?.lon ? `${selectedVenue.lat},${selectedVenue.lon}` : '0,0'}")

${formData.currency === 'sBTC' ? `;; sBTC support planned for mainnet - using STX for now` : ''}

${formData.pricingMode === 'usd-dynamic' ? `;; Pyth Oracle Contracts v3 (Testnet)
(define-constant pyth-oracle-contract '${pythOracleContract})
(define-constant pyth-storage-contract '${pythStorageContract})
(define-constant pyth-decoder-contract '${pythDecoderContract})
(define-constant wormhole-core-contract '${wormholeCoreContract})
(define-constant ${formData.currency === 'STX' ? 'stx' : 'btc'}-usd-feed-id ${formData.currency === 'STX' ? stxUsdFeedId : btcUsdFeedId})
(define-constant price-staleness-threshold u300) ;; 5 minutes in seconds` : ''}

;; Data variables
(define-data-var next-token-id uint u1)
(define-data-var event-cancelled bool false)
(define-data-var base-uri (string-ascii 256) "${metadataIpfsUrl?.split('/').slice(0, -1).join('/') || 'ipfs://placeholder'}")

;; Data maps
(define-map ticket-used uint bool)
(define-map ticket-metadata uint (string-ascii 256))

;; SIP-009 Standard Functions

;; Get last token ID
(define-read-only (get-last-token-id)
  (ok (- (var-get next-token-id) u1))
)

;; Get token URI
(define-read-only (get-token-uri (token-id uint))
  (ok (some (concat (var-get base-uri) "/{id}.json")))
)

;; Get owner
(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? ${nftName}-ticket token-id))
)

;; Transfer function (SIP-009)
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (asserts! (is-eq sender (unwrap! (nft-get-owner? ${nftName}-ticket token-id) err-invalid-token)) err-not-token-owner)
    (try! (nft-transfer? ${nftName}-ticket token-id sender recipient))
    (ok true)
  )
)

${formData.pricingMode === 'usd-dynamic' ? `;; Helper function to get current price from Pyth oracle v3
(define-read-only (get-current-crypto-usd-price)
  (let
    (
      (price-data (unwrap! (contract-call? pyth-oracle-contract get-price ${formData.currency === 'STX' ? 'stx' : 'btc'}-usd-feed-id pyth-storage-contract) (err err-price-too-old)))
      (price (get price price-data))
      (expo (get expo price-data))
      (publish-time (get publish-time price-data))
    )
    ;; Return price data
    (ok {
      price: price,
      expo: expo,
      publish-time: publish-time
    })
  )
)

;; Calculate required payment amount based on USD price
(define-read-only (calculate-payment-amount)
  (let
    (
      (oracle-price (unwrap! (get-current-crypto-usd-price) (err err-price-too-old)))
      (crypto-price (get price oracle-price))
      (expo (get expo oracle-price))
    )
    ;; ticket-price-usd is in 8 decimals (e.g., $10.00 = 1000000000)
    ;; crypto-price is from oracle with expo (e.g., $1.50 with expo -8 = 150000000)
    ;; Calculate: (ticket-price-usd * 10^8) / crypto-price
    (ok (/ (* ticket-price-usd u100000000) (to-uint crypto-price)))
  )
)` : ''}

;; Mint ticket (buy ticket)
${formData.pricingMode === 'fixed'
  ? `(define-public (mint-ticket)
  (let
    (
      (token-id (var-get next-token-id))
    )
    ;; Check if sold out
    (asserts! (<= token-id total-supply) err-sold-out)

    ;; Check if event is cancelled
    (asserts! (not (var-get event-cancelled)) err-event-cancelled)

    ;; Transfer payment to owner (currently STX only) - skip if owner is minting
    (if (not (is-eq tx-sender contract-owner))
      (try! (stx-transfer? ticket-price tx-sender contract-owner))
      true
    )

    ;; Mint NFT to buyer
    (try! (nft-mint? ${nftName}-ticket token-id tx-sender))

    ;; Increment token ID
    (var-set next-token-id (+ token-id u1))

    ;; Initialize ticket as not used
    (map-set ticket-used token-id false)

    (ok token-id)
  )
)`
  : `(define-public (mint-ticket)
  (let
    (
      (token-id (var-get next-token-id))
      (payment-amount (unwrap! (calculate-payment-amount) err-insufficient-payment))
    )
    ;; Check if sold out
    (asserts! (<= token-id total-supply) err-sold-out)

    ;; Check if event is cancelled
    (asserts! (not (var-get event-cancelled)) err-event-cancelled)

    ;; Transfer dynamic payment amount (currently STX only) - skip if owner is minting
    (if (not (is-eq tx-sender contract-owner))
      (try! (stx-transfer? payment-amount tx-sender contract-owner))
      true
    )

    ;; Mint NFT to buyer
    (try! (nft-mint? ${nftName}-ticket token-id tx-sender))

    ;; Increment token ID
    (var-set next-token-id (+ token-id u1))

    ;; Initialize ticket as not used
    (map-set ticket-used token-id false)

    (ok token-id)
  )
)`
}

;; Transfer with royalty
(define-public (transfer-with-royalty (token-id uint) (sender principal) (recipient principal) (price uint))
  (let
    (
      (royalty-amount (/ (* price royalty-percent) u10000))
    )
    ;; Validate sender
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (asserts! (is-eq sender (unwrap! (nft-get-owner? ${nftName}-ticket token-id) err-invalid-token)) err-not-token-owner)

    ;; Transfer royalty to contract owner based on currency
    ${formData.currency === 'STX'
      ? `(try! (stx-transfer? royalty-amount recipient contract-owner))`
      : `(try! (contract-call? sbtc-contract transfer royalty-amount recipient contract-owner none))`
    }

    ;; Transfer NFT
    (try! (nft-transfer? ${nftName}-ticket token-id sender recipient))

    (ok true)
  )
)

;; Validate/Use ticket (only owner can mark as used)
(define-public (use-ticket (token-id uint))
  (let
    (
      (owner (unwrap! (nft-get-owner? ${nftName}-ticket token-id) err-invalid-token))
    )
    ;; Only contract owner (event organizer) can validate tickets
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)

    ;; Check ticket hasn't been used
    (asserts! (not (default-to false (map-get? ticket-used token-id))) err-ticket-used)

    ;; Mark ticket as used
    (map-set ticket-used token-id true)

    (ok true)
  )
)

;; Cancel event and enable refunds
(define-public (cancel-event)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set event-cancelled true)
    (ok true)
  )
)

;; Refund ticket (if event is cancelled)
(define-public (refund-ticket (token-id uint))
  (let
    (
      (owner (unwrap! (nft-get-owner? ${nftName}-ticket token-id) err-invalid-token))
    )
    ;; Check event is cancelled
    (asserts! (var-get event-cancelled) err-event-cancelled)

    ;; Check caller is owner
    (asserts! (is-eq tx-sender owner) err-not-token-owner)

    ;; Burn NFT
    (try! (nft-burn? ${nftName}-ticket token-id owner))

    ;; Refund payment based on currency
    ${formData.currency === 'STX'
      ? `(try! (as-contract (stx-transfer? ticket-price tx-sender owner)))`
      : `(try! (as-contract (contract-call? sbtc-contract transfer ticket-price tx-sender owner none)))`
    }

    (ok true)
  )
)

;; Read-only functions

(define-read-only (is-ticket-used (token-id uint))
  (ok (default-to false (map-get? ticket-used token-id)))
)

(define-read-only (is-event-cancelled)
  (ok (var-get event-cancelled))
)

(define-read-only (get-ticket-price)
  ${formData.pricingMode === 'fixed'
    ? `(ok ticket-price)`
    : `(calculate-payment-amount)`
  }
)

${formData.pricingMode === 'usd-dynamic' ? `(define-read-only (get-ticket-price-usd)
  (ok ticket-price-usd)
)` : ''}

(define-read-only (get-total-supply)
  (ok total-supply)
)

(define-read-only (get-tickets-remaining)
  (ok (- total-supply (- (var-get next-token-id) u1)))
)

(define-read-only (get-event-info)
  (ok {
    price: ticket-price,
    total-supply: total-supply,
    sold: (- (var-get next-token-id) u1),
    remaining: (- total-supply (- (var-get next-token-id) u1)),
    cancelled: (var-get event-cancelled),
    event-date: (var-get event-date),
    royalty-percent: royalty-percent
  })
)

(define-read-only (get-event-details)
  (ok {
    name: (var-get event-name),
    venue: (var-get event-venue),
    venue-address: (var-get venue-address),
    venue-coordinates: (var-get venue-coordinates),
    image-uri: (var-get event-image-uri),
    metadata-uri: (var-get token-uri),
    event-date: (var-get event-date),
    total-supply: total-supply,
    tickets-sold: (- (var-get next-token-id) u1),
    tickets-remaining: (- total-supply (- (var-get next-token-id) u1)),
    price: ticket-price,
    payment-currency: payment-currency,
    pricing-mode: pricing-mode,
    cancelled: (var-get event-cancelled)
  })
)

;; Owner update functions - Only contract owner can update event details

;; Update event name (fix typos, rebrand, etc)
(define-public (update-event-name (new-name (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set event-name new-name)
    (ok true)
  )
)

;; Update event venue and location details
(define-public (update-venue-details
  (new-venue (string-ascii 256))
  (new-address (string-ascii 512))
  (new-coordinates (string-ascii 64))
)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set event-venue new-venue)
    (var-set venue-address new-address)
    (var-set venue-coordinates new-coordinates)
    (ok true)
  )
)

;; Update event image URI (new poster, corrections, etc)
(define-public (update-event-image (new-image-uri (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set event-image-uri new-image-uri)
    (ok true)
  )
)

;; Update event date (reschedule)
(define-public (update-event-date (new-date uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    ;; Optional: Can only reschedule to future date
    ;; (asserts! (> new-date block-height) (err u109))
    (var-set event-date new-date)
    (ok true)
  )
)

;; Update metadata URI (for metadata corrections)
(define-public (update-metadata-uri (new-uri (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set token-uri new-uri)
    (ok true)
  )
)

;; Batch update for efficiency - Update all event details at once
(define-public (update-all-event-details
  (new-name (string-ascii 256))
  (new-venue (string-ascii 256))
  (new-address (string-ascii 512))
  (new-coordinates (string-ascii 64))
  (new-image-uri (string-ascii 256))
  (new-date uint)
)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set event-name new-name)
    (var-set event-venue new-venue)
    (var-set venue-address new-address)
    (var-set venue-coordinates new-coordinates)
    (var-set event-image-uri new-image-uri)
    (var-set event-date new-date)
    (ok true)
  )
)

;; =============================================================================
;; AUTO-REGISTER TO EVENT REGISTRY (DISCOVERY PLATFORM)
;; =============================================================================

;; Register to event registry for discoverability (like OpenSea collection)
;; This function can be called by contract owner after deployment
;; TODO: Will be auto-called in constructor when registry is deployed
(define-public (register-to-platform)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    ;; Auto-register to event registry when enabled
    ;; (try! (contract-call? event-registry-contract register-event
    ;;   (as-contract tx-sender)              ;; contract-address
    ;;   "${contractName}"                     ;; contract-name
    ;;   (var-get event-name)                 ;; event-name
    ;;   "${safeDescription}" ;; description
    ;;   "${safeCategory}"               ;; category
    ;;   (var-get event-venue)                ;; venue
    ;;   (var-get venue-address)              ;; venue-address
    ;;   (var-get venue-coordinates)          ;; venue-coordinates
    ;;   (var-get event-date)                 ;; event-date
    ;;   ticket-price                         ;; ticket-price
    ;;   total-supply                         ;; total-supply
    ;;   (var-get event-image-uri)            ;; image-uri
    ;;   (var-get token-uri)                  ;; metadata-uri
    ;; ))
    
    ;; Placeholder - registry integration coming soon
    (ok true)
  )
)

;; Helper: Get full event data for registry
(define-read-only (get-registry-data)
  (ok {
    contract-name: "${contractName}",
    event-name: (var-get event-name),
    description: "${safeDescription}",
    category: "${safeCategory}",
    venue: (var-get event-venue),
    venue-address: (var-get venue-address),
    venue-coordinates: (var-get venue-coordinates),
    event-date: (var-get event-date),
    ticket-price: ticket-price,
    total-supply: total-supply,
    image-uri: (var-get event-image-uri),
    metadata-uri: (var-get token-uri)
  })
)
`.trim();

      // Log contract details
      console.log('📝 Contract details:');
      console.log('- Name:', contractName);
      console.log('- Code length:', contractCode.length, 'bytes');
      console.log('- First 200 chars:', contractCode.substring(0, 200));
      
      // Validate contract code
      if (contractCode.length > 100000) {
        throw new Error('Contract code too large (max ~100KB)');
      }

      // Deploy using wallet
      console.log('🚀 Deploying contract...');
      const txId = await deployContract(contractName, contractCode);
      console.log('✅ Contract deployed successfully! TX ID:', txId);
      setDeployedTxId(txId);

      // Wait a moment for transaction to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Index contracts from blockchain using Hiro API (REAL DATA)
      const indexedContracts = await indexAllContractsByAddress(wallet?.address || '');
      
      // Find the newly deployed contract
      const deployedContract = indexedContracts.find(
        (c: any) => c.contractName === contractName || c.name === contractName
      );

      if (deployedContract) {
        
        // Index NFT ticket data using Hiro API (REAL SUPPLY, MINTED, HOLDERS DATA)
        const contractId = deployedContract.contractId || `${wallet?.address}.${contractName}`;
        const nftData = await getNFTTicketData(contractId);
        
        if (nftData) {
          
          // Save REAL blockchain data to localStorage
          const deployedContracts = JSON.parse(
            localStorage.getItem(`deployed-contracts-${wallet?.address}`) || '[]'
          );
          
          deployedContracts.push({
            contractAddress: contractId,
            contractName: deployedContract.contractName,
            eventName: formData.eventName,
            
            // REAL blockchain data from indexer
            totalSupply: nftData?.totalSupply || parseInt(formData.totalSupply),
            mintedCount: nftData?.mintedCount || 0,
            remainingSupply: nftData?.remainingSupply,
            totalHolders: nftData?.totalHolders || 0,
            
            // Form data
            ticketPrice: parseFloat(formData.ticketPrice),
            pricingMode: formData.pricingMode,
            currency: formData.currency,
            royaltyPercent: parseFloat(formData.royaltyPercentage),
            eventDate: new Date(formData.eventDate).getTime(),
            
            // Transaction data
            deployedAt: Date.now(),
            txId: txId,
            blockHeight: deployedContract.blockHeight,
            
            // Metadata
            metadataUri: metadataIpfsUrl,
            
            // Status
            status: 'confirmed',
            isActive: nftData?.isActive ?? true,
          });
          
          localStorage.setItem(
            `deployed-contracts-${wallet?.address}`,
            JSON.stringify(deployedContracts)
          );
        } else {
          
          // Fallback: Save with form values if NFT data not ready
          const deployedContracts = JSON.parse(
            localStorage.getItem(`deployed-contracts-${wallet?.address}`) || '[]'
          );
          
          const contractId = deployedContract.contractId || `${wallet?.address}.${contractName}`;
          
          deployedContracts.push({
            contractAddress: contractId,
            contractName: deployedContract.contractName,
            eventName: formData.eventName,
            totalSupply: parseInt(formData.totalSupply),
            mintedCount: 0,
            ticketPrice: parseFloat(formData.ticketPrice),
            pricingMode: formData.pricingMode,
            currency: formData.currency,
            royaltyPercent: parseFloat(formData.royaltyPercentage),
            eventDate: new Date(formData.eventDate).getTime(),
            deployedAt: Date.now(),
            txId: txId,
            blockHeight: deployedContract.blockHeight,
            metadataUri: metadataIpfsUrl,
            status: 'pending_nft_data',
            isActive: true,
          });
          
          localStorage.setItem(
            `deployed-contracts-${wallet?.address}`,
            JSON.stringify(deployedContracts)
          );
        }
      } else {
        
        // Save to deployment queue for later indexing
        const deploymentQueue = JSON.parse(
          localStorage.getItem(`deployment-queue-${wallet?.address}`) || '[]'
        );
        
        deploymentQueue.push({
          contractName: contractName,
          eventName: formData.eventName,
          txId: txId,
          status: 'pending',
          timestamp: Date.now(),
          metadataUri: metadataIpfsUrl,
          formData: {
            totalSupply: parseInt(formData.totalSupply),
            ticketPrice: parseFloat(formData.ticketPrice),
            pricingMode: formData.pricingMode,
            currency: formData.currency,
            royaltyPercent: parseFloat(formData.royaltyPercentage),
            eventDate: new Date(formData.eventDate).getTime(),
          },
        });
        
        localStorage.setItem(
          `deployment-queue-${wallet?.address}`,
          JSON.stringify(deploymentQueue)
        );
      }

      // 🔥 AUTO-REGISTER to Event Registry (BLOCKCHAIN CALL!)
      setDeploymentStep('registering');
      try {
        console.log('🎫 Step 2/2: Registering your event to the platform registry...');
        
        const contractId = `${wallet?.address}.${contractName}`;
        
        // Convert event date to Bitcoin block height
        const eventBlockHeight = await timestampToBlockHeight(new Date(formData.eventDate).getTime());
        
        // Get registry contract config
        const registryContract = getRegistryContract();
        if (!registryContract.address) {
          throw new Error('Registry contract not configured');
        }
        
        const [registryOwner, registryName] = registryContract.address.split('.');
        
        if (!registryOwner || !registryName) {
          throw new Error('Invalid registry contract address format');
        }
        
        // V2: Only pass contract address and name (simplified!)
        const functionArgs = [
          principalCV(contractId),
          stringAsciiCV(contractName),
        ];
        
        console.log('Registry V2 contract call details:', {
          registryOwner,
          registryName,
          contractId,
          contractName,
          functionName: 'register-event',
          note: 'V2: Only stores contract address, details fetched via indexer',
        });
        
        // Call registry contract via wallet (uses callback for result)
        await callContractFunction({
          contractAddress: registryOwner,
          contractName: registryName,
          functionName: 'register-event',
          functionArgs,
          onFinish: (data: any) => {
            console.log('✅ Event registered to platform! TX ID:', data.txId);
            setRegistrationTxId(data.txId);

            // Update localStorage with registry info
            const deployedContracts = JSON.parse(
              localStorage.getItem(`deployed-contracts-${wallet?.address}`) || '[]'
            );

            const updatedContracts = deployedContracts.map((c: any) =>
              c.contractId === contractId
                ? { ...c, registeredToDiscovery: true, registryTxId: data.txId }
                : c
            );

            localStorage.setItem(
              `deployed-contracts-${wallet?.address}`,
              JSON.stringify(updatedContracts)
            );

            // ONLY show success after BOTH deployment AND registration complete
            setDeploymentStep('success');
            toast.success('🎉 Event created and registered successfully!');
            setShowSuccessModal(true);
          }
        });
        
      } catch (registryError: any) {
        console.error('⚠️ Registry registration failed:', registryError);
        console.error('Error details:', {
          message: registryError?.message,
          error: registryError?.error,
          stack: registryError?.stack,
        });
        
        // Event deployed but not registered - not critical
        const errorMsg = registryError?.error?.message 
          || registryError?.message 
          || 'Unknown error during registration';
        
        toast.warning('Event Deployed but Registry Registration Failed', {
          description: `${errorMsg}. You can register manually later in settings.`,
          duration: 8000,
        });
        
        // Save to registry queue for manual retry
        const registryQueue = JSON.parse(
          localStorage.getItem('registry-queue') || '[]'
        );
        registryQueue.push({
          contractAddress: `${wallet?.address}.${contractName}`,
          contractName: contractName,
          eventName: formData.eventName,
          eventDescription: formData.description || `NFT tickets for ${formData.eventName}`,
          category: formData.category || 'general',
          venue: formData.venue,
          venueAddress: formData.venueAddress,
          venueCoordinates: selectedVenue?.lat && selectedVenue?.lon 
            ? `${selectedVenue.lat},${selectedVenue.lon}` 
            : '0,0',
          eventDate: new Date(formData.eventDate).getTime(),
          ticketPrice: priceInSmallestUnit,
          totalSupply: parseInt(formData.totalSupply),
          imageUri: imageIpfsUrl || '',
          metadataUri: metadataIpfsUrl || '',
          timestamp: Date.now(),
          status: 'failed',
          deployTxId: txId,
          error: registryError?.message || 'Unknown error',
        });
        localStorage.setItem('registry-queue', JSON.stringify(registryQueue));
      }

      // Don't show success toast here - it's shown in registry callback
    } catch (error: any) {
      console.error('❌ Error launching event:', error);
      
      // Extract detailed error message
      let errorMessage = 'Failed to launch event. Please try again.';
      
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Specific error handling
      if (errorMessage.includes('broadcast')) {
        errorMessage = 'Failed to broadcast transaction. This might be due to:\n' +
                      '• Network issues - please try again\n' +
                      '• Insufficient STX balance for fees\n' +
                      '• Contract size too large\n' +
                      'Please check your wallet and try again.';
      } else if (errorMessage.includes('cancel') || errorMessage.includes('reject')) {
        errorMessage = 'Transaction was cancelled';
      }
      
      toast.error(errorMessage, {
        duration: 8000,
      });
      setDeploymentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Render different steps
  if (!isWalletConnected) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md p-8 bg-[#1A1A1A] rounded-xl">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Create Your Event</h2>
            <p className="text-gray-400 mb-8 text-lg">
              Connect your wallet to deploy blockchain-verified NFT tickets and start selling
            </p>
            <button
              onClick={connectWallet}
              className="w-full px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 transition-all shadow-lg shadow-primary/30"
            >
              Connect Wallet to Get Started
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Create an Event</h1>
          <p className="text-gray-400 text-lg">
            Deploy blockchain-verified tickets with NFT technology
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              step === 'form' ? 'bg-primary text-white shadow-lg shadow-primary/50' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Info className="w-5 h-5" />
            <span className="font-medium">1. Event Details</span>
          </div>
          <div className="w-12 h-px bg-gray-700" />
          <div
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              step === 'upload' || step === 'deploy' ? 'bg-primary text-white shadow-lg shadow-primary/50' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Rocket className="w-5 h-5" />
            <span className="font-medium">2. Deploy & Launch</span>
          </div>
        </div>

        {/* Form Content */}
        {step === 'form' && (
          <div className="bg-[#1A1A1A] rounded-xl p-6 space-y-6">
            {/* Event Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Featured Image *
              </label>
              <p className="text-sm text-gray-500 mb-3">
                This image will be used for promoting your event and displayed on tickets. File types supported: JPG, PNG. Max size: 10MB.
              </p>
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
                    <p className="text-gray-400 mb-1">Drag and drop or click to upload</p>
                    <p className="text-sm text-gray-500">Recommended: 1200 x 630 pixels</p>
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
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  eventNameWarning
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-700 focus:border-primary'
                }`}
                required
              />

              {/* Real-time Warning */}
              {eventNameWarning && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-400 font-medium mb-2">
                        {eventNameWarning}
                      </p>
                      <div className="text-xs space-y-1.5">
                        <div className="flex items-start gap-2 text-red-300">
                          <span className="text-red-400 font-bold mt-0.5">✗</span>
                          <div>
                            <span className="font-medium">Avoid:</span> "SUMMER MUSIC FESTIVAL" or "ROCK CONCERT"
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-green-300">
                          <span className="text-green-400 font-bold mt-0.5">✓</span>
                          <div>
                            <span className="font-medium">Use:</span> "Summer Music Festival" or "Rock Concert 2025"
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Helper Text (shown when no warning) */}
              {!eventNameWarning && (
                <p className="text-xs text-gray-500 mt-2">
                  Use Title Case for best compatibility. Avoid excessive uppercase letters.
                </p>
              )}
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
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Venue Search with OpenStreetMap */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location *
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Search and select your event venue from our global location database
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={venueQuery}
                  onChange={(e) => setVenueQuery(e.target.value)}
                  placeholder="Search for a venue or location"
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
                  {/* Map Preview */}
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-1">Venue Location</div>
                    <div className="relative rounded-lg overflow-hidden border border-gray-600 bg-gray-900">
                      {/* Google Maps Embed - requires VITE_GOOGLE_MAPS_API_KEY environment variable */}
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${selectedVenue.lat},${selectedVenue.lon}&zoom=15`}
                        allowFullScreen
                        className="w-full h-40"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Venue Address (Read-only, auto-filled from search) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                name="venueAddress"
                value={formData.venueAddress}
                onChange={handleChange}
                placeholder="Select a location above to auto-fill the address"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                readOnly={!!selectedVenue}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Concert, Festival, Conference, Sports"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <p className="text-sm text-gray-500 mt-1">
                Help attendees discover your event by choosing the right category
              </p>
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
                placeholder="Provide a detailed description of your event. What makes it unique? What can attendees expect?"
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
              />
              <p className="text-sm text-yellow-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Avoid emojis and special characters for blockchain compatibility
              </p>
            </div>

            {/* Ticket Details */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Ticket Settings
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure pricing, supply, and royalties for your event tickets
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ticket Tier Name
                  </label>
                  <input
                    type="text"
                    name="ticketType"
                    value={formData.ticketType}
                    onChange={handleChange}
                    placeholder="e.g., General Admission, VIP, Early Bird"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Supply *
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
                  <p className="text-xs text-gray-500 mt-1">
                    Total number of tickets available
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ticket Price *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="ticketPrice"
                      value={formData.ticketPrice}
                      onChange={handleChange}
                      placeholder="0.1"
                      step="0.00000001"
                      min="0"
                      className="w-full pl-11 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pricingMode: prev.pricingMode === 'fixed' ? 'usd-dynamic' : 'fixed' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 hover:text-white transition-colors"
                      title={`Pricing: ${formData.pricingMode === 'fixed' ? 'Fixed' : 'Dynamic USD'}. Click to change.`}
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      Set the price buyers will pay per ticket
                    </p>
                    {cryptoPrice && !priceLoading && !priceError && (
                      <p className="text-xs text-green-400">
                        ≈ ${(parseFloat(formData.ticketPrice) * cryptoPrice).toFixed(2)} USD
                      </p>
                    )}
                  </div>
                  {priceLoading && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Calculating USD value...
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Currency */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Blockchain & Currency *
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Select which cryptocurrency buyers will use to purchase tickets
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, currency: 'STX' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.currency === 'STX'
                        ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/20'
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={stxLogo} alt="STX" className="w-8 h-8 rounded-full" />
                      <div className="text-left">
                        <div className="font-medium">STX</div>
                        <div className="text-xs opacity-75">Stacks</div>
                      </div>
                    </div>
                    <p className="text-xs mt-2 opacity-75">
                      Native Stacks blockchain payments
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, currency: 'sBTC' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.currency === 'sBTC'
                        ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/20'
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={sbtcLogo} alt="sBTC" className="w-8 h-8 rounded-full" />
                      <div className="text-left">
                        <div className="font-medium">sBTC</div>
                        <div className="text-xs opacity-75">Bitcoin Layer</div>
                      </div>
                    </div>
                    <p className="text-xs mt-2 opacity-75">
                      Bitcoin-secured (Coming soon)
                    </p>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Creator Earnings
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="royaltyPercentage"
                    value={formData.royaltyPercentage}
                    onChange={handleChange}
                    placeholder="5"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Earn a percentage from secondary ticket sales. Most events use 2.5% to 10%. Maximum 10%.
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400">
                  <p className="text-white font-medium mb-1">About Blockchain Deployment</p>
                  <p>
                    Your event will be deployed as an immutable smart contract on the Stacks blockchain. 
                    This ensures transparent ticket ownership, prevents fraud, and enables secure peer-to-peer transfers.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleUploadToIPFS}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Continue to Deploy
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Step - Hidden from UI but processing in background */}
        {step === 'upload' && (
          <div className="bg-[#1A1A1A] rounded-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Preparing Your Event</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We're uploading your event data and generating the smart contract. This typically takes 10-15 seconds.
            </p>
          </div>
        )}

        {/* Deploy Step */}
        {step === 'deploy' && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-7 h-7 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Ready to Deploy
                  </h3>
                  <p className="text-gray-400">
                    Your event is configured and ready. Deploy your smart contract to start selling tickets on the blockchain.
                  </p>
                </div>
              </div>
            </div>

            {/* Deploy Contract Card */}
            <div className="bg-[#1A1A1A] rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Review & Deploy</h3>
                <p className="text-gray-400">
                  Review your event details below and deploy your smart contract to the Stacks blockchain.
                </p>
              </div>

              {/* Event Summary */}
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Event:</span>
                  <span className="text-white font-medium">{formData.eventName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Supply:</span>
                  <span className="text-white font-medium">{formData.totalSupply} tickets</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-medium">{formData.ticketPrice} {formData.currency}</span>
                </div>
                <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Contract Deployment:</span>
                    <span className="text-white">~{DEPLOYMENT_COSTS.eventContract} STX</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Registry Registration:</span>
                    <span className="text-white">{DEPLOYMENT_COSTS.registryFee} STX</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold border-t border-gray-600 pt-2 mt-2">
                    <span className="text-gray-300">Total Cost (2 Transactions):</span>
                    <span className="text-white">~{(DEPLOYMENT_COSTS.eventContract + DEPLOYMENT_COSTS.registryFee).toFixed(2)} STX</span>
                  </div>
                </div>
              </div>

              {/* Deploy Button - No intermediate success message */}
              <button
                onClick={handleDeployContract}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {deploymentStep === 'deploying' && 'Creating Event...'}
                    {deploymentStep === 'registering' && 'Registering...'}
                  </>
                ) : (
                  <>
                    <Rocket className="w-6 h-6" />
                    Create Event
                  </>
                )}
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400">
                  <p>
                    <strong className="text-white">What happens next?</strong> After deployment, your smart contract will be permanently recorded on the blockchain. 
                    Transaction confirmation typically takes 2-3 minutes. Once confirmed, buyers can purchase tickets directly from your event page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
    <WalletConnectModal
      isOpen={showWalletModal}
      onClose={() => setShowWalletModal(false)}
    />

    {/* Success Modal - Compact & User-Friendly */}
    {showSuccessModal && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
          {/* Close Button */}
          <button
            onClick={() => {
              setShowSuccessModal(false);
              setDeploymentStep('idle');
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Event Created!</h2>
            <p className="text-gray-400 text-sm">
              Successfully deployed and registered
            </p>
          </div>

          {/* Event Summary */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Event</span>
                <span className="text-white font-medium truncate ml-2 max-w-[200px]">{formData.eventName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tickets</span>
                <span className="text-white font-medium">{formData.totalSupply} @ {formData.ticketPrice} {formData.currency}</span>
              </div>
            </div>
          </div>

          {/* Transaction IDs - Compact */}
          <div className="space-y-3 mb-5">
            {/* Deployment TX */}
            {deployedTxId && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-green-400">Event Deployed</span>
                  <a
                    href={`https://explorer.hiro.so/txid/${deployedTxId}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="bg-black/30 rounded px-3 py-2 flex items-center justify-between group">
                  <code className="text-xs text-gray-400 truncate font-mono">{deployedTxId}</code>
                  <button
                    onClick={() => copyToClipboard(deployedTxId)}
                    className="ml-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Registration TX */}
            {registrationTxId && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-blue-400">Event Registered</span>
                  <a
                    href={`https://explorer.hiro.so/txid/${registrationTxId}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="bg-black/30 rounded px-3 py-2 flex items-center justify-between group">
                  <code className="text-xs text-gray-400 truncate font-mono">{registrationTxId}</code>
                  <button
                    onClick={() => copyToClipboard(registrationTxId)}
                    className="ml-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-5">
            <p className="text-xs text-gray-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Transactions confirm in ~2-3 minutes. Your event will be visible after confirmation.</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setDeploymentStep('idle');
                window.location.href = '/app/portofolio';
              }}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-medium hover:from-primary/90 hover:to-purple-600/90 transition-all text-sm"
            >
              View Events
            </button>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setDeploymentStep('idle');
                setStep('form');
                setDeployedTxId(null);
                setRegistrationTxId('');
              }}
              className="px-4 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-all text-sm"
            >
              Create New
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default CreateEventNFT;
