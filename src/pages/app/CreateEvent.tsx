import React, { useState, useRef } from "react";
import AppLayout from "@/components/app/AppLayout";
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  ImageIcon, 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Loader2,
  Plus,
  Trash2,
  Music,
  Info,
  Settings,
  Ticket,
  Building2,
  Clock,
  AlignLeft
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Artist {
  name: string;
  role: string;
  time: string;
  bio: string;
}

interface TicketTier {
  name: string;
  price: string;
  quantity: string;
  description: string;
}

const CreateEvent = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    eventName: "",
    subtitle: "",
    eventDate: "",
    eventTime: "",
    doors: "",
    category: "concert",
    description: "",
    
    // Venue Info
    venue: "",
    venueAddress: "",
    latitude: "",
    longitude: "",
    venueCapacity: "",
    venueDescription: "",
    
    // Ticketing
    royaltyPercentage: "5",
    
    // Additional Info
    ageRestriction: "All ages welcome",
    dresscode: "Casual",
    
    // Media
    eventImage: ""
  });

  const [artists, setArtists] = useState<Artist[]>([
    { name: "", role: "Headliner", time: "", bio: "" }
  ]);
  
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    { name: "General Admission", price: "", quantity: "", description: "" }
  ]);
  
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [prohibitedItems, setProhibitedItems] = useState<string[]>([""]);
  const [venueFeatures, setVenueFeatures] = useState<string[]>([""]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { number: 1, title: "Basic Info", description: "Event details", icon: Info },
    { number: 2, title: "Venue", description: "Location & capacity", icon: Building2 },
    { number: 3, title: "Lineup", description: "Artists & performers", icon: Music },
    { number: 4, title: "Tickets", description: "Pricing & tiers", icon: Ticket },
    { number: 5, title: "Details", description: "Description & media", icon: AlignLeft },
    { number: 6, title: "Settings", description: "Rules & restrictions", icon: Settings }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear preview if latitude or longitude is manually cleared
    if ((name === 'latitude' || name === 'longitude') && value.trim() === '') {
      if (name === 'latitude') {
        setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
      } else {
        setFormData(prev => ({ ...prev, longitude: '', latitude: '' }));
      }
    }
  };

  // Artist management
  const addArtist = () => {
    setArtists([...artists, { name: "", role: "Supporting Act", time: "", bio: "" }]);
  };

  const removeArtist = (index: number) => {
    if (artists.length > 1) {
      setArtists(artists.filter((_, i) => i !== index));
    }
  };

  const updateArtist = (index: number, field: keyof Artist, value: string) => {
    const newArtists = [...artists];
    newArtists[index][field] = value;
    setArtists(newArtists);
  };

  // Ticket tier management
  const addTicketTier = () => {
    setTicketTiers([...ticketTiers, { name: "", price: "", quantity: "", description: "" }]);
  };

  const removeTicketTier = (index: number) => {
    if (ticketTiers.length > 1) {
      setTicketTiers(ticketTiers.filter((_, i) => i !== index));
    }
  };

  const updateTicketTier = (index: number, field: keyof TicketTier, value: string) => {
    const newTiers = [...ticketTiers];
    newTiers[index][field] = value;
    setTicketTiers(newTiers);
  };

  // List management helpers
  const addToList = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList([...list, ""]);
  };

  const removeFromList = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    if (list.length > 1) {
      setList(list.filter((_, i) => i !== index));
    }
  };

  const updateListItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      const data = await response.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    // Clear location data if search input is cleared
    if (!query || query.trim() === '') {
      setFormData(prev => ({
        ...prev,
        venue: '',
        venueAddress: '',
        latitude: '',
        longitude: ''
      }));
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query);
    }, 500);
  };

  const selectLocation = (result: any) => {
    setFormData(prev => ({
      ...prev,
      venue: result.name || result.display_name.split(',')[0],
      venueAddress: result.display_name,
      latitude: result.lat,
      longitude: result.lon
    }));
    
    setShowResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.value = result.display_name;
    }
    
    toast.success('Location selected successfully!');
  };

  const clearLocation = () => {
    setFormData(prev => ({
      ...prev,
      venue: '',
      venueAddress: '',
      latitude: '',
      longitude: ''
    }));
    
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    
    setSearchResults([]);
    setShowResults(false);
    toast.info('Location cleared');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    console.log('handleSubmit called, currentStep:', currentStep);
    
    // Only submit if we're on step 4 (Review)
    if (currentStep !== 5) {
      console.log('Not on review step, preventing submit. Current step:', currentStep);
      toast.error("Please complete all steps before creating event");
      return;
    }
    
    // Final validation
    if (!formData.eventName || !formData.eventDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!formData.venue || !formData.latitude || !formData.longitude) {
      toast.error("Please set a valid location");
      return;
    }

    if (ticketTiers.length === 0 || !ticketTiers.every(tier => tier.name && tier.price && tier.quantity)) {
      toast.error("Please add at least one complete ticket tier");
      return;
    }
    
    if (!imagePreview) {
      toast.error("Please upload an event image");
      return;
    }
    
    console.log('All validations passed, minting NFT...');
    toast.success("NFT Event created successfully! Minting in progress...");
    
    // Reset form
    setFormData({
      eventName: "",
      subtitle: "",
      eventDate: "",
      eventTime: "",
      doors: "",
      venue: "",
      venueAddress: "",
      latitude: "",
      longitude: "",
      venueCapacity: "",
      venueDescription: "",
      description: "",
      royaltyPercentage: "5",
      category: "concert",
      ageRestriction: "All ages welcome",
      dresscode: "Casual",
      eventImage: ""
    });
    setImagePreview(null);
    setArtists([{ name: "", role: "", time: "", bio: "" }]);
    setVenueFeatures([""]);
    setTicketTiers([{ name: "", price: "", quantity: "", description: "" }]);
    setCurrentStep(1);
  };

  const nextStep = () => {
    console.log('nextStep called, currentStep:', currentStep);
    
    // Validation for each step
    if (currentStep === 1) {
      if (!formData.eventName || !formData.eventDate || !imagePreview) {
        toast.error("Please fill in event name, date, and upload an image");
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.venue || !formData.latitude || !formData.longitude) {
        toast.error("Please select a valid location");
        return;
      }
    }
    if (currentStep === 3) {
      if (artists.length === 0 || !artists.every(artist => artist.name && artist.role)) {
        toast.error("Please add at least one artist with name and role");
        return;
      }
    }
    if (currentStep === 4) {
      if (ticketTiers.length === 0 || !ticketTiers.every(tier => tier.name && tier.price && tier.quantity)) {
        toast.error("Please add at least one complete ticket tier");
        return;
      }
    }
    
    if (currentStep < 5) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 md:px-6 md:py-6 max-w-4xl mx-auto">
        {/* Header */}
        <Link to="/app" className="inline-flex items-center gap-2 text-gray-400 active:text-white md:hover:text-white transition-colors mb-4 md:mb-6 -ml-2 px-2 py-2">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm md:text-base">Back to Events</span>
        </Link>

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Create Event</h1>
          <p className="text-sm md:text-base text-gray-400">Deploy NFT tickets for your event on Stack blockchain</p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-6 md:mb-8">
          <div className="relative">
            {/* Progress Bar Background */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-800" style={{ zIndex: 0 }}></div>
            {/* Progress Bar Active */}
            <div 
              className="absolute top-5 left-0 h-0.5 bg-[#FE5C02] transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`, zIndex: 0 }}
            ></div>
            
            {/* Step Indicators */}
            <div className="relative flex justify-between" style={{ zIndex: 1 }}>
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-300 ${
                      currentStep >= step.number 
                        ? 'bg-[#FE5C02] text-white shadow-lg shadow-[#FE5C02]/50' 
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 md:mt-3 text-center">
                    <p className={`text-xs md:text-sm font-semibold ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-600 mt-0.5 hidden md:block">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form - Only submits on Step 4 */}
        <div className="space-y-4 md:space-y-6">
          
          {/* Step 1: Event Info */}
          {currentStep === 1 && (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6 space-y-5 md:space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#FE5C02] flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Event Information</h2>
                  <p className="text-xs md:text-sm text-gray-400">Tell us about your event</p>
                </div>
              </div>

              {/* Event Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Event Image <span className="text-[#FE5C02]">*</span>
                </label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-44 md:h-48 border-2 border-dashed border-gray-700 rounded-2xl md:rounded-xl cursor-pointer active:border-[#FE5C02] md:hover:border-[#FE5C02] transition-colors bg-[#0A0A0A]"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl md:rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mb-2 md:mb-3" />
                      <p className="text-sm text-gray-400 font-medium">Click to upload event image</p>
                      <p className="text-xs text-gray-600 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                  Event Name <span className="text-[#FE5C02]">*</span>
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  placeholder="e.g., Summer Music Festival 2025"
                  className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                  Subtitle / Tagline
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  placeholder="e.g., featuring ALL-STARS 2.0"
                  className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Event Date <span className="text-[#FE5C02]">*</span>
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Event Time <span className="text-[#FE5C02]">*</span>
                  </label>
                  <input
                    type="time"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                    Doors Open
                  </label>
                  <input
                    type="time"
                    name="doors"
                    value={formData.doors}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                  Event Category <span className="text-[#FE5C02]">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                >
                  <option value="concert">Concert</option>
                  <option value="sports">Sports</option>
                  <option value="conference">Conference</option>
                  <option value="festival">Festival</option>
                  <option value="theater">Theater</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2 md:mb-3">Event Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your event..."
                  rows={4}
                  className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6 space-y-5 md:space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#FE5C02] flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Event Location</h2>
                  <p className="text-xs md:text-sm text-gray-400">Where will the event take place?</p>
                </div>
              </div>

              {/* Location Search with Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search Location <span className="text-[#FE5C02]">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    onChange={handleSearchInput}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    placeholder="Type to search for venue or address..."
                    className="w-full px-4 py-3.5 md:py-3 pl-10 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FE5C02] animate-spin" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Powered by OpenStreetMap - Start typing to see suggestions
                </p>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-[#1A1A1A] border border-gray-800 rounded-2xl md:rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectLocation(result)}
                        className="w-full px-4 py-3 text-left hover:bg-[#0A0A0A] transition-colors border-b border-gray-800 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-[#FE5C02] flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {result.name || result.display_name.split(',')[0]}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {result.display_name}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Location Info */}
              {formData.venue && formData.venueAddress && (
                <div className="relative p-4 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl space-y-3">
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Clear location"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Selected Venue</p>
                    <p className="text-sm text-white font-medium">{formData.venue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Full Address</p>
                    <p className="text-sm text-gray-300">{formData.venueAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Coordinates</p>
                    <p className="text-sm text-gray-300">
                      {formData.latitude}, {formData.longitude}
                    </p>
                  </div>
                </div>
              )}

              {/* Map Preview with OpenStreetMap */}
              {formData.latitude && formData.longitude && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Location Preview
                  </label>
                  <div className="relative w-full h-[250px] md:h-[300px] rounded-2xl md:rounded-xl overflow-hidden border border-gray-800 bg-[#0A0A0A]">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.longitude)-0.01},${parseFloat(formData.latitude)-0.01},${parseFloat(formData.longitude)+0.01},${parseFloat(formData.latitude)+0.01}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Coordinates: {formData.latitude}, {formData.longitude}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#FE5C02] hover:text-[#E54F02] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}

              {/* Venue Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                    <Users className="w-4 h-4 inline mr-1" />
                    Venue Capacity
                  </label>
                  <input
                    type="number"
                    name="venueCapacity"
                    value={formData.venueCapacity}
                    onChange={handleChange}
                    placeholder="e.g., 20000"
                    className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Venue Description
                </label>
                <textarea
                  name="venueDescription"
                  value={formData.venueDescription}
                  onChange={handleChange}
                  placeholder="Describe the venue, its features, accessibility, nearby amenities..."
                  rows={4}
                  className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent resize-none"
                />
              </div>

              {/* Venue Features */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                  Venue Features
                </label>
                {venueFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateListItem(venueFeatures, setVenueFeatures, index, e.target.value)}
                      placeholder="e.g., Climate-controlled, Accessible seating"
                      className="flex-1 px-4 py-2.5 bg-[#0A0A0A] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                    />
                    {venueFeatures.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFromList(venueFeatures, setVenueFeatures, index)}
                        className="p-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addToList(venueFeatures, setVenueFeatures)}
                  className="mt-2 px-4 py-2 bg-[#0A0A0A] border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-[#FE5C02] hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Lineup/Artists */}
          {currentStep === 3 && (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6 space-y-5 md:space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#FE5C02] flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Artists & Lineup</h2>
                  <p className="text-xs md:text-sm text-gray-400">Who's performing at your event?</p>
                </div>
              </div>

              {/* Artists List */}
              {artists.map((artist, index) => (
                <div key={index} className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Artist #{index + 1}</h3>
                    {artists.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArtist(index)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Artist Name <span className="text-[#FE5C02]">*</span>
                      </label>
                      <input
                        type="text"
                        value={artist.name}
                        onChange={(e) => updateArtist(index, 'name', e.target.value)}
                        placeholder="e.g., The Weeknd"
                        className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Role
                      </label>
                      <select
                        value={artist.role}
                        onChange={(e) => updateArtist(index, 'role', e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                      >
                        <option value="Headliner">Headliner</option>
                        <option value="Co-Headliner">Co-Headliner</option>
                        <option value="Special Guest">Special Guest</option>
                        <option value="Supporting Act">Supporting Act</option>
                        <option value="Opening Act">Opening Act</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Performance Time
                    </label>
                    <input
                      type="text"
                      value={artist.time}
                      onChange={(e) => updateArtist(index, 'time', e.target.value)}
                      placeholder="e.g., 9:30 PM - 11:00 PM"
                      className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addArtist}
                className="w-full py-3 bg-[#0A0A0A] border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-[#FE5C02] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Artist
              </button>
            </div>
          )}

          {/* Step 4: Ticket Tiers */}
          {currentStep === 4 && (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6 space-y-5 md:space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#FE5C02] flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Ticket Configuration</h2>
                  <p className="text-xs md:text-sm text-gray-400">Set pricing tiers and availability</p>
                </div>
              </div>

              {/* Ticket Tiers */}
              {ticketTiers.map((tier, index) => (
                <div key={index} className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Tier #{index + 1}</h3>
                    {ticketTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketTier(index)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Tier Name <span className="text-[#FE5C02]">*</span>
                      </label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                        placeholder="e.g., VIP"
                        className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Price (sBTC) <span className="text-[#FE5C02]">*</span>
                      </label>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) => updateTicketTier(index, 'price', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Quantity <span className="text-[#FE5C02]">*</span>
                      </label>
                      <input
                        type="number"
                        value={tier.quantity}
                        onChange={(e) => updateTicketTier(index, 'quantity', e.target.value)}
                        placeholder="100"
                        min="1"
                        className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={tier.description}
                      onChange={(e) => updateTicketTier(index, 'description', e.target.value)}
                      placeholder="e.g., Front row seating with backstage access"
                      className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addTicketTier}
                className="w-full py-3 bg-[#0A0A0A] border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-[#FE5C02] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Tier
              </button>

              {/* Royalty */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2 md:mb-3">
                  Royalty Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="royaltyPercentage"
                    value={formData.royaltyPercentage}
                    onChange={handleChange}
                    placeholder="5"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3.5 md:py-3 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Royalty for secondary sales (recommended 5-10%)
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6 space-y-5 md:space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#FE5C02] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Review & Confirm</h2>
                  <p className="text-xs md:text-sm text-gray-400">Double-check everything before minting</p>
                </div>
              </div>

              {/* Event Preview Card */}
              <div className="space-y-4">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-full h-48 md:h-64 rounded-2xl md:rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Event" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                      {formData.category}
                    </div>
                  </div>
                )}

                {/* Event Details Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Event Name</p>
                    <p className="text-sm md:text-base text-white font-semibold">{formData.eventName || '-'}</p>
                  </div>
                  <div className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                    <p className="text-sm md:text-base text-white font-semibold">
                      {formData.eventDate || '-'} {formData.eventTime && `at ${formData.eventTime}`}
                    </p>
                  </div>
                  <div className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Venue</p>
                    <p className="text-sm md:text-base text-white font-semibold">{formData.venue || '-'}</p>
                  </div>
                  <div className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm md:text-base text-white font-semibold">{formData.category || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {formData.description && (
                  <div className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">Description</p>
                    <p className="text-sm text-gray-300">{formData.description}</p>
                  </div>
                )}

                {/* Location & Map Preview - Collapsible */}
                {formData.latitude && formData.longitude && (
                  <div className="border border-gray-800 rounded-2xl md:rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowMapPreview(!showMapPreview)}
                      className="w-full p-4 bg-[#0A0A0A] flex items-center justify-between hover:bg-gray-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#FE5C02]" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white">Location Details</p>
                          <p className="text-xs text-gray-400">{formData.venueAddress}</p>
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${showMapPreview ? 'rotate-180' : ''}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {showMapPreview && (
                      <div className="p-4 bg-[#0A0A0A] border-t border-gray-800 space-y-3 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Latitude</p>
                            <p className="text-sm text-gray-300 font-mono">{formData.latitude}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Longitude</p>
                            <p className="text-sm text-gray-300 font-mono">{formData.longitude}</p>
                          </div>
                        </div>
                        
                        <div className="relative w-full h-[200px] md:h-[250px] rounded-xl overflow-hidden border border-gray-800">
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            style={{ border: 0 }}
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.longitude)-0.01},${parseFloat(formData.latitude)-0.01},${parseFloat(formData.longitude)+0.01},${parseFloat(formData.latitude)+0.01}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                          />
                        </div>
                        
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Event Summary */}
                <div className="p-5 bg-gradient-to-r from-[#FE5C02]/10 to-[#FE5C02]/5 border border-[#FE5C02]/20 rounded-2xl md:rounded-xl space-y-3">
                  <p className="text-sm font-semibold text-white">Ticket Tiers Summary</p>
                  <div className="space-y-3">
                    {ticketTiers.map((tier, index) => (
                      <div key={index} className="p-3 bg-[#0A0A0A]/50 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-white">{tier.name || `Tier ${index + 1}`}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-[#FE5C02] font-bold">{tier.price} sBTC</span>
                            <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-3.5 h-3.5 object-contain" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Quantity</span>
                          <span className="text-gray-300">{tier.quantity} tickets</span>
                        </div>
                        {tier.description && (
                          <p className="text-xs text-gray-400">{tier.description}</p>
                        )}
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[#FE5C02]/20 flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Tickets</span>
                      <span className="text-base text-white font-bold">
                        {ticketTiers.reduce((sum, tier) => sum + parseInt(tier.quantity || '0'), 0)} tickets
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Royalty Fee</span>
                      <span className="text-sm text-white font-semibold">{formData.royaltyPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Artists Summary */}
                {artists.length > 0 && artists[0].name && (
                  <div className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl">
                    <p className="text-xs text-gray-500 mb-3">Lineup</p>
                    <div className="space-y-2">
                      {artists.map((artist, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white font-medium">{artist.name}</p>
                            <p className="text-xs text-gray-400">{artist.role}</p>
                          </div>
                          {artist.time && (
                            <span className="text-xs text-gray-500">{artist.time}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Venue Features */}
                {venueFeatures.length > 0 && venueFeatures[0] && (
                  <div className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl">
                    <p className="text-xs text-gray-500 mb-3">Venue Features</p>
                    <div className="flex flex-wrap gap-2">
                      {venueFeatures.map((feature, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-800 text-xs text-gray-300 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning Notice */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl md:rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-500 mb-1">Important Notice</p>
                    <p className="text-xs text-gray-300">
                      Once minted, event details cannot be modified. Please review all information carefully before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 md:gap-4 pt-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 px-6 py-4 md:py-3.5 bg-[#1A1A1A] active:bg-gray-800 md:hover:bg-gray-800 text-white text-sm md:text-base font-semibold rounded-2xl md:rounded-xl transition-colors border border-gray-800 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <Link
                to="/app"
                className="flex-1 px-6 py-4 md:py-3.5 bg-[#1A1A1A] active:bg-gray-800 md:hover:bg-gray-800 text-white text-sm md:text-base font-semibold rounded-2xl md:rounded-xl transition-colors text-center border border-gray-800"
              >
                Cancel
              </Link>
            )}
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 px-6 py-4 md:py-3.5 bg-[#FE5C02] active:bg-[#E54F02] md:hover:bg-[#E54F02] text-white text-sm md:text-base font-semibold rounded-2xl md:rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-6 py-4 md:py-3.5 bg-[#FE5C02] active:bg-[#E54F02] md:hover:bg-[#E54F02] text-white text-sm md:text-base font-semibold rounded-2xl md:rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Create Event
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateEvent;
