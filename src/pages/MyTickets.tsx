
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Calendar, MapPin, QrCode, Search, Filter, Wallet, RefreshCw, Bell, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import TicketQRModal from "@/components/TicketQRModal";
import AddToCalendar from "@/components/AddToCalendar";
import { getUserTicketsFromIndexerCached, clearNFTCache } from '@/services/nftFetcher';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import {
  getEventsNeedingReminders,
  scheduleEventReminder,
  EventReminder
} from '@/services/emailReminderService';

const MyTickets = () => {
  const { wallet } = useWallet();
  const userAddress = wallet?.address;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [upcomingReminders, setUpcomingReminders] = useState<EventReminder[]>([]);

  const handleShowQR = (ticket: any) => {
    setSelectedTicket({
      id: ticket.ticketNumber,
      eventName: ticket.eventName,
      eventDate: `${ticket.eventDate} at ${ticket.eventTime}`,
      ticketType: `${ticket.category} (${ticket.quantity}x)`,
      holderName: userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Unknown",
      seatNumber: `Token #${ticket.tokenId}`
    });
    setIsQRModalOpen(true);
  };

  useEffect(() => {
    if (userAddress) {
      loadUserTickets(userAddress);
    } else {
      setLoading(false);
    }

    // Load saved email from localStorage
    const savedEmail = localStorage.getItem('user-email');
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
  }, [userAddress]);

  useEffect(() => {
    // Check for upcoming events that need reminders
    if (tickets.length > 0 && userEmail) {
      const reminders = getEventsNeedingReminders(tickets, userEmail);
      setUpcomingReminders(reminders);
    }
  }, [tickets, userEmail]);

  const loadUserTickets = async (address: string) => {
    try {
      setLoading(true);
      console.log('📋 [MyTickets] Loading tickets for user:', address);

      const startTime = Date.now();
      const userTickets = await getUserTicketsFromIndexerCached(address);
      const loadTime = Date.now() - startTime;

      console.log(`✅ [MyTickets] Loaded ${userTickets.length} tickets in ${loadTime}ms`);
      console.table(userTickets.map(t => ({
        Event: t.eventName,
        Date: t.eventDate,
        Location: t.location,
        Status: t.status,
        TokenId: t.tokenId
      })));

      setTickets(userTickets);

      if (userTickets.length > 0) {
        console.log(`✅ [MyTickets] Found ${userTickets.length} ticket${userTickets.length > 1 ? 's' : ''} in ${(loadTime / 1000).toFixed(1)}s`);
      } else {
        console.warn('⚠️ [MyTickets] No tickets found for this user');
        toast.info('No tickets found', {
          description: 'Purchase tickets from events to see them here'
        });
      }
    } catch (error) {
      console.error('❌ [MyTickets] Error loading tickets:', error);
      toast.error('Failed to load tickets', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!userAddress) return;
    setRefreshing(true);

    // Clear cache to force fresh data from blockchain
    clearNFTCache(userAddress);
    console.log('🗑️ Cache cleared, fetching fresh data from blockchain...');

    await loadUserTickets(userAddress);
    setRefreshing(false);
    toast.success('Tickets refreshed from blockchain');
  };

  const handleSetupEmailReminders = async () => {
    if (!userEmail) {
      toast.error('Please enter your email address');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Save email to localStorage
    localStorage.setItem('user-email', userEmail);

    // Check for upcoming events
    const reminders = getEventsNeedingReminders(tickets, userEmail);
    setUpcomingReminders(reminders);

    if (reminders.length > 0) {
      toast.success(`Email reminders enabled for ${reminders.length} upcoming event${reminders.length > 1 ? 's' : ''}`);
    } else {
      toast.info('No upcoming events need reminders');
    }

    setShowEmailModal(false);
  };

  const handleSendReminderNow = async (ticket: any) => {
    if (!userEmail) {
      setShowEmailModal(true);
      toast.error('Please set up your email first');
      return;
    }

    const reminder: EventReminder = {
      userEmail,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      eventTime: ticket.eventTime,
      location: ticket.location,
      ticketNumber: ticket.ticketNumber,
      contractId: ticket.contractId,
    };

    const result = await scheduleEventReminder(reminder, '1day');
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Safety check - ensure properties are strings
    const eventName = String(ticket.eventName || '');
    const location = String(ticket.location || '');

    const matchesSearch = eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">My Tickets</h1>
              <p className="text-sm md:text-base text-gray-400">View and manage your NFT event tickets</p>
            </div>
            {userAddress && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="p-3 bg-[#1A1A1A] border border-gray-800 rounded-xl hover:border-[#FE5C02] transition-colors group"
                  title="Email reminders"
                >
                  {userEmail ? (
                    <Bell className="w-5 h-5 text-[#FE5C02]" />
                  ) : (
                    <Mail className="w-5 h-5 text-gray-400 group-hover:text-[#FE5C02]" />
                  )}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="p-3 bg-[#1A1A1A] border border-gray-800 rounded-xl hover:border-[#FE5C02] transition-colors disabled:opacity-50"
                  title="Refresh tickets"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Email Reminder Banner */}
          {upcomingReminders.length > 0 && userEmail && (
            <div className="bg-gradient-to-r from-[#FE5C02]/10 to-orange-600/10 border border-[#FE5C02]/20 rounded-xl p-4 flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#FE5C02] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Email Reminders Active</p>
                <p className="text-gray-400 text-xs">
                  You'll receive reminders for {upcomingReminders.length} upcoming event{upcomingReminders.length > 1 ? 's' : ''} at {userEmail}
                </p>
              </div>
              <button
                onClick={() => setShowEmailModal(true)}
                className="text-[#FE5C02] text-sm font-medium hover:underline"
              >
                Edit
              </button>
            </div>
          )}
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

        {/* No Wallet Connected */}
        {!userAddress && !loading ? (
          <div className="text-center py-12 md:py-16 bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 md:w-10 md:h-10 text-[#FE5C02]" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-sm md:text-base text-gray-400 mb-6">Connect your Stacks wallet to view your NFT tickets</p>
          </div>
        ) : loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 md:h-40 bg-gray-800" />
                <div className="p-4 md:p-5 space-y-3">
                  <div className="h-6 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-4 bg-gray-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 && !loading ? (
          /* No tickets at all - show helpful message */
          <div className="text-center py-12 md:py-16 bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 md:w-10 md:h-10 text-gray-600" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No tickets found</h3>
            <p className="text-sm md:text-base text-gray-400 mb-6">
              {userAddress ?
                "You don't have any event tickets yet. Browse events to get started!" :
                "Connect your wallet to view your tickets"
              }
            </p>
            <div className="space-y-3 max-w-md mx-auto text-left px-4">
              <p className="text-xs text-gray-500">
                💡 <strong>Tip:</strong> Tickets are NFTs on the Stacks blockchain
              </p>
              <p className="text-xs text-gray-500">
                🎫 Purchase tickets from any event to see them here
              </p>
              <p className="text-xs text-gray-500">
                🔍 Your wallet address: <code className="text-[#FE5C02]">{userAddress ? `${userAddress.slice(0, 8)}...${userAddress.slice(-4)}` : 'Not connected'}</code>
              </p>
            </div>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3.5 md:py-3 bg-[#FE5C02] active:bg-[#E54F02] md:hover:bg-[#E54F02] text-white text-sm font-semibold rounded-2xl md:rounded-xl transition-colors mt-6"
            >
              Browse Events
            </Link>
          </div>
        ) : filteredTickets.length > 0 ? (
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

      {/* Email Reminder Setup Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#FE5C02]/10 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#FE5C02]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Email Reminders</h3>
                <p className="text-sm text-gray-400">Get notified before your events</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FE5C02] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send you reminders 24 hours before your events
              </p>
            </div>

            {upcomingReminders.length > 0 && (
              <div className="mb-6 p-4 bg-[#0A0A0A] rounded-xl border border-gray-800">
                <p className="text-sm font-medium text-white mb-2">
                  Upcoming Events ({upcomingReminders.length})
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {upcomingReminders.slice(0, 5).map((reminder, idx) => (
                    <div key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#FE5C02] rounded-full" />
                      {reminder.eventName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-gray-800 text-white rounded-xl hover:border-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetupEmailReminders}
                className="flex-1 px-4 py-3 bg-[#FE5C02] text-white rounded-xl hover:bg-[#E54F02] transition-colors font-semibold"
              >
                Save & Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default MyTickets;
