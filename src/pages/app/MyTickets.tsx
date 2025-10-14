import React, { useState } from "react";
import AppLayout from "@/components/app/AppLayout";
import { Calendar, MapPin, QrCode, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import TicketQRModal from "@/components/TicketQRModal";
import AddToCalendar from "@/components/AddToCalendar";

const MyTickets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const handleShowQR = (ticket: any) => {
    setSelectedTicket({
      id: ticket.ticketNumber,
      eventName: ticket.eventName,
      eventDate: `${ticket.eventDate} at ${ticket.eventTime}`,
      ticketType: `General Admission (${ticket.quantity}x)`,
      holderName: "John Doe", // Get from wallet or profile
      seatNumber: ticket.quantity > 1 ? "Multiple" : "A-23"
    });
    setIsQRModalOpen(true);
  };

  const tickets = [
    {
      id: 1,
      eventName: "Summer Music Festival 2025",
      eventDate: "July 15, 2025",
      eventTime: "6:00 PM",
      location: "Madison Square Garden, New York",
      image: "/background-section1.png",
      ticketNumber: "#NFT-001234",
      status: "active",
      quantity: 2,
      purchaseDate: "May 10, 2025"
    },
    {
      id: 2,
      eventName: "NBA Finals Game 5",
      eventDate: "June 20, 2025",
      eventTime: "8:30 PM",
      location: "Staples Center, Los Angeles",
      image: "/background-section2.png",
      ticketNumber: "#NFT-001235",
      status: "active",
      quantity: 1,
      purchaseDate: "May 12, 2025"
    },
    {
      id: 3,
      eventName: "Web3 Conference 2025",
      eventDate: "August 10, 2025",
      eventTime: "9:00 AM",
      location: "Convention Center, San Francisco",
      image: "/background-section3.png",
      ticketNumber: "#NFT-001236",
      status: "active",
      quantity: 3,
      purchaseDate: "May 15, 2025"
    },
    {
      id: 4,
      eventName: "Jazz Night Live",
      eventDate: "May 28, 2025",
      eventTime: "7:30 PM",
      location: "Blue Note Jazz Club, NYC",
      image: "/background-section1.png",
      ticketNumber: "#NFT-001237",
      status: "used",
      quantity: 2,
      purchaseDate: "April 20, 2025"
    }
  ];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusColors = {
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    used: "bg-gray-500/10 text-gray-500 border-gray-500/20"
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 md:px-6 md:py-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">My Tickets</h1>
          <p className="text-sm md:text-base text-gray-400">View and manage your NFT event tickets</p>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row gap-3 md:gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 md:py-3 bg-[#1A1A1A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative sm:w-48">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-12 pr-8 py-3.5 md:py-3 bg-[#1A1A1A] border border-gray-800 rounded-2xl md:rounded-xl text-base md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Tickets</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-4 md:p-6">
            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Total Tickets</p>
            <p className="text-2xl md:text-3xl font-bold text-white">{tickets.reduce((sum, t) => sum + t.quantity, 0)}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-4 md:p-6">
            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Active Tickets</p>
            <p className="text-2xl md:text-3xl font-bold text-green-500">
              {tickets.filter(t => t.status === "active").reduce((sum, t) => sum + t.quantity, 0)}
            </p>
          </div>
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-4 md:p-6">
            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Upcoming</p>
            <p className="text-2xl md:text-3xl font-bold text-[#FE5C02]">
              {tickets.filter(t => t.status === "active").length}
            </p>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/app/ticket/${ticket.id}`}
                className="group bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl overflow-hidden active:scale-[0.98] md:hover:border-[#FE5C02] transition-all duration-200 md:hover:transform md:hover:scale-[1.02]"
              >
                {/* Event Image */}
                <div
                  className="h-36 md:h-40 bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${ticket.image}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
                  <div className="absolute top-3 right-3">
                    <div className={`px-3 py-1.5 md:py-1 text-xs font-bold rounded-full border ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                      {ticket.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-xs text-gray-400 mb-1">{ticket.ticketNumber}</p>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="p-4 md:p-5">
                  <h3 className="text-base md:text-lg font-bold text-white mb-3 group-hover:text-[#FE5C02] transition-colors line-clamp-2">
                    {ticket.eventName}
                  </h3>

                  <div className="space-y-2.5 md:space-y-2 mb-4">
                    <div className="flex items-center gap-2.5 md:gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{ticket.eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2.5 md:gap-2 text-gray-400 text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{ticket.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-800">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Quantity</p>
                      <p className="text-white text-lg font-bold">×{ticket.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Add to Calendar Button */}
                      <div onClick={(e) => e.preventDefault()}>
                        <AddToCalendar
                          eventName={ticket.eventName}
                          eventDate={ticket.eventDate}
                          eventTime={ticket.eventTime}
                          location={ticket.location}
                          ticketId={ticket.ticketNumber}
                          variant="icon"
                        />
                      </div>
                      
                      {/* QR Code Button */}
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleShowQR(ticket);
                        }}
                        className="p-2.5 md:p-2 bg-[#0A0A0A] border border-gray-800 rounded-xl md:rounded-lg active:border-[#FE5C02] md:hover:border-[#FE5C02] transition-colors group-hover:bg-[#FE5C02] group-hover:border-[#FE5C02]"
                      >
                        <QrCode className="w-5 h-5 text-gray-400 group-hover:text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16 bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 md:w-10 md:h-10 text-gray-600" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No tickets found</h3>
            <p className="text-sm md:text-base text-gray-400 mb-6">Try adjusting your search or browse events to get tickets</p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3.5 md:py-3 bg-[#FE5C02] active:bg-[#E54F02] md:hover:bg-[#E54F02] text-white text-sm font-semibold rounded-2xl md:rounded-xl transition-colors"
            >
              Browse Events
            </Link>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedTicket && (
        <TicketQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          ticket={selectedTicket}
        />
      )}
    </AppLayout>
  );
};

export default MyTickets;
