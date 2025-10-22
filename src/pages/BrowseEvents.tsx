
import React, { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Calendar, MapPin, Users, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ActivityFeed } from '@/components/ActivityFeed';
import { useWallet } from '@/contexts/WalletContext';
import { getAllRegistryEvents } from '@/services/registryService';
import { BrowseEventsSkeleton } from '@/components/EventSkeletons';
import { bulkLoadEvents } from '@/services/dataTransformer';
import { getEventDataFromContract } from '@/services/nftIndexer';
import stxLogo from '@/assets/stx.jpg';

// Unified fallback image
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';

const BrowseEvents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { wallet } = useWallet();

  // Mock user tier - in production, get from blockchain/wallet
  const userTier = {
    name: "Silver",
    discount: 10,
    earlyAccess: true,
    icon: "🥈"
  };

  // Track manual scroll for slide indicator
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleScroll = () => {
      const slideIndex = Math.round(slider.scrollLeft / slider.offsetWidth);
      setCurrentSlide(slideIndex);
    };

    slider.addEventListener('scroll', handleScroll);
    return () => slider.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { id: "all", label: "All Events" },
    { id: "concert", label: "Concerts" },
    { id: "sports", label: "Sports" },
    { id: "conference", label: "Conferences" },
    { id: "festival", label: "Festivals" },
    { id: "theater", label: "Theater" }
  ];

  // Events from blockchain - Load from Registry V2 with Normalized Data Store
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        // Get all registered events from Registry V2
        const registryEvents = await getAllRegistryEvents();

        if (registryEvents.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        // Use bulk load with normalized data store (SINGLE LOAD + REUSE)
        const normalizedEvents = await bulkLoadEvents(
          registryEvents,
          getEventDataFromContract
        );

        // Transform normalized events to component format
        const transformedEvents = normalizedEvents
          .filter(e => e.isCancelled !== true) // Only filter out cancelled events
          .map(event => ({
            id: event.id,
            eventId: event.id,
            title: event.eventName,
            image: event.image || FALLBACK_IMAGE,
            date: event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBA',
            time: event.eventTime,
            location: event.venue,
            description: event.description || 'NFT Event Ticket',
            category: event.category,
            price: event.priceFormatted,
            priceInMicroSTX: Number(event.price),
            available: event.remaining,
            total: event.totalSupply,
            minted: event.minted,
            featured: event.isFeatured,
            verified: event.isVerified,
            earlyAccess: false,
            isActive: event.isActive,
            isCancelled: event.isCancelled,
            contractAddress: event.contractAddress,
            contractName: event.contractName,
            tokenUri: '',
          }));

        setEvents(transformedEvents);

      } catch (error) {
        console.error('❌ Error loading events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Define hero events by their contract addresses
  const heroEventIds = [
    'ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709',
    'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401'
  ];

  const heroEvents = events.filter(event => heroEventIds.includes(event.id));
  const featuredEvents = filteredEvents.filter(e => e.featured && !heroEventIds.includes(e.id));
  const regularEvents = filteredEvents.filter(e => !e.featured && !heroEventIds.includes(e.id));

  // Auto-slide functionality for hero banner
  useEffect(() => {
    if (heroEvents.length <= 1) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const maxScrollLeft = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
        const nextScrollLeft = sliderRef.current.scrollLeft + sliderRef.current.offsetWidth;

        if (nextScrollLeft >= maxScrollLeft) {
          // Go back to first slide
          sliderRef.current.scrollTo({
            left: 0,
            behavior: 'smooth'
          });
        } else {
          sliderRef.current.scrollTo({
            left: nextScrollLeft,
            behavior: 'smooth'
          });
        }
      }
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(interval);
  }, [heroEvents.length]);

  return (
    <AppLayout>
      {/* Main Content */}
      <div className="px-4 pt-2 pb-6 md:px-6 md:pt-4 md:pb-6">

        {/* Hero Banner - Improved Layout */}
        {heroEvents.length > 0 && (
          <div className="mb-8 md:mb-12">
            <div className="relative -mx-4 md:mx-0 overflow-hidden rounded-none md:rounded-3xl">
              <div
                ref={sliderRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
                style={{
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch'
                } as React.CSSProperties}
              >
                {heroEvents.map((event, index) => (
                  <Link
                    key={event.id}
                    to={`/app/event/${event.id}`}
                    className="group relative flex-shrink-0 w-full aspect-[16/11] sm:aspect-[16/9] md:aspect-[18/8] lg:aspect-[20/7] overflow-hidden snap-center"
                  >
                    {/* Full Background Image with Parallax Effect */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${event.image}')` }}
                    >
                      {/* Improved Gradient Overlay - Better balance between image and text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20 md:bg-gradient-to-r md:from-black/90 md:via-black/60 md:to-transparent" />
                    </div>

                    {/* Content Container - Better Spacing & Organization */}
                    <div className="relative h-full flex items-end md:items-center py-4 sm:py-5 md:py-6 lg:py-8">
                      {/* Price Badge - Top Right */}
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 lg:top-6 lg:right-6 z-10">
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-black/40 backdrop-blur-md rounded-lg md:rounded-xl shadow-lg border border-white/20">
                          <span className="text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg">{event.price}</span>
                          <img src={stxLogo} alt="STX" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full object-cover" />
                        </div>
                      </div>

                      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-10">
                        <div className="max-w-xl md:max-w-2xl lg:max-w-3xl space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4">
                          {/* Featured Badge */}
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 md:py-1.5 bg-white/15 backdrop-blur-md text-white text-[10px] sm:text-xs md:text-sm font-medium rounded-full border border-white/25">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FE5C02] animate-pulse" />
                            FEATURED EVENT
                          </div>

                          {/* Title */}
                          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight drop-shadow-2xl line-clamp-2">
                            {event.title}
                          </h1>

                          {/* Available Badge */}
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-black/30 backdrop-blur-md rounded-lg border border-white/20">
                            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white/90" />
                            <span className="text-white font-medium text-[10px] sm:text-xs md:text-sm">{event.available} available</span>
                          </div>

                          {/* Event Details - Grid Layout */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4">
                            <div className="flex items-start gap-1.5 sm:gap-2 md:gap-2.5 p-1.5 sm:p-2 md:p-2.5 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 text-[#FE5C02] mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-[10px] sm:text-xs md:text-sm truncate">{event.date}</p>
                                <p className="text-[9px] sm:text-[10px] md:text-xs text-white/80 truncate">{event.time}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5 sm:gap-2 md:gap-2.5 p-1.5 sm:p-2 md:p-2.5 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 text-[#FE5C02] mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-[10px] sm:text-xs md:text-sm line-clamp-2">{event.location}</p>
                              </div>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <div className="pt-0.5 sm:pt-1 md:pt-1.5">
                            <button className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 bg-white hover:bg-gray-100 text-black text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold rounded-lg md:rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                              <span>Get Tickets</span>
                              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Navigation Arrows */}
              {heroEvents.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      if (sliderRef.current) {
                        const scrollAmount = sliderRef.current.offsetWidth;
                        sliderRef.current.scrollTo({
                          left: sliderRef.current.scrollLeft - scrollAmount,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all hover:scale-110 active:scale-95 border border-white/20 hidden md:flex"
                    aria-label="Previous"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (sliderRef.current) {
                        const scrollAmount = sliderRef.current.offsetWidth;
                        sliderRef.current.scrollTo({
                          left: sliderRef.current.scrollLeft + scrollAmount,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all hover:scale-110 active:scale-95 border border-white/20 hidden md:flex"
                    aria-label="Next"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Slide Dots Indicator */}
              {heroEvents.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {heroEvents.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (sliderRef.current) {
                          sliderRef.current.scrollTo({
                            left: index * sliderRef.current.offsetWidth,
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentSlide
                          ? 'w-8 h-2 bg-white'
                          : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Filter - Moved below hero banner */}
        <div className="mb-6 md:mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? "bg-[#FE5C02] text-white shadow-lg"
                    : "bg-[#1A1A1A] text-gray-400 active:bg-gray-800 md:hover:bg-gray-800 md:hover:text-white border border-gray-800"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Events - Horizontal Slider */}
        {featuredEvents.length > 0 && (
          <div className="mb-8 md:mb-12">
            <div className="mb-5 md:mb-6">
              <h2 className="section-title-mobile md:section-title-desktop text-white">More Featured</h2>
            </div>
            
            {/* Horizontal Scrollable Container with Integrated Arrows */}
            <div className="relative -mx-4 md:mx-0">
              {/* Navigation Arrows - Integrated on Banner (OpenSea Style) */}
              {featuredEvents.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      if (sliderRef.current) {
                        const scrollAmount = sliderRef.current.offsetWidth;
                        sliderRef.current.scrollTo({
                          left: sliderRef.current.scrollLeft - scrollAmount,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all hover:scale-110 active:scale-95 border border-white/20"
                    aria-label="Previous"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (sliderRef.current) {
                        const scrollAmount = sliderRef.current.offsetWidth;
                        sliderRef.current.scrollTo({
                          left: sliderRef.current.scrollLeft + scrollAmount,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all hover:scale-110 active:scale-95 border border-white/20"
                    aria-label="Next"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              <div 
                ref={sliderRef}
                className="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 md:px-0 snap-x snap-mandatory scrollbar-none scroll-smooth"
                style={{
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch'
                } as React.CSSProperties}
              >
                {featuredEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/app/event/${event.id}`}
                    className="group relative flex-shrink-0 w-[85vw] md:w-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 active:scale-[0.98] transition-all duration-200 snap-center"
                  >
                    {/* Full Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${event.image}')` }}
                    >
                      {/* Gradient Overlay - Balanced for readability and image visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 md:bg-gradient-to-r md:from-black/85 md:via-black/60 md:to-black/20" />
                    </div>

                    {/* Content Container */}
                    <div className="relative min-h-[380px] md:min-h-[420px] flex flex-col justify-end p-6 md:p-10">
                      {/* Badges - Top Left */}
                      <div className="absolute top-5 left-5 md:top-6 md:left-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm text-black text-xs md:text-sm font-bold rounded-lg shadow-lg">
                          <div className="w-2 h-2 rounded-full bg-[#FE5C02] animate-pulse" />
                          FEATURED
                        </div>
                        
                        {/* Verified Badge */}
                        {event.verified && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/95 backdrop-blur-sm text-white text-xs md:text-sm font-bold rounded-lg shadow-lg">
                            <CheckCircle className="w-4 h-4" />
                            VERIFIED
                          </div>
                        )}
                        
                        {/* Early Access Badge */}
                        {event.earlyAccess && userTier?.earlyAccess && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/95 to-orange-500/95 backdrop-blur-sm text-white text-xs md:text-sm font-bold rounded-lg shadow-lg">
                            <span>⚡</span>
                            EARLY ACCESS
                          </div>
                        )}
                      </div>

                      {/* Floating Stats - Top Right */}
                      <div className="absolute top-5 right-5 md:top-6 md:right-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-black/60 backdrop-blur-md rounded-xl">
                          <Users className="w-5 h-5 text-white" />
                          <span className="text-white text-sm md:text-base font-semibold">{event.available} of {event.total}</span>
                        </div>
                        <div className="px-4 py-2.5 bg-[#FE5C02]/90 backdrop-blur-md rounded-xl text-center">
                          <span className="text-white text-sm md:text-base font-bold">{event.price}</span>
                        </div>
                      </div>

                      {/* Main Content - Bottom */}
                      <div className="space-y-4 md:space-y-6">
                        {/* Title */}
                        <h3 className="text-3xl md:text-5xl font-bold text-white group-hover:text-[#FE5C02] transition-colors line-clamp-2 drop-shadow-lg">
                          {event.title}
                        </h3>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl">
                          {/* Date & Time */}
                          <div className="flex items-start gap-3">
                            <Calendar className="w-6 h-6 text-gray-300 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-white text-base md:text-lg font-semibold mb-1">{event.date}</p>
                              <p className="text-gray-300 text-sm">{event.time}</p>
                            </div>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-start gap-3">
                            <MapPin className="w-6 h-6 text-gray-300 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-white text-base md:text-lg font-semibold line-clamp-2">{event.location}</p>
                            </div>
                          </div>
                        </div>

                        {/* CTA Button - Desktop */}
                        <div className="hidden md:block pt-4">
                          <button className="flex items-center gap-3 px-8 py-4 bg-[#FE5C02] hover:bg-[#E54F02] text-white text-lg font-semibold rounded-xl transition-all shadow-lg group-hover:shadow-[#FE5C02]/50 group-hover:scale-105">
                            <span>Get Tickets</span>
                            <ArrowRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Slide Dots Indicator - OpenSea Style (Smaller and Subtle) */}
              {featuredEvents.length > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-4 md:mt-5">
                  {featuredEvents.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (sliderRef.current) {
                          sliderRef.current.scrollTo({
                            left: index * sliderRef.current.offsetWidth,
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentSlide
                          ? 'w-6 h-1.5 bg-white'
                          : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Events */}
        <div>
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <h2 className="section-title-mobile md:section-title-desktop text-white">
              {selectedCategory === "all" ? "All Events" : categories.find(c => c.id === selectedCategory)?.label}
            </h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-gray-800 text-white rounded-lg border border-gray-800 transition-colors flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="py-8">
              <BrowseEventsSkeleton />
            </div>
          ) : regularEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {regularEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/app/event/${event.id}`}
                  className="group block"
                >
                  <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-gray-800/50 active:scale-[0.98] md:hover:border-[#FE5C02]/50 transition-all duration-300 md:hover:shadow-2xl md:hover:shadow-[#FE5C02]/10">
                    {/* Event Image */}
                    <div className="relative h-56 md:h-64 bg-cover bg-center overflow-hidden"
                      style={{ backgroundImage: `url('${event.image}')` }}
                    >
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Verified Badge */}
                      {event.verified && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 bg-blue-500/90 text-white text-xs font-bold rounded-xl shadow-lg backdrop-blur-sm">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>VERIFIED</span>
                        </div>
                      )}

                      {/* Early Access Badge */}
                      {event.earlyAccess && userTier?.earlyAccess && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg backdrop-blur-sm">
                          <span>⚡</span>
                          <span>EARLY ACCESS</span>
                        </div>
                      )}

                      {/* Lock Badge for non-tier users */}
                      {event.earlyAccess && !userTier?.earlyAccess && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-black/80 backdrop-blur-sm text-gray-300 text-xs font-bold rounded-xl border border-gray-700">
                          <span>🔒</span>
                          <span>TIER ONLY</span>
                        </div>
                      )}

                      {/* Price Badge - Bottom Left */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/20">
                        <span className="text-white font-bold">{event.price}</span>
                        <img src={stxLogo} alt="STX" className="w-5 h-5 rounded-full object-cover" />
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#FE5C02] transition-colors line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3 text-gray-400 text-sm">
                          <Calendar className="w-5 h-5 flex-shrink-0 text-[#FE5C02]" />
                          <span className="truncate">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400 text-sm">
                          <MapPin className="w-5 h-5 flex-shrink-0 text-[#FE5C02]" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400 text-sm">
                          <Users className="w-5 h-5 flex-shrink-0 text-[#FE5C02]" />
                          <span>{event.available} tickets available</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-4 border-t border-gray-800">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white font-semibold group-hover:text-[#FE5C02] transition-colors">
                            View Details
                          </span>
                          <ArrowRight className="w-5 h-5 text-[#FE5C02] transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 md:py-16">
              <div className="w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="card-title-mobile md:card-title-desktop text-white mb-2">No events found</h3>
              <p className="body-text-mobile md:body-text-desktop text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Activity Feed Section */}
        <div className="mt-12 md:mt-16">
          <ActivityFeed
            showGlobalActivity={true}
            maxItems={10}
            className="max-w-full"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default BrowseEvents;
