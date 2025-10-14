import React, { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/app/AppLayout";
import {
  DollarSign,
  TrendingUp,
  Ticket,
  Calendar,
  Award,
  BarChart3,
  Activity as ActivityIcon,
  Rocket,
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
import ActivityFeed from "@/components/ActivityFeed";
import ContractDeployment from "@/components/ContractDeployment";
import DeploymentQueue from "@/components/DeploymentQueue";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'activity' | 'deploy' | 'contracts'>('overview');

  // Portfolio Stats
  const portfolioStats = {
    totalValue: 8750.50,
    totalChange: 12.5,
    totalTickets: 24,
    upcomingEvents: 6,
    stakingRewards: 125.50,
    stakingAPY: 18.5,
    totalSpent: 7500,
    avgTicketPrice: 312.5
  };

  // Spending Over Time Data
  const spendingData = [
    { month: "Jan", spending: 450, rewards: 20 },
    { month: "Feb", spending: 680, rewards: 35 },
    { month: "Mar", spending: 520, rewards: 28 },
    { month: "Apr", spending: 890, rewards: 45 },
    { month: "May", spending: 1200, rewards: 65 },
    { month: "Jun", spending: 980, rewards: 52 },
    { month: "Jul", spending: 1350, rewards: 75 },
    { month: "Aug", spending: 1180, rewards: 68 },
  ];

  // Category Distribution
  const categoryData = [
    { name: "Music", value: 45, color: "#FE5C02" },
    { name: "Sports", value: 30, color: "#8B5CF6" },
    { name: "Conference", value: 15, color: "#3B82F6" },
    { name: "Theater", value: 10, color: "#10B981" }
  ];

  // Recent Activity
  const recentActivity = [
    {
      id: 1,
      type: "purchase",
      title: "Purchased VIP Ticket",
      event: "Summer Music Festival",
      amount: "-0.0045 BTC",
      date: "2 hours ago",
      status: "completed"
    },
    {
      id: 2,
      type: "reward",
      title: "Staking Reward",
      event: "Monthly Distribution",
      amount: "+0.000255 BTC",
      date: "1 day ago",
      status: "completed"
    },
    {
      id: 3,
      type: "purchase",
      title: "Purchased General Admission",
      event: "NBA Finals Game 5",
      amount: "-0.0025 BTC",
      date: "3 days ago",
      status: "completed"
    },
    {
      id: 4,
      type: "tier",
      title: "Tier Upgraded",
      event: "Silver → Gold",
      amount: "Unlocked 15% discount",
      date: "5 days ago",
      status: "completed"
    }
  ];

  // Upcoming Events
  const upcomingEvents = [
    {
      id: 1,
      name: "Summer Music Festival",
      date: "Jul 15, 2025",
      time: "6:00 PM",
      tickets: 2,
      value: "0.0045 BTC",
      image: "/background-section1.png"
    },
    {
      id: 2,
      name: "NBA Finals Game 5",
      date: "Jun 20, 2025",
      time: "8:30 PM",
      tickets: 1,
      value: "0.0025 BTC",
      image: "/background-section2.png"
    },
    {
      id: 3,
      name: "Web3 Conference",
      date: "Aug 10, 2025",
      time: "9:00 AM",
      tickets: 3,
      value: "0.0060 BTC",
      image: "/background-section3.png"
    }
  ];

  return (
    <AppLayout>
      <div className="px-4 pb-6 md:px-6 md:pb-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Portfolio</h1>
              <p className="text-sm md:text-base text-gray-400">Track your tickets, spending, and rewards</p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-[#1A1A1A] border border-gray-800 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'activity', label: 'Activity', icon: ActivityIcon },
                { id: 'deploy', label: 'Deploy', icon: Rocket },
                { id: 'contracts', label: 'Contracts', icon: Settings }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === view.id
                      ? 'bg-[#FE5C02] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#0A0A0A]'
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'overview' && (
          <>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Portfolio Value */}
          <div className="bg-gradient-to-br from-[#FE5C02] to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                <TrendingUp className="w-4 h-4" />
                <span>{portfolioStats.totalChange}%</span>
              </div>
            </div>
            <p className="text-white/80 text-sm mb-1">Total Portfolio Value</p>
            <p className="text-3xl font-bold">{(portfolioStats.totalValue * 0.00001).toFixed(6)} BTC</p>
            <p className="text-white/60 text-xs mt-2">≈ ${(portfolioStats.totalValue * 0.5).toFixed(2)} USD</p>
          </div>

          {/* Total Tickets */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-400">
                {portfolioStats.upcomingEvents} upcoming
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Tickets</p>
            <p className="text-3xl font-bold text-white">{portfolioStats.totalTickets}</p>
            <p className="text-gray-500 text-xs mt-2">Across all events</p>
          </div>

          {/* Staking Rewards */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-green-500">
                <TrendingUp className="w-4 h-4" />
                {portfolioStats.stakingAPY}% APY
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Staking Rewards</p>
            <p className="text-3xl font-bold text-white">{(portfolioStats.stakingRewards * 0.00001).toFixed(8)} BTC</p>
            <p className="text-gray-500 text-xs mt-2">This month</p>
          </div>

          {/* Avg Ticket Price */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-400">
                Last 30d
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Avg Ticket Price</p>
            <p className="text-3xl font-bold text-white">{(portfolioStats.avgTicketPrice * 0.00001).toFixed(6)} BTC</p>
            <p className="text-gray-500 text-xs mt-2">Per ticket</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Spending & Rewards Chart - Takes 2 columns */}
          <div className="lg:col-span-2 bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Spending & Rewards</h2>
                <p className="text-sm text-gray-400">Your spending and staking rewards over time</p>
              </div>
              <div className="flex gap-2">
                {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeRange === range
                        ? "bg-[#FE5C02] text-white"
                        : "bg-[#0A0A0A] text-gray-400 hover:text-white"
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
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="spending"
                  stroke="#FE5C02"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSpending)"
                  name="Spending (sBTC)"
                />
                <Area
                  type="monotone"
                  dataKey="rewards"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRewards)"
                  name="Rewards (sBTC)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution - Pie Chart */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-1">Categories</h2>
            <p className="text-sm text-gray-400 mb-6">Ticket distribution by type</p>

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
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-4">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <Link 
                to="/app/my-tickets" 
                className="text-sm text-[#FE5C02] hover:text-[#E54F02] font-medium transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-[#0A0A0A] rounded-lg hover:bg-[#0A0A0A]/80 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === "purchase" ? "bg-blue-500/10" :
                    activity.type === "reward" ? "bg-green-500/10" :
                    "bg-purple-500/10"
                  }`}>
                    {activity.type === "purchase" ? (
                      <Ticket className="w-5 h-5 text-blue-500" />
                    ) : activity.type === "reward" ? (
                      <Award className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-0.5">{activity.title}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.event}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${
                      activity.amount.startsWith("+") ? "text-green-500" : 
                      activity.amount.startsWith("-") ? "text-red-500" : 
                      "text-gray-400"
                    }`}>
                      {activity.amount}
                    </p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
              <Link 
                to="/app/my-tickets" 
                className="text-sm text-[#FE5C02] hover:text-[#E54F02] font-medium transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 bg-[#0A0A0A] rounded-lg hover:bg-[#0A0A0A]/80 transition-colors cursor-pointer group">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-1 truncate group-hover:text-[#FE5C02] transition-colors">
                      {event.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        <span>{event.tickets}x tickets</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">{event.value}</p>
                    <p className="text-xs text-gray-500">{event.time}</p>
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

        {/* Activity Feed View */}
        {activeView === 'activity' && (
          <ActivityFeed
            showUserActivity={true}
            showGlobalActivity={true}
            maxItems={20}
          />
        )}

        {/* Contract Deployment View */}
        {activeView === 'deploy' && (
          <ContractDeployment />
        )}

        {/* Deployment Queue & Contract Management View */}
        {activeView === 'contracts' && (
          <DeploymentQueue />
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
