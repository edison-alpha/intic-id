import React, { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/app/AppLayout";
import { Search, Calendar, MapPin, Users, ArrowRight, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

const BrowseEvents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Mock user tier - in production, get from blockchain/wallet
  const userTier = {
    name: "Silver",
    discount: 10,
    earlyAccess: true,
    icon: "🥈"
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.offsetWidth;
      const newScrollLeft = direction === 'left' 
        ? sliderRef.current.scrollLeft - scrollAmount
        : sliderRef.current.scrollLeft + scrollAmount;
      
      sliderRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      // Update current slide based on scroll position
      setTimeout(() => {
        if (sliderRef.current) {
          const slideIndex = Math.round(sliderRef.current.scrollLeft / sliderRef.current.offsetWidth);
          setCurrentSlide(slideIndex);
        }
      }, 300);
    }
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

  const events = [
    {
      id: 1,
      title: "Summer Music Festival 2025",
      date: "July 15, 2025",
      time: "6:00 PM",
      location: "Madison Square Garden, New York",
      category: "concert",
      price: "0.00025 BTC",
      available: 450,
      total: 500,
      image: "/src/img/banner (1).png",
      featured: true,
      earlyAccess: true, // Tier holders get 24h early access
      earlyAccessEnds: "July 10, 2025 6:00 PM"
    },
    {
      id: 2,
      title: "NBA Finals Game 5",
      date: "June 20, 2025",
      time: "8:30 PM",
      location: "Staples Center, Los Angeles",
      category: "sports",
      price: "0.00050 BTC",
      available: 120,
      total: 200,
      image: "/src/img/banner (2).png",
      featured: true,
      earlyAccess: true,
      earlyAccessEnds: "June 15, 2025 8:30 PM"
    },
    {
      id: 3,
      title: "Web3 Conference 2025",
      date: "August 10, 2025",
      time: "9:00 AM",
      location: "Convention Center, San Francisco",
      category: "conference",
      price: "0.00015 BTC",
      available: 800,
      total: 1000,
      image: "/background-section3.png",
      featured: false,
      earlyAccess: false
    },
    {
      id: 4,
      title: "Jazz Night Live",
      date: "May 28, 2025",
      time: "7:30 PM",
      location: "Blue Note Jazz Club, NYC",
      category: "concert",
      price: "0.00030 BTC",
      available: 85,
      total: 100,
      image: "/background-section1.png",
      featured: false,
      earlyAccess: true,
      earlyAccessEnds: "May 23, 2025 7:30 PM"
    },
    {
      id: 5,
      title: "Food & Wine Festival",
      date: "September 5, 2025",
      time: "12:00 PM",
      location: "Central Park, New York",
      category: "festival",
      price: "0.00020 BTC",
      available: 1500,
      total: 2000,
      image: "/background-section2.png",
      featured: false,
      earlyAccess: false
    },
    {
      id: 6,
      title: "Shakespeare in the Park",
      date: "July 1, 2025",
      time: "8:00 PM",
      location: "Delacorte Theater, NYC",
      category: "theater",
      price: "0.00010 BTC",
      available: 200,
      total: 250,
      image: "/background-section3.png",
      featured: false,
      earlyAccess: false
    }
  ];

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredEvents = filteredEvents.filter(e => e.featured);
  const regularEvents = filteredEvents.filter(e => !e.featured);

  return (
    <AppLayout>
      {/* Main Content */}
      <div className="px-4 pb-6 md:px-6 md:pb-6">
        {/* Title Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="page-title-mobile md:page-title-desktop text-white mb-2">
            Discover Events
          </h1>
          <p className="body-text-mobile md:body-text-desktop text-gray-400">Find and purchase NFT tickets for amazing events</p>
        </div>

        {/* Category Filter */}
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

        {/* Featured Events - OpenSea Style Hero Slider */}
        {featuredEvents.length > 0 && (
          <div className="mb-8 md:mb-12">
            <div className="mb-5 md:mb-6">
              <h2 className="section-title-mobile md:section-title-desktop text-white">Featured</h2>
            </div>
            
            {/* Horizontal Scrollable Container */}
            <div className="relative -mx-4 md:mx-0">
              {/* Navigation Arrows - Positioned on Card Sides */}
              {featuredEvents.length > 1 && (
                <>
                  <button
                    onClick={() => scrollSlider('left')}
                    className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20 p-2 hover:scale-110 transition-all active:scale-95"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
                  </button>
                  <button
                    onClick={() => scrollSlider('right')}
                    className="hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-20 p-2 hover:scale-110 transition-all active:scale-95"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
                  </button>
                </>
              )}
              
              <div 
                ref={sliderRef}
                className="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 md:px-0 snap-x snap-mandatory scrollbar-none scroll-smooth"
              >
                {featuredEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/app/event/${event.id}`}
                    className="group relative flex-shrink-0 w-[85vw] md:w-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 active:scale-[0.98] transition-all duration-200 snap-center"
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
                    <div className="relative min-h-[340px] md:min-h-[320px] flex flex-col justify-end p-5 md:p-8">
                      {/* Badges - Top Left */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-black caption-text-mobile font-bold rounded-lg shadow-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FE5C02] animate-pulse" />
                          FEATURED
                        </div>
                        
                        {/* Early Access Badge */}
                        {event.earlyAccess && userTier?.earlyAccess && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/95 to-orange-500/95 backdrop-blur-sm text-white caption-text-mobile font-bold rounded-lg shadow-lg">
                            <span>⚡</span>
                            EARLY ACCESS
                          </div>
                        )}
                      </div>

                      {/* Floating Stats - Mobile Only */}
                      <div className="absolute top-4 right-4 md:hidden flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl">
                          <Users className="w-4 h-4 text-white" />
                          <span className="text-white caption-text-mobile font-semibold">{event.available} left</span>
                        </div>
                        <div className="px-3 py-2 bg-[#FE5C02]/90 backdrop-blur-md rounded-xl text-center">
                          <span className="text-white caption-text-mobile font-bold">{event.price}</span>
                        </div>
                      </div>

                      {/* Main Content - Bottom */}
                      <div className="space-y-4 md:space-y-5">
                        {/* Title */}
                        <h3 className="text-2xl md:text-[32px] md:leading-[38px] font-bold text-white group-hover:text-[#FE5C02] transition-colors line-clamp-2 drop-shadow-lg">
                          {event.title}
                        </h3>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                          {/* Date & Time */}
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-white small-text-mobile md:body-text-desktop font-semibold mb-0.5">{event.date}</p>
                              <p className="text-gray-300 caption-text-mobile">{event.time}</p>
                            </div>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-white small-text-mobile md:body-text-desktop font-semibold line-clamp-2">{event.location}</p>
                            </div>
                          </div>
                          
                          {/* Availability - Desktop Only */}
                          <div className="hidden md:flex items-start gap-3">
                            <Users className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-white body-text-desktop font-semibold">{event.available} of {event.total}</p>
                              <p className="text-gray-300 caption-text-desktop">available</p>
                            </div>
                          </div>
                        </div>

                        {/* Price & CTA Row - Desktop */}
                        <div className="hidden md:flex items-center justify-between pt-3 border-t border-white/20">
                          {/* Price */}
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="caption-text-desktop text-gray-400 mb-1">Price</p>
                              <div className="flex items-center gap-2">
                                <p className="text-[24px] leading-none font-bold text-white">{event.price}</p>
                                <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-5 h-5 object-contain" />
                              </div>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <button className="flex items-center gap-2 px-6 py-3 bg-[#FE5C02] hover:bg-[#E54F02] text-white font-semibold rounded-xl transition-all shadow-lg group-hover:shadow-[#FE5C02]/50">
                            <span>Get Tickets</span>
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Slide Dots - OpenSea Style */}
              {featuredEvents.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-5 md:mt-6">
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
                          ? 'w-8 h-2 bg-white'
                          : 'w-2 h-2 bg-white/30 hover:bg-white/50'
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
          <h2 className="section-title-mobile md:section-title-desktop text-white mb-5 md:mb-6">
            {selectedCategory === "all" ? "All Events" : categories.find(c => c.id === selectedCategory)?.label}
          </h2>

          {regularEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {regularEvents.map((event) => (
                <div
                  key={event.id}
                  className="group bg-[#1A1A1A] rounded-3xl md:rounded-2xl overflow-hidden border border-gray-800 active:scale-[0.98] md:hover:border-[#FE5C02] transition-all duration-200 md:hover:transform md:hover:scale-[1.02]"
                >
                  <Link to={`/app/event/${event.id}`} className="block">
                    {/* Event Image */}
                    <div className="relative h-44 md:h-48 bg-cover bg-center overflow-hidden"
                      style={{ backgroundImage: `url('${event.image}')` }}
                    >
                      {/* Early Access Badge */}
                      {event.earlyAccess && userTier?.earlyAccess && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-lg shadow-lg">
                          <span>⚡</span>
                          <span>EARLY ACCESS</span>
                        </div>
                      )}
                      
                      {/* Lock Badge for non-tier users */}
                      {event.earlyAccess && !userTier?.earlyAccess && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900/90 backdrop-blur-sm text-gray-400 text-xs font-bold rounded-lg border border-gray-700">
                          <span>🔒</span>
                          <span>TIER ONLY</span>
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="p-5 md:p-5 pb-0">
                      <h3 className="card-title-mobile md:card-title-desktop text-white mb-4 group-hover:text-[#FE5C02] transition-colors line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-3 md:space-y-2.5 mb-5">
                        <div className="flex items-center gap-3 md:gap-2.5 text-gray-400 small-text-mobile md:small-text-desktop">
                          <Calendar className="w-[18px] h-[18px] md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-3 md:gap-2.5 text-gray-400 small-text-mobile md:small-text-desktop">
                          <MapPin className="w-[18px] h-[18px] md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Price Section with Buy Now Overlay */}
                  <div className="relative">
                    {/* Price Info - Always visible */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
                      <div>
                        <p className="caption-text-mobile md:caption-text-desktop text-gray-500 mb-0.5">From</p>
                        <div className="flex items-center gap-1.5">
                          <p className="price-text-mobile md:price-text-desktop text-white">{event.price}</p>
                          <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-4 h-4 md:w-5 md:h-5 object-contain" />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="caption-text-mobile md:caption-text-desktop text-gray-500 mb-0.5">Available</p>
                        <p className="small-text-mobile md:small-text-desktop text-white">{event.available}</p>
                      </div>
                    </div>

                    {/* Buy Now Button - Slides up from bottom on hover */}
                    <Link 
                      to={`/app/event/${event.id}`}
                      className="absolute bottom-0 left-0 right-0 h-14 flex items-center justify-between px-5 bg-[#FE5C02] text-white small-text-mobile md:small-text-desktop font-bold translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hover:bg-[#E54F02]"
                    >
                      <span>Buy Now</span>
                      <div className="flex items-center gap-1.5">
                        <span className="price-text-mobile md:price-text-desktop">{event.price}</span>
                        <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-4 h-4 md:w-5 md:h-5 object-contain" />
                      </div>
                    </Link>
                  </div>
                </div>
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
      </div>
    </AppLayout>
  );
};

export default BrowseEvents;
