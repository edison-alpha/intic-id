import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MintNFTButton from '@/components/MintNFTButton';
import { useWallet } from '@/contexts/WalletContext';
import { getEventDataFromContract } from '@/services/nftIndexer';
import { getRegistryEvent } from '@/services/registryService';
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Share2,
  CheckCircle,
  Loader2,
  Info,
  Ticket
} from 'lucide-react';
import { EventDetailSkeleton } from '@/components/EventSkeletons';
import { toast } from 'sonner';
import stxLogo from '@/assets/stx.jpg';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isWalletConnected } = useWallet();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registryData, setRegistryData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const decodedContractId = decodeURIComponent(id);
      
      // Try to load registry data if id is a number (event ID from registry)
      let contractId = decodedContractId;
      let regData = null;
      
      // Check if ID is numeric (registry event ID) or contract address
      if (/^\d+$/.test(decodedContractId)) {

        const eventId = parseInt(decodedContractId);
        regData = await getRegistryEvent(eventId);
        
        if (regData) {

          contractId = `${regData.contractAddress}.${regData.contractName}`;
          setRegistryData(regData);
        } else {
          toast.error('Event not found in registry');
          navigate('/app');
          return;
        }
      }

      // Use centralized nftIndexer helper to fetch event data (combines tokenUri, get-event-info, totals)
      const eventData = await getEventDataFromContract(contractId);

      if (!eventData) {
        toast.error('Event not found or not available on-chain');
        navigate('/app');
        return;
      }



      // Map eventData to UI fields
      const priceMicro = eventData.price || 0;
      const priceDisplay = eventData.priceFormatted || (priceMicro ? `${(Number(priceMicro) / 1000000).toFixed(2)}` : '0');

      const eventDateRaw = eventData.eventDate;
      const formattedDate = eventDateRaw ? new Date(Number(eventDateRaw)).toLocaleDateString() : 'Date TBA';
      const formattedTime = eventDateRaw ? new Date(Number(eventDateRaw)).toLocaleTimeString() : 'TBA';

      // Choose image from token metadata or fallback
      const imageUrl = eventData.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';

      const title = eventData.eventName || eventData.metadata?.name || decodedContractId.split('.')[1];

      // Venue with address fallback
      const venueDisplay = eventData.venue || eventData.venueAddress || eventData.metadata?.properties?.venue || 'Event Venue';
      
      // Parse venue coordinates (format: "lat,lng" or "-6.2203380,106.8057496")
      const venueCoords = eventData.venueCoordinates || '';

      
      let latitude = 0;
      let longitude = 0;
      if (venueCoords && venueCoords.includes(',')) {
        const [lat, lng] = venueCoords.split(',').map((coord: string) => parseFloat(coord.trim()));

        if (!isNaN(lat) && !isNaN(lng)) {
          latitude = lat;
          longitude = lng;
        }
      }


      const eventState = {
        id: contractId,
        contractId: contractId,
        eventId: regData?.eventId, // Add registry event ID
        title,
        image: imageUrl,
        date: formattedDate,
        time: formattedTime,
        location: venueDisplay,
        venueAddress: eventData.venueAddress || '',
        venueCoordinates: venueCoords,
        latitude,
        longitude,
        description: eventData.description || eventData.metadata?.description || 'NFT Event Ticket',
        category: eventData.category || 'event',
        price: priceDisplay,
        priceInMicroSTX: Number(priceMicro),
        available: Number(eventData.available ?? 0),
        total: Number(eventData.totalSupply ?? 0),
        minted: Number(eventData.minted ?? 0),
        isActive: regData ? regData.isActive : eventData.isActive, // Use registry active status if available
        isCancelled: eventData.isCancelled,
        verified: regData?.isVerified || false, // Add verified status from registry
        featured: regData?.isFeatured || false, // Add featured status from registry
        organizer: regData?.organizer || contractId.split('.')[0], // Add organizer from registry
        registeredAt: regData?.registeredAt, // Add registration timestamp
        contractAddress: contractId.split('.')[0],
        contractName: contractId.split('.')[1],
        tokenUri: eventData.tokenUri || '',
      };


      setEvent(eventState);
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/app');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleMintSuccess = () => {
    toast.success('Ticket minted successfully! Refreshing data...');
    setTimeout(() => {
      loadEventData();
    }, 3000);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <EventDetailSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
            <p className="text-gray-400 mb-4">The event you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const availabilityPercentage = event.total > 0 ? ((event.available / event.total) * 100).toFixed(0) : 0;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/app')}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-2xl overflow-hidden aspect-video">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              {!event.isActive && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg py-2 px-4">
                    Event Ended
                  </Badge>
                </div>
              )}
            </div>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-[#FE5C02]/20 text-[#FE5C02]">
                        {event.category}
                      </Badge>
                      {event.verified && (
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                      {event.featured && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                          ? Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-[#FE5C02]" />
                    <div>
                      <div className="font-semibold">{event.date}</div>
                      <div className="text-sm text-gray-400">{event.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-[#FE5C02]" />
                    <div>
                      <div className="font-semibold">{event.location}</div>
                      <div className="text-sm text-gray-400">Event Venue</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-xl font-semibold text-white mb-3">About This Event</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Venue Map Preview */}
                {event.venueCoordinates && event.latitude !== 0 && event.longitude !== 0 && (
                  <div className="border-t border-gray-800 mt-6 pt-6">
                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#FE5C02]" />
                      Venue Location
                    </h3>
                    <div className="space-y-3">
                      {event.venueAddress && (
                        <p className="text-sm text-gray-400">
                          {event.venueAddress}
                        </p>
                      )}
                      <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-900">
                        <iframe
                          src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=es;z=14&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-700 hover:border-[#FE5C02] hover:text-[#FE5C02]"
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`, '_blank')}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Open in Google Maps
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-700 hover:border-[#FE5C02] hover:text-[#FE5C02]"
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`, '_blank')}
                        >
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Debug info if no coordinates */}
                {(!event.venueCoordinates || event.latitude === 0 || event.longitude === 0) && (
                  <div className="border-t border-gray-800 mt-6 pt-6">
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-500 mb-2">
                        ??? Map Preview Unavailable
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">
                        Venue coordinates not available for this event.
                      </p>
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-300">Debug Info</summary>
                        <pre className="mt-2 bg-black/30 p-2 rounded overflow-x-auto">
                          {JSON.stringify({
                            venueCoordinates: event.venueCoordinates || 'null',
                            latitude: event.latitude,
                            longitude: event.longitude,
                            venue: event.location,
                            venueAddress: event.venueAddress || 'null',
                          }, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-800 mt-6 pt-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Contract Information</h3>
                  <div className="bg-[#0A0A0A] rounded-lg p-3">
                    <div className="text-xs font-mono text-gray-500 break-all">
                      {event.contractId}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-[#1A1A1A] border-gray-800 sticky top-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">
                      {event.price}
                    </span>
                    <span className="text-3xl font-semibold text-gray-300">STX</span>
                    <img src={stxLogo} alt="STX" className="w-9 h-9 rounded-full object-cover" />
                  </div>
                  <div className="text-gray-400">per ticket</div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Availability</span>
                    <span className="text-sm font-semibold text-white">
                      {event.available} / {event.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#FE5C02] to-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${availabilityPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {event.minted} tickets minted
                  </div>
                </div>

                <div className="space-y-3">
                  {isWalletConnected ? (
                    event.isActive && event.available > 0 ? (
                      <MintNFTButton
                        contractId={event.contractId}
                        price={event.priceInMicroSTX}
                        onSuccess={handleMintSuccess}
                        eventName={event.title}
                        eventDate={event.date}
                        eventTime={event.time}
                        location={event.location}
                      />
                    ) : (
                      <Button
                        disabled
                        size="lg"
                        className="w-full"
                      >
                        <Ticket className="w-5 h-5 mr-2" />
                        {!event.isActive ? 'Event Ended' : 'Sold Out'}
                      </Button>
                    )
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-400 mb-3">
                        Connect your wallet to mint tickets
                      </p>
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-[#FE5C02] to-orange-600"
                        onClick={() => toast.info('Please connect your wallet from the header')}
                      >
                        Connect Wallet
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Instant ticket delivery</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>NFT ownership proof</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Blockchain verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EventDetail;
