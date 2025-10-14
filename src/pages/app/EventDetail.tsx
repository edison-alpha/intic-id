import React, { useState } from "react";
import AppLayout from "@/components/app/AppLayout";
import { useParams, Link } from "react-router-dom";
import AddToCalendar from "@/components/AddToCalendar";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Plus,
  Minus,
  Share2,
  Heart,
  Clock,
  Shield,
  CheckCircle2,
  Ticket,
  Star,
  Music,
  Zap
} from "lucide-react";
import { toast } from "sonner";

const EventDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState("cat1a");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Mock user tier - in production, get from blockchain/wallet
  const userTier = {
    name: "Silver",
    discount: 10, // 10% discount
    earlyAccess: true,
    icon: "🥈"
  };

  // Ticket types with pricing based on seating sections
  const ticketTypes = [
    { id: "festival-a1", name: "Festival A1", price: 150, color: "#FF6B35", available: 45, total: 50, description: "Premium front stage access" },
    { id: "festival-a2", name: "Festival A2", price: 150, color: "#FF6B35", available: 48, total: 50, description: "Premium front stage access" },
    { id: "festival-b1", name: "Festival B1", price: 100, color: "#8B7355", available: 52, total: 60, description: "Front stage standing" },
    { id: "festival-b2", name: "Festival B2", price: 100, color: "#8B7355", available: 55, total: 60, description: "Front stage standing" },
    { id: "cat1a", name: "CAT 1A", price: 80, color: "#FF8C42", available: 75, total: 80, description: "Side premium seating" },
    { id: "cat1b", name: "CAT 1B", price: 80, color: "#4ECDC4", available: 70, total: 80, description: "Side premium seating" },
    { id: "cat2", name: "CAT 2", price: 60, color: "#3D5A80", available: 120, total: 150, description: "Mid-tier seating" },
    { id: "cat3a", name: "CAT 3A", price: 40, color: "#98C379", available: 95, total: 100, description: "Upper seating left" },
    { id: "cat3b", name: "CAT 3B", price: 40, color: "#B8E986", available: 98, total: 100, description: "Upper seating right" },
    { id: "cat4", name: "CAT 4", price: 25, color: "#A94064", available: 180, total: 200, description: "Back seating" }
  ];

  // Mock event data
  const event = {
    id: parseInt(id || "1"),
    title: "Summer Music Festival 2025",
    subtitle: "featuring ALL-STARS 2.0",
    date: "July 15, 2025",
    time: "6:00 PM - 11:00 PM",
    doors: "5:00 PM",
    location: "Madison Square Garden, New York",
    fullAddress: "4 Pennsylvania Plaza, New York, NY 10001",
    coordinates: {
      lat: 40.750504,
      lng: -73.993439
    },
    category: "Concert",
    price: 25,
    available: 450,
    total: 500,
    image: "/background-section1.png",
    organizer: "Live Nation Events",
    
    // Artists & Lineup
    headliners: [
      {
        name: "The Weeknd",
        role: "Headliner",
        time: "9:30 PM - 11:00 PM",
        image: "🎤",
        bio: "Multi-platinum artist with numerous Grammy Awards and chart-topping hits worldwide."
      },
      {
        name: "Dua Lipa",
        role: "Co-Headliner",
        time: "8:00 PM - 9:15 PM",
        image: "🎵",
        bio: "International pop sensation known for hits like 'Levitating' and 'Don't Start Now'."
      }
    ],
    
    supportingActs: [
      {
        name: "Khalid",
        role: "Special Guest",
        time: "7:00 PM - 7:45 PM",
        image: "🎸"
      },
      {
        name: "DJ Snake",
        role: "Opening DJ",
        time: "6:00 PM - 6:45 PM",
        image: "🎧"
      }
    ],
    
    // Event Description
    description: "Join us for the most anticipated music festival of the summer! Summer Music Festival 2025 brings together the biggest names in music for one unforgettable night at the legendary Madison Square Garden.\n\nThis is more than just a concert - it's an immersive experience featuring cutting-edge production, stunning visuals, and world-class sound. From chart-topping pop hits to electronic dance anthems, this festival has something for everyone.",
    
    highlights: [
      "4+ hours of non-stop entertainment",
      "State-of-the-art stage production with LED screens",
      "Premium food and beverage options",
      "VIP lounge with exclusive perks",
      "Official merchandise available",
      "Professional photography zones"
    ],
    
    // Venue Information
    venue: {
      name: "Madison Square Garden",
      nickname: "The World's Most Famous Arena",
      capacity: 20789,
      yearBuilt: 1968,
      description: "Madison Square Garden, colloquially known as The Garden or by its initials MSG, is a multi-purpose indoor arena in New York City. It is located in Midtown Manhattan between Seventh and Eighth Avenues from 31st to 33rd Street, above Pennsylvania Station.",
      features: [
        "20,789 seat capacity for concerts",
        "360-degree seating configuration",
        "State-of-the-art sound system by Meyer Sound",
        "HD video displays and LED ribbon boards",
        "Climate-controlled environment",
        "Wheelchair accessible throughout",
        "Multiple food and beverage concessions",
        "On-site parking available"
      ],
      transportation: [
        "Penn Station (LIRR, NJ Transit, Amtrak) - Direct access",
        "Subway: 1, 2, 3, A, C, E trains to 34th St-Penn Station",
        "Multiple bus lines including M4, M16, M34",
        "Nearby parking garages within walking distance"
      ],
      nearbyHotels: [
        "Hotel Pennsylvania - 0.1 miles",
        "The New Yorker - 0.2 miles",
        "Courtyard New York Manhattan/Herald Square - 0.3 miles"
      ]
    },
    
    // Additional Info
    ageRestriction: "All ages welcome. Under 16 must be accompanied by an adult.",
    dresscode: "Casual. Comfortable shoes recommended for standing sections.",
    prohibitedItems: [
      "Professional cameras with detachable lenses",
      "Video recording equipment",
      "Weapons of any kind",
      "Outside food and beverages",
      "Large bags (>14x14x6 inches)",
      "Selfie sticks and monopods"
    ],
    
    features: [
      "VIP lounge access (VIP tickets only)",
      "Meet & greet opportunities (select tiers)",
      "Exclusive merchandise",
      "Food & beverage concessions",
      "Professional sound and lighting",
      "Accessible seating available"
    ],
    
    royalty: 5
  };

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketType) || ticketTypes[0];
  const soldPercentage = ((event.total - event.available) / event.total) * 100;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handlePurchase = () => {
    const finalPrice = selectedTicket.price * (1 - (userTier?.discount || 0) / 100);
    toast.success(`Purchasing ${quantity} ${selectedTicket.name} ticket(s) for ${(quantity * finalPrice).toFixed(2)} sBTC`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Removed from favorites" : "Added to favorites");
  };

  const handleSeatSelect = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else if (selectedSeats.length < quantity) {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div
          className="relative h-96 bg-cover bg-center"
          style={{ backgroundImage: `url('${event.image}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />

          <div className="relative h-full px-6 md:px-8">
            {/* Back Button */}
            <div className="pt-6">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 text-white hover:text-[#FE5C02] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Events</span>
              </Link>
            </div>

            {/* Event Title & Actions */}
            <div className="absolute bottom-8 left-0 right-0 px-6 md:px-8">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="inline-block px-3 py-1 bg-[#FE5C02] text-white text-xs font-bold rounded-full">
                      {event.category.toUpperCase()}
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      ON SALE NOW
                    </div>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 leading-tight">
                    {event.title}
                  </h1>
                  {event.subtitle && (
                    <p className="text-xl md:text-2xl text-[#FE5C02] font-semibold mb-2">{event.subtitle}</p>
                  )}
                  <div className="flex items-center gap-3 text-gray-300">
                    <span className="text-lg">by {event.organizer}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-lg">{event.venue.name}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleLike}
                    className={`p-3 md:p-4 rounded-full border-2 transition-all transform hover:scale-110 ${
                      isLiked
                        ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/50"
                        : "bg-[#1A1A1A]/80 backdrop-blur-sm border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-500"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 md:p-4 bg-[#1A1A1A]/80 backdrop-blur-sm border-2 border-gray-700 rounded-full text-gray-400 hover:text-white hover:border-[#FE5C02] transition-all transform hover:scale-110"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pl-4 pr-4 md:pl-6 md:pr-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Details */}
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border-2 border-gray-800 rounded-2xl p-6 hover:border-[#FE5C02]/30 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-[#FE5C02] to-purple-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-white">Quick Info</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:border-[#FE5C02]/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-[#FE5C02] to-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Date & Time</p>
                        <p className="text-white font-bold text-lg">{event.date}</p>
                        <p className="text-gray-300 text-sm">{event.time}</p>
                        <p className="text-gray-500 text-xs mt-1">Doors open: {event.doors}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:border-[#FE5C02]/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Venue</p>
                        <p className="text-white font-bold text-lg">{event.venue.name}</p>
                        <p className="text-gray-300 text-sm">{event.location}</p>
                        <p className="text-gray-500 text-xs mt-1">Capacity: {event.venue.capacity.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:border-[#FE5C02]/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-green-600 to-green-800 rounded-lg group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Availability</p>
                        <p className="text-white font-bold text-lg">{event.available} tickets left</p>
                        <p className="text-gray-300 text-sm">of {event.total} total</p>
                        <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-600"
                            style={{ width: `${(event.available / event.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="group p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:border-[#FE5C02]/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Blockchain</p>
                        <p className="text-white font-bold text-lg">Stacks Network</p>
                        <p className="text-gray-300 text-sm">NFT Tickets (ERC-721)</p>
                        <p className="text-gray-500 text-xs mt-1">{event.royalty}% creator royalty</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">About This Event</h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  {event.description.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <h3 className="text-lg font-semibold text-white mb-3 mt-6">Event Highlights:</h3>
                <ul className="space-y-2">
                  {event.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-300">
                      <div className="w-1.5 h-1.5 bg-[#FE5C02] rounded-full" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Artists & Lineup */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Artists & Lineup</h2>
                
                {/* Headliners */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Headliners</h3>
                  <div className="space-y-4">
                    {event.headliners.map((artist, index) => (
                      <div key={index} className="flex gap-4 p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:border-[#FE5C02]/50 transition-all">
                        <div className="text-5xl flex-shrink-0">{artist.image}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-bold text-white">{artist.name}</h4>
                            <span className="px-2 py-1 bg-[#FE5C02] text-white text-xs font-bold rounded">
                              {artist.role}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{artist.bio}</p>
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{artist.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supporting Acts */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Supporting Acts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.supportingActs.map((artist, index) => (
                      <div key={index} className="flex gap-3 p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl">
                        <div className="text-3xl flex-shrink-0">{artist.image}</div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-1">{artist.name}</h4>
                          <p className="text-gray-400 text-xs mb-2">{artist.role}</p>
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{artist.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doors Open Info */}
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    <strong>Doors open at {event.doors}</strong> - Arrive early to avoid queues and enjoy pre-show activities!
                  </p>
                </div>
              </div>

              {/* Venue Information */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Venue Information</h2>
                
                <div className="space-y-6">
                  {/* Venue Header */}
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-[#FE5C02] to-purple-600 rounded-xl">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1">{event.venue.name}</h3>
                      <p className="text-[#FE5C02] font-medium mb-2">{event.venue.nickname}</p>
                      <p className="text-gray-400 text-sm">
                        Capacity: {event.venue.capacity.toLocaleString()} | Built: {event.venue.yearBuilt}
                      </p>
                    </div>
                  </div>

                  {/* About Venue */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">About the Venue</h4>
                    <p className="text-gray-300 leading-relaxed">{event.venue.description}</p>
                  </div>

                  {/* Venue Features */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Venue Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {event.venue.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transportation */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">How to Get There</h4>
                    <ul className="space-y-2">
                      {event.venue.transportation.map((option, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-300 text-sm">
                          <div className="w-1.5 h-1.5 bg-[#FE5C02] rounded-full mt-2" />
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Nearby Hotels */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Nearby Hotels</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {event.venue.nearbyHotels.map((hotel, index) => (
                        <div key={index} className="p-3 bg-[#0A0A0A] rounded-lg text-gray-300 text-sm">
                          {hotel}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Important Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Age Restriction</h4>
                    <p className="text-gray-300 text-sm">{event.ageRestriction}</p>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Dress Code</h4>
                    <p className="text-gray-300 text-sm">{event.dresscode}</p>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Prohibited Items</h4>
                    <ul className="space-y-2">
                      {event.prohibitedItems.map((item, index) => (
                        <li key={index} className="flex items-center gap-3 text-gray-300 text-sm">
                          <Minus className="w-4 h-4 text-red-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Seating Plan */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Seating Plan</h2>
                
                {/* Seating Map Container */}
                <div className="relative w-full max-w-2xl mx-auto aspect-square bg-[#0A0A0A] rounded-2xl p-8">
                  {/* Outer Ring (CAT 4) */}
                  <svg viewBox="0 0 400 400" className="w-full h-full">
                    {/* CAT 4 - Bottom Back */}
                    <path
                      d="M 50 300 Q 50 350 100 370 L 300 370 Q 350 350 350 300 L 350 280 Q 350 330 300 350 L 100 350 Q 50 330 50 280 Z"
                      fill={hoveredSection === "cat4" ? "#C94D6F" : "#A94064"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("cat4")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("cat4")}
                    />
                    <text x="200" y="340" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
                      CAT 4
                    </text>

                    {/* CAT 2 - Middle Ring Bottom */}
                    <path
                      d="M 80 250 Q 80 290 130 310 L 270 310 Q 320 290 320 250 L 320 230 Q 320 270 270 290 L 130 290 Q 80 270 80 230 Z"
                      fill={hoveredSection === "cat2" ? "#4D6A90" : "#3D5A80"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("cat2")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("cat2")}
                    />
                    <text x="200" y="280" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                      CAT 2
                    </text>

                    {/* CAT 3A - Left Upper */}
                    <path
                      d="M 50 180 L 50 240 Q 60 250 90 250 L 90 190 Q 80 180 50 180 Z"
                      fill={hoveredSection === "cat3a" ? "#A8D389" : "#98C379"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("cat3a")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("cat3a")}
                    />
                    <text x="70" y="220" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      CAT
                    </text>
                    <text x="70" y="235" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      3A
                    </text>

                    {/* CAT 3B - Right Upper */}
                    <path
                      d="M 350 180 L 350 240 Q 340 250 310 250 L 310 190 Q 320 180 350 180 Z"
                      fill={hoveredSection === "cat3b" ? "#C8F996" : "#B8E986"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("cat3b")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("cat3b")}
                    />
                    <text x="330" y="220" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      CAT
                    </text>
                    <text x="330" y="235" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      3B
                    </text>

                    {/* CAT 1A - Left Side */}
                    <path
                      d="M 90 140 L 90 200 L 120 200 L 120 140 Z"
                      fill={hoveredSection === "cat1a" ? "#FF9C52" : "#FF8C42"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("cat1a")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("cat1a")}
                    />
                    <text x="105" y="175" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      CAT
                    </text>
                    <text x="105" y="190" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      1A
                    </text>

                    {/* CAT 1B - Right Side */}
                    <path
                      d="M 310 140 L 310 200 L 280 200 L 280 140 Z"
                      fill={hoveredSection === "cat1b" ? "#5EDCD4" : "#4ECDC4"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("cat1b")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("cat1b")}
                    />
                    <text x="295" y="175" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      CAT
                    </text>
                    <text x="295" y="190" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                      1B
                    </text>

                    {/* Festival B1 - Left Front */}
                    <path
                      d="M 130 140 L 130 200 L 170 200 L 170 140 Z"
                      fill={hoveredSection === "festival-b1" ? "#9B8365" : "#8B7355"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("festival-b1")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("festival-b1")}
                    />
                    <text x="150" y="162" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      FESTIVAL
                    </text>
                    <text x="150" y="178" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                      B1
                    </text>

                    {/* Festival B2 - Right Front */}
                    <path
                      d="M 270 140 L 270 200 L 230 200 L 230 140 Z"
                      fill={hoveredSection === "festival-b2" ? "#9B8365" : "#8B7355"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("festival-b2")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("festival-b2")}
                    />
                    <text x="250" y="162" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      FESTIVAL
                    </text>
                    <text x="250" y="178" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                      B2
                    </text>

                    {/* Festival A1 - Left Premium */}
                    <path
                      d="M 130 80 L 130 130 L 170 130 L 170 80 Z"
                      fill={hoveredSection === "festival-a1" ? "#FF7B45" : "#FF6B35"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("festival-a1")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("festival-a1")}
                    />
                    <text x="150" y="98" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      FESTIVAL
                    </text>
                    <text x="150" y="116" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                      A1
                    </text>

                    {/* Festival A2 - Right Premium */}
                    <path
                      d="M 270 80 L 270 130 L 230 130 L 230 80 Z"
                      fill={hoveredSection === "festival-a2" ? "#FF7B45" : "#FF6B35"}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-80"
                      onMouseEnter={() => setHoveredSection("festival-a2")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setSelectedTicketType("festival-a2")}
                    />
                    <text x="250" y="98" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      FESTIVAL
                    </text>
                    <text x="250" y="116" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                      A2
                    </text>

                    {/* Stage */}
                    <rect
                      x="160"
                      y="40"
                      width="80"
                      height="30"
                      fill="white"
                      stroke="#1A1A1A"
                      strokeWidth="2"
                    />
                    <text x="200" y="60" textAnchor="middle" fill="#0A0A0A" fontSize="14" fontWeight="bold">
                      STAGE
                    </text>

                    {/* Center Circle */}
                    <circle cx="200" cy="170" r="25" fill="#0A0A0A" stroke="#FE5C02" strokeWidth="2" />
                  </svg>
                </div>

                {/* Legend */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {ticketTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedTicketType(type.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedTicketType === type.id
                          ? 'border-[#FE5C02] bg-[#FE5C02]/10'
                          : 'border-gray-800 bg-[#0A0A0A] hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="text-white text-sm font-bold">{type.name}</span>
                      </div>
                      <p className="text-gray-400 text-xs mb-1">{type.description}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[#FE5C02] text-lg font-bold">{type.price}</span>
                        <span className="text-gray-400 text-xs">sBTC</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        {type.available}/{type.total} left
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Map */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Location</h2>
                <div className="space-y-4">
                  {/* Address Info */}
                  <div className="flex items-start gap-3 p-4 bg-[#0A0A0A] rounded-lg">
                    <MapPin className="w-5 h-5 text-[#FE5C02] flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-medium mb-1">{event.location}</p>
                      <p className="text-gray-400 text-sm">{event.fullAddress}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        Coordinates: {event.coordinates.lat}, {event.coordinates.lng}
                      </p>
                    </div>
                  </div>

                  {/* Google Maps Embed */}
                  <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-gray-800">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao&q=${event.coordinates.lat},${event.coordinates.lng}&zoom=15`}
                      allowFullScreen
                    />
                  </div>

                  {/* Direction Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${event.coordinates.lat},${event.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A0A0A] hover:bg-gray-800 text-white rounded-lg transition-colors border border-gray-800"
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Get Directions</span>
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${event.coordinates.lat},${event.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A0A0A] hover:bg-gray-800 text-white rounded-lg transition-colors border border-gray-800"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm font-medium">View on Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Purchase Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border-2 border-gray-800 rounded-2xl p-6 sticky top-8 shadow-2xl">
                {/* Tier Badge */}
                {userTier && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-[#FE5C02]/20 to-purple-600/20 border-2 border-[#FE5C02]/50 rounded-xl animate-pulse-slow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl animate-bounce">{userTier.icon}</div>
                        <div>
                          <p className="text-white font-bold">{userTier.name} Tier</p>
                          <p className="text-[#FE5C02] text-sm font-bold">Save {userTier.discount}% on tickets!</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                )}

                {/* Ticket Type Selection */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#FE5C02] to-purple-600 rounded-full" />
                    <label className="text-white text-lg font-bold">Choose Your Seat</label>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {ticketTypes.map((ticketType) => {
                      const isSelected = selectedTicketType === ticketType.id;
                      const availablePercentage = (ticketType.available / ticketType.total) * 100;
                      const isLowStock = availablePercentage < 20;
                      
                      return (
                        <button
                          key={ticketType.id}
                          onClick={() => setSelectedTicketType(ticketType.id)}
                          className={`group p-3 rounded-xl border-2 transition-all text-left transform hover:scale-[1.02] ${
                            isSelected
                              ? 'border-[#FE5C02] bg-[#FE5C02]/10 shadow-lg shadow-[#FE5C02]/20'
                              : 'border-gray-800 bg-[#0A0A0A] hover:border-gray-700 hover:bg-gray-900/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full transition-transform ${isSelected ? 'scale-110' : ''}`}
                                style={{ backgroundColor: ticketType.color }}
                              />
                              <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                {ticketType.name}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#FE5C02]" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-white font-bold text-lg">{ticketType.price}</span>
                              <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-4 h-4" />
                            </div>
                          </div>
                          <p className="text-gray-400 text-xs mb-2">{ticketType.description}</p>
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-medium ${isLowStock ? 'text-orange-400' : 'text-gray-500'}`}>
                              {isLowStock && '🔥 '}{ticketType.available}/{ticketType.total} left
                            </p>
                            {isLowStock && (
                              <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-bold">
                                HOT
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Ticket Summary */}
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Selected: {ticketTypes.find(t => t.id === selectedTicketType)?.name}</p>
                  
                  {/* Show discount pricing */}
                  {userTier && userTier.discount > 0 ? (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2 opacity-50">
                          <p className="text-xl font-bold text-gray-500 line-through">
                            {ticketTypes.find(t => t.id === selectedTicketType)?.price}
                          </p>
                          <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-5 h-5" />
                          <span className="text-sm text-gray-500">sBTC</span>
                        </div>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                          SAVE {userTier.discount}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-4xl font-bold text-white">
                          {((ticketTypes.find(t => t.id === selectedTicketType)?.price || 0) * (1 - userTier.discount / 100)).toFixed(2)}
                        </p>
                        <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-8 h-8" />
                        <span className="text-xl text-gray-400">sBTC</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        ≈ ${(((ticketTypes.find(t => t.id === selectedTicketType)?.price || 0) * (1 - userTier.discount / 100)) * 0.5).toFixed(2)} USD
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-4xl font-bold text-white">
                          {ticketTypes.find(t => t.id === selectedTicketType)?.price}
                        </p>
                        <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-8 h-8" />
                        <span className="text-xl text-gray-400">sBTC</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        ≈ ${((ticketTypes.find(t => t.id === selectedTicketType)?.price || 0) * 0.5).toFixed(2)} USD
                      </p>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Sold ({selectedTicket.name})</span>
                    <span className="text-white font-medium">{(((selectedTicket.total - selectedTicket.available) / selectedTicket.total) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FE5C02] to-orange-600 transition-all duration-500"
                      style={{ width: `${((selectedTicket.total - selectedTicket.available) / selectedTicket.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{selectedTicket.available} tickets remaining</p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-gray-400 text-sm mb-3">Quantity</label>
                  <div className="flex items-center justify-between bg-[#0A0A0A] rounded-lg p-2">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-white text-xl font-bold">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= 10}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Maximum 10 tickets per purchase</p>
                </div>

                {/* Total */}
                <div className="mb-6 p-4 bg-[#0A0A0A] rounded-lg border-l-4 border-[#FE5C02]">
                  {userTier && userTier.discount > 0 ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Subtotal</span>
                        <span className="text-gray-400 line-through">
                          {quantity * (ticketTypes.find(t => t.id === selectedTicketType)?.price || 0)} sBTC
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-green-400 text-sm">{userTier.name} Discount ({userTier.discount}%)</span>
                        <span className="text-green-400">
                          -{(quantity * (ticketTypes.find(t => t.id === selectedTicketType)?.price || 0) * userTier.discount / 100).toFixed(2)} sBTC
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                        <span className="text-white font-bold">Total</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white">
                            {(quantity * (ticketTypes.find(t => t.id === selectedTicketType)?.price || 0) * (1 - userTier.discount / 100)).toFixed(2)}
                          </span>
                          <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-6 h-6" />
                          <span className="text-lg text-gray-400">sBTC</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">
                          {quantity * (ticketTypes.find(t => t.id === selectedTicketType)?.price || 0)}
                        </span>
                        <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-6 h-6" />
                        <span className="text-lg text-gray-400">sBTC</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  className="group relative w-full py-5 bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-[#E54F02] hover:to-orange-700 text-white font-bold text-lg rounded-xl transition-all mb-4 overflow-hidden shadow-lg hover:shadow-xl hover:shadow-[#FE5C02]/50 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Purchase {quantity} Ticket{quantity > 1 ? 's' : ''}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>

                <div className="flex items-center gap-2 justify-center mb-4 text-gray-400 text-xs">
                  <Shield className="w-3 h-3" />
                  <span>Secured by Stacks Blockchain</span>
                </div>

                {/* Add to Calendar Button */}
                <AddToCalendar
                  eventName={event.title}
                  eventDate={event.date}
                  eventTime={event.time}
                  location={event.location}
                  description={event.description}
                  variant="button"
                  className="w-full justify-center mb-4"
                />

                {/* Staking Benefits Info */}
                {!userTier && (
                  <div className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-lg">
                    <p className="text-white font-medium text-sm mb-2">Want a discount?</p>
                    <p className="text-gray-400 text-xs mb-3">
                      Stake sBTC tokens to unlock exclusive benefits:
                    </p>
                    <ul className="space-y-1 mb-3">
                      <li className="text-gray-400 text-xs flex items-start gap-2">
                        <span className="text-[#FE5C02] mt-0.5">•</span>
                        <span>Bronze Tier: 5% discount</span>
                      </li>
                      <li className="text-gray-400 text-xs flex items-start gap-2">
                        <span className="text-[#FE5C02] mt-0.5">•</span>
                        <span>Silver Tier: 10% discount</span>
                      </li>
                      <li className="text-gray-400 text-xs flex items-start gap-2">
                        <span className="text-[#FE5C02] mt-0.5">•</span>
                        <span>Gold Tier: 15% discount</span>
                      </li>
                      <li className="text-gray-400 text-xs flex items-start gap-2">
                        <span className="text-[#FE5C02] mt-0.5">•</span>
                        <span>Platinum Tier: 20% discount</span>
                      </li>
                    </ul>
                    <Link
                      to="/app/staking"
                      className="block text-center py-2 bg-[#FE5C02]/10 hover:bg-[#FE5C02]/20 text-[#FE5C02] font-medium text-sm rounded-lg transition-colors"
                    >
                      Start Staking →
                    </Link>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Instant delivery to wallet</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Shield className="w-4 h-4" />
                    <span>Verified on blockchain</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Share2 className="w-4 h-4" />
                    <span>{event.royalty}% royalty on resale</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EventDetail;
