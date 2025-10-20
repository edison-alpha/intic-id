import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useWallet } from "@/contexts/WalletContext";
import {
  DollarSign,
  TrendingUp,
  Ticket,
  Calendar,
  Award,
  BarChart3,
  Settings
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import ContractManagement from "@/components/ContractManagement";
import { getUserTicketsFromIndexerCached } from '@/services/nftFetcher';
import { fetchUserTransactions, fetchSTXBalance, fetchSBTCBalance, fetchUserRewards } from '@/services/blockchainData';

const Dashboard = () => {
  const { wallet } = useWallet();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'contracts'>('overview');

  // Real data from blockchain
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalChange: 0,
    totalTickets: 0,
    upcomingEvents: 0,
    stakingRewards: 0,
    stakingAPY: 0,
    totalSpent: 0,
    avgTicketPrice: 0
  });
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real data from blockchain
  useEffect(() => {
    if (wallet?.address) {
      loadDashboardData();
    }
  }, [wallet?.address]);

  const loadDashboardData = async () => {
    const address = wallet?.address || '';
    
    // Skip if no wallet connected
    if (!address) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Get user's tickets and transactions
      const [tickets, transactions] = await Promise.all([
        getUserTicketsFromIndexerCached(address),
        fetchUserTransactions(address, true)
      ]);

      // Calculate portfolio stats
      const totalTickets = tickets.length;
      const totalSpent = transactions
        .filter(tx => tx.tx_type === 'contract_call' && tx.tx_status === 'success')
        .reduce((sum, tx) => sum + (tx.fee_rate || 0), 0) / 1000000; // Convert microSTX to STX

      const avgTicketPrice = totalTickets > 0 ? totalSpent / totalTickets : 0;

      // Get balances and rewards
      const [stxBalance, sbtcBalance, userRewards] = await Promise.all([
        fetchSTXBalance(address, true),
        fetchSBTCBalance(address, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'sbtc-token', true),
        address ? fetchUserRewards(address, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'proof-of-fandom', true) : Promise.resolve({ totalBadges: 0, totalExperience: 0, tierLevel: 1, achievements: [] })
      ]);

      const totalValue = stxBalance + (sbtcBalance * 30000); // Approximate STX + sBTC value

      setPortfolioStats({
        totalValue,
        totalChange: 5.2, // Could calculate from transaction history
        totalTickets,
        upcomingEvents: tickets.filter((t: any) => t.status === "active").length,
        stakingRewards: userRewards.totalExperience * 0.00001, // Real rewards from contract
        stakingAPY: userRewards.tierLevel * 5, // APY based on tier level
        totalSpent,
        avgTicketPrice
      });

      // Generate spending data from transactions (simplified)
      const monthlySpending = transactions
        .filter(tx => tx.tx_type === 'contract_call')
        .reduce((acc, tx) => {
          const month = new Date(tx.burn_block_time * 1000).toLocaleDateString('en-US', { month: 'short' });
          acc[month] = (acc[month] || 0) + (tx.fee_rate || 0) / 1000000;
          return acc;
        }, {});

      const spendingChartData = Object.entries(monthlySpending).map(([month, spending]) => ({
        month,
        spending: spending as number,
        rewards: (userRewards.totalExperience * 0.000001) / 12 // Monthly STX rewards based on total experience
      }));

      setSpendingData(spendingChartData);

      // Category distribution from tickets
      const categoryStats = tickets.reduce((acc, ticket) => {
        acc[ticket.eventName] = (acc[ticket.eventName] || 0) + 1;
        return acc;
      }, {});

      const categoryChartData = Object.entries(categoryStats).map(([name, value]) => ({
        name,
        value,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      }));

      setCategoryData(categoryChartData);

      // Generate upcoming events from active tickets
      const activeTickets = tickets.filter((t: any) => t.status === "active");
      const eventsMap = new Map();

      activeTickets.forEach((ticket: any) => {
        const eventKey = ticket.eventName;
        if (!eventsMap.has(eventKey)) {
          eventsMap.set(eventKey, {
            id: ticket.id,
            name: ticket.eventName,
            date: ticket.eventDate,
            time: ticket.eventTime,
            tickets: 0,
            value: 0,
            image: ticket.image
          });
        }
        const event = eventsMap.get(eventKey);
        event.tickets += ticket.quantity;
        event.value += parseFloat(ticket.price) * ticket.quantity;
      });

      const allEvents = Array.from(eventsMap.values());
      
      // Separate events with valid dates from TBA events
      const validDateEvents = allEvents.filter(event => event.date !== 'TBA' && event.date && !isNaN(new Date(event.date).getTime()));
      const tbaEvents = allEvents.filter(event => event.date === 'TBA' || !event.date || isNaN(new Date(event.date).getTime()));
      
      // Sort valid date events by date
      validDateEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Combine: first valid dates, then TBA events to ensure at least 3 events
      const upcomingEventsData = [...validDateEvents, ...tbaEvents]
        .slice(0, 3) // Ensure at least 3 events are shown
        .map(event => ({
          ...event,
          value: `${event.value.toFixed(2)} STX`
        }));

      setUpcomingEvents(upcomingEventsData);

      // Recent activity from transactions
      const activityData = transactions.slice(0, 4).map(tx => ({
        id: tx.tx_id,
        type: tx.tx_type === 'contract_call' ? 'purchase' : 'reward',
        title: tx.tx_type === 'contract_call' ? 'Transaction' : 'Reward',
        event: tx.contract_call?.contract_id || 'Blockchain',
        amount: `-${(tx.fee_rate || 0) / 1000000} STX`,
        date: new Date(tx.burn_block_time * 1000).toLocaleDateString(),
        status: tx.tx_status
      }));

      setRecentActivity(activityData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-6 pb-8 md:px-6 md:pb-6">
        {/* Header */}
        <div className="mb-8 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Portfolio</h1>
              <p className="text-base md:text-base text-gray-400 leading-relaxed">Track your tickets, spending, and rewards</p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-[#1A1A1A] border border-gray-800/50 rounded-2xl p-1.5 shadow-lg backdrop-blur-sm">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'contracts', label: 'Contracts', icon: Settings }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] ${
                    activeView === view.id
                      ? 'bg-[#FE5C02] text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50 active:bg-gray-700/50'
                  }`}
                >
                  <view.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && activeView === 'overview' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE5C02] mx-auto mb-4"></div>
              <p className="text-gray-400">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {/* Content based on active view */}
        {!loading && activeView === 'overview' && (
          <>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Total Portfolio Value */}
          <div className="bg-gradient-to-br from-[#FE5C02] to-orange-600 rounded-3xl p-6 md:p-6 text-white shadow-2xl shadow-[#FE5C02]/20 border border-[#FE5C02]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-white bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <TrendingUp className="w-4 h-4" />
                <span>{portfolioStats.totalChange}%</span>
              </div>
            </div>
            <p className="text-white/80 text-sm mb-2">Total Portfolio Value</p>
            <p className="text-3xl md:text-3xl font-bold text-white mb-1">{portfolioStats.totalValue.toFixed(2)} STX</p>
            <p className="text-white/60 text-xs">≈ ${(portfolioStats.totalValue * 0.5).toFixed(2)} USD</p>
          </div>

          {/* Total Tickets */}
          <div className="bg-[#1A1A1A] border border-gray-800/50 rounded-3xl p-6 md:p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full">
                {portfolioStats.upcomingEvents} upcoming
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-2">Total Tickets</p>
            <p className="text-3xl md:text-3xl font-bold text-white mb-1">{portfolioStats.totalTickets}</p>
            <p className="text-gray-500 text-xs">Across all events</p>
          </div>

          {/* Staking Rewards */}
          <div className="bg-[#1A1A1A] border border-gray-800/50 rounded-3xl p-6 md:p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
                <TrendingUp className="w-4 h-4" />
                {portfolioStats.stakingAPY}% APY
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-2">Staking Rewards</p>
            <p className="text-3xl md:text-3xl font-bold text-white mb-1">{portfolioStats.stakingRewards.toFixed(4)} STX</p>
            <p className="text-gray-500 text-xs">This month</p>
          </div>

          {/* Avg Ticket Price */}
          <div className="bg-[#1A1A1A] border border-gray-800/50 rounded-3xl p-6 md:p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full">
                Last 30d
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-2">Avg Ticket Price</p>
            <p className="text-3xl md:text-3xl font-bold text-white mb-1">{portfolioStats.avgTicketPrice.toFixed(2)} STX</p>
            <p className="text-gray-500 text-xs">Per ticket</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Spending & Rewards Chart - Takes 2 columns */}
          <div className="lg:col-span-2 bg-[#1A1A1A] border border-gray-800/50 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Spending & Rewards</h2>
                <p className="text-sm md:text-base text-gray-400">Your spending and staking rewards over time</p>
              </div>
              <div className="flex gap-2">
                {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
                      timeRange === range
                        ? "bg-[#FE5C02] text-white shadow-lg"
                        : "bg-[#0A0A0A] text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={spendingData}>
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FE5C02" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FE5C02" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280"
                  style={{ fontSize: '12px', fill: '#fff' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  style={{ fontSize: '12px', fill: '#fff' }}
                  tickFormatter={(value) => `${value.toFixed(2)} STX`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => [`${Number(value).toFixed(4)} STX`, name]}
                  labelStyle={{ color: '#FE5C02', fontWeight: 'bold' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', color: '#fff' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="spending"
                  stroke="#FE5C02"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSpending)"
                  name="Spending (STX)"
                />
                <Area
                  type="monotone"
                  dataKey="rewards"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRewards)"
                  name="Rewards (STX)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution - Pie Chart */}
          <div className="bg-[#1A1A1A] border border-gray-800/50 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Categories</h2>
            <p className="text-sm md:text-base text-gray-400 mb-6">Ticket distribution by type</p>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelStyle={{ fill: '#fff', fontSize: '2px', fontWeight: 'bold' }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value, name) => [`${value} tickets`, name]}
                  labelStyle={{ color: '#f4f4f4ff', fontWeight: 'bold', fontSize: '14px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 mt-4">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-gray-400">{category.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{category.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Recent Activity */}
          <div className="bg-[#1A1A1A] border border-gray-800/50 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Recent Activity</h2>
              <Link 
                to="/app/my-tickets" 
                className="text-sm md:text-base text-[#FE5C02] hover:text-[#E54F02] font-medium transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-[#0A0A0A] rounded-2xl hover:bg-[#0A0A0A]/80 transition-all duration-200 border border-gray-800/30">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    activity.type === "purchase" ? "bg-blue-500/10" :
                    activity.type === "reward" ? "bg-green-500/10" :
                    "bg-purple-500/10"
                  }`}>
                    {activity.type === "purchase" ? (
                      <Ticket className="w-6 h-6 text-blue-500" />
                    ) : activity.type === "reward" ? (
                      <Award className="w-6 h-6 text-green-500" />
                    ) : (
                      <TrendingUp className="w-6 h-6 text-purple-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-white mb-1">{activity.title}</p>
                    <p className="text-sm text-gray-500 truncate">{activity.event}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-base font-semibold ${
                      activity.amount.startsWith("+") ? "text-green-500" : 
                      activity.amount.startsWith("-") ? "text-red-500" : 
                      "text-gray-400"
                    }`}>
                      {activity.amount}
                    </p>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-[#1A1A1A] border border-gray-800/50 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Upcoming Events</h2>
              <Link 
                to="/app/my-tickets" 
                className="text-sm md:text-base text-[#FE5C02] hover:text-[#E54F02] font-medium transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 bg-[#0A0A0A] rounded-2xl hover:bg-[#0A0A0A]/80 transition-all duration-200 cursor-pointer group border border-gray-800/30">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-white mb-2 truncate group-hover:text-[#FE5C02] transition-colors">
                      {event.name}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ticket className="w-4 h-4" />
                        <span>{event.tickets}x tickets</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-semibold text-white">{event.value}</p>
                    <p className="text-sm text-gray-500">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Advanced Analytics View */}
        {activeView === 'analytics' && (
          <AdvancedAnalytics userId="current-user" />
        )}

        {/* Activity Feed View removed */}

        {/* Contract Management View */}
        {activeView === 'contracts' && (
          <ContractManagement />
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
