import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Ticket,
  PlusCircle,
  LayoutDashboard,
  User,
  Menu,
  Home,
  Briefcase,
  Settings,
  FileText,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  Vote,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import WalletModal from "@/components/WalletModal";
import { useTurnkeyWallet } from "@/contexts/TurnkeyWalletContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPermanentExpanded, setIsPermanentExpanded] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const { isConnected, address, connectWallet, logout, isLoading, stxBalance, sbtcBalance } = useTurnkeyWallet();

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      toast.success('Address copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  const menuItems = [
    { path: "/app", icon: Home, label: "Browse Events", exact: true },
    { path: "/app/my-tickets", icon: Ticket, label: "My Tickets" },
    { path: "/app/staking", icon: TrendingUp, label: "Staking" },
    { path: "/app/governance", icon: Vote, label: "Governance" },
    { path: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" }
  ];

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    setIsPermanentExpanded(false); // Reset permanent expanded when toggling
  };

  // Handle double click on sidebar to toggle between overlay and full sidebar mode
  const handleSidebarDoubleClick = () => {
    if (isSidebarCollapsed && isHovering) {
      // From collapsed + hover (overlay mode) → Full sidebar (permanent)
      setIsPermanentExpanded(true);
      setIsSidebarCollapsed(false);
    } else if (!isSidebarCollapsed && !isPermanentExpanded) {
      // From full sidebar (permanent) → Collapsed (overlay mode)
      setIsSidebarCollapsed(true);
      setIsPermanentExpanded(false);
    }
  };

  // Determine if sidebar should be expanded
  const isSidebarExpanded = !isSidebarCollapsed || (isHovering && !isPermanentExpanded);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic profile menu based on wallet connection status
  const profileMenuItems = [
    { icon: Briefcase, label: "Portfolio", path: "/app/portfolio" },
    { icon: Settings, label: "Settings", path: "/app/settings" },
    { icon: FileText, label: "Terms & Conditions", path: "/app/terms" },
    ...(isConnected 
      ? [{ icon: LogOut, label: "Disconnect Wallet", action: "disconnect" as const }]
      : [{ icon: Wallet, label: "Connect Wallet", action: "connect" as const }]
    ),
  ];

  const handleMenuClick = (item: typeof profileMenuItems[0]) => {
    if (item.action === "connect") {
      connectWallet();
    } else if (item.action === "disconnect") {
      logout();
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Backdrop Blur Overlay - Only when sidebar is collapsed and hovering (overlay mode) */}
      {isSidebarCollapsed && isHovering && !isPermanentExpanded && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:block hidden transition-opacity duration-300" 
          onDoubleClick={handleSidebarDoubleClick}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onDoubleClick={handleSidebarDoubleClick}
        className={`hidden md:flex flex-col bg-[#1A1A1A] border-r border-gray-800 transition-all duration-300 ease-in-out fixed left-0 top-0 bottom-0 h-screen z-40 ${
          isSidebarExpanded ? "w-64" : "w-20"
        } ${
          isSidebarCollapsed && isHovering && !isPermanentExpanded ? "shadow-2xl" : ""
        }`}
        title={
          isSidebarCollapsed && isHovering 
            ? "Double-click to pin sidebar" 
            : !isSidebarCollapsed 
            ? "Double-click to collapse sidebar" 
            : ""
        }
      >
        {/* Logo & Toggle */}
        <div className={`h-16 flex items-center border-b border-gray-800 ${
          isSidebarExpanded ? "justify-between px-4" : "justify-center px-3"
        }`}>
          {isSidebarExpanded && (
            <a href="/" className="flex items-center gap-2">
              <img src="/src/img/inticdark.svg" alt="intic.id" className="h-8 w-auto" />
            </a>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {!isSidebarExpanded ? (
              <img src="/src/img/logoorange.png" alt="Logo" className="w-8 h-8" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-400 hover:text-white" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-2 ${isSidebarExpanded ? "px-3" : "px-3"}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg transition-all duration-200 group ${
                  isSidebarExpanded ? "px-3 py-3" : "justify-center px-3 py-3"
                } ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                title={!isSidebarExpanded ? item.label : ""}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#FE5C02]" : ""}`} />
                {isSidebarExpanded && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Create Event Button */}
        <div className={`border-t border-gray-800 ${isSidebarExpanded ? "px-3 py-4" : "px-3 py-4"}`}>
          <NavLink
            to="/app/create-event"
            className={`flex items-center gap-2 bg-[#FE5C02] hover:bg-[#E54F00] text-white rounded-full transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl ${
              isSidebarExpanded ? "justify-center px-3 py-3" : "justify-center px-3 py-3"
            }`}
            title={!isSidebarExpanded ? "Create" : ""}
          >
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span>Create</span>}
          </NavLink>
        </div>

        {/* User Section */}
        <div className={`border-t border-gray-800 ${isSidebarExpanded ? "p-4" : "p-3"} relative`} ref={dropdownRef}>
          {isSidebarExpanded ? (
            <div>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE5C02] to-purple-600 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Anonymous'}
                    </p>
                    {isConnected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyAddress();
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Copy address"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {isConnected ? `${stxBalance} STX • ${sbtcBalance} sBTC` : 'Not Connected'}
                  </p>
                </div>
              </button>

              {/* Dropdown Menu - Desktop */}
              {isDropdownOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {profileMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    return item.path ? (
                      <NavLink
                        key={index}
                        to={item.path}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white border-b border-gray-800 last:border-b-0"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </NavLink>
                    ) : (
                      <button
                        key={index}
                        onClick={() => handleMenuClick(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white border-b border-gray-800 last:border-b-0"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                title="Profile Menu"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE5C02] to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
              </button>

              {/* Dropdown Menu - Collapsed Sidebar */}
              {isDropdownOpen && (
                <div className="absolute bottom-full left-full ml-2 mb-2 w-56 bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                  {profileMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    return item.path ? (
                      <NavLink
                        key={index}
                        to={item.path}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white border-b border-gray-800 last:border-b-0"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </NavLink>
                    ) : (
                      <button
                        key={index}
                        onClick={() => handleMenuClick(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white border-b border-gray-800 last:border-b-0"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Desktop Navbar - Fixed */}
      <nav className={`hidden md:block fixed top-0 right-0 z-30 bg-[#0A0A0A]/30 backdrop-blur-md border-b border-gray-800/30 transition-all duration-300 ${
        !isSidebarCollapsed ? "left-64" : "left-[84px]"
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FE5C02] focus:ring-1 focus:ring-[#FE5C02] transition-all"
              />
            </div>

            {/* Wallet Section - Shows status if connected, button if not */}
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-full">
                  <Wallet className="w-4 h-4 text-white" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-xs font-medium">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                      <button
                        onClick={copyAddress}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Copy address"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400 hover:text-white" />
                        )}
                      </button>
                    </div>
                    <div className="flex gap-2 text-[10px] text-gray-400">
                      <span>{stxBalance} STX</span>
                      <span>•</span>
                      <span>{sbtcBalance} sBTC</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors duration-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#FE5C02] hover:bg-[#E54F00] text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-xl whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-4 h-4" />
                <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${
        !isSidebarCollapsed ? "md:ml-64" : "md:ml-[84px]"
      }`}>
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-[#1A1A1A] border-b border-gray-800 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-30">
          <a href="/" className="flex items-center gap-2">
            <img src="/src/img/inticdark.svg" alt="intic.id" className="h-8 w-auto" />
          </a>
          
          {/* Right Side: Avatar + Wallet */}
          <div className="flex items-center gap-3">
            {/* Wallet Status/Button - Mobile */}
            {isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] border border-gray-800 rounded-full">
                <Wallet className="w-4 h-4 text-white" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-white text-[10px] font-medium">
                      {address?.slice(0, 4)}...{address?.slice(-3)}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="p-0.5 hover:bg-gray-700 rounded transition-colors"
                      title="Copy address"
                    >
                      {isCopied ? (
                        <Check className="w-2.5 h-2.5 text-green-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="flex gap-1 text-[8px] text-gray-400">
                    <span>{stxBalance} STX</span>
                    <span>•</span>
                    <span>{sbtcBalance} sBTC</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="p-2 hover:bg-gray-800 active:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
                title={isLoading ? 'Connecting...' : 'Connect Wallet'}
              >
                <Wallet className="w-6 h-6 text-white" />
              </button>
            )}
            
            {/* Profile Avatar with Dropdown */}
            <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE5C02] to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
            </button>

            {/* Dropdown Menu - Mobile */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#1A1A1A] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-br from-[#FE5C02]/10 to-purple-600/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white">
                      {isConnected ? `${address?.slice(0, 8)}...${address?.slice(-6)}` : 'Anonymous'}
                    </p>
                    {isConnected && (
                      <button
                        onClick={copyAddress}
                        className="p-1.5 hover:bg-gray-700/50 rounded transition-colors"
                        title="Copy full address"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {isConnected ? `${stxBalance} STX • ${sbtcBalance} sBTC` : 'Not Connected'}
                  </p>
                </div>

                {/* Menu Items */}
                {profileMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  // Special styling for wallet actions
                  const isWalletAction = item.action === "connect" || item.action === "disconnect";
                  const isDisconnect = item.action === "disconnect";
                  
                  return item.path ? (
                    <NavLink
                      key={index}
                      to={item.path}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800 active:bg-gray-700 transition-colors text-gray-300 hover:text-white border-b border-gray-800 last:border-b-0"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                  ) : (
                    <button
                      key={index}
                      onClick={() => handleMenuClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors border-b border-gray-800 last:border-b-0 ${
                        isDisconnect
                          ? 'bg-red-600/10 hover:bg-red-600/20 active:bg-red-600/30 text-red-400 hover:text-red-300'
                          : isWalletAction
                          ? 'bg-[#FE5C02] hover:bg-[#E54F02] active:bg-[#D44E02] text-white'
                          : 'hover:bg-gray-800 active:bg-gray-700 text-gray-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto md:pb-0 pb-20 md:pt-24 pt-16">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-gray-800 z-30">
          <div className="flex items-center justify-around h-16">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
                >
                  <Icon className={`w-6 h-6 ${isActive ? "text-[#FE5C02]" : "text-gray-400"}`} />
                  <span className={`text-xs ${isActive ? "text-[#FE5C02] font-semibold" : "text-gray-400"}`}>
                    {item.label.split(' ')[0]}
                  </span>
                </NavLink>
              );
            })}
            
            {/* Create Event Button */}
            <NavLink
              to="/app/create-event"
              className="flex flex-col items-center justify-center flex-1 h-full gap-1"
            >
              <div className="w-12 h-12 bg-[#FE5C02] rounded-full flex items-center justify-center -mt-6 shadow-lg">
                <PlusCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-[#FE5C02] font-semibold">Create</span>
            </NavLink>
          </div>
        </nav>
      </div>
      
      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
