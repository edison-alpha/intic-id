import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Download,
  Share2,
  ExternalLink,
  Shield,
  Hash,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import NFTMetadataViewer from "@/components/NFTMetadataViewer";
import { getTicketDetail, TicketDetail as TicketDetailType } from "@/services/ticketDetailService";
import { useWallet } from "@/contexts/WalletContext";

const TicketDetail = () => {
  const { id } = useParams();
  const { wallet } = useWallet();
  const userAddress = wallet?.address;

  const [activeTab, setActiveTab] = useState<'overview' | 'metadata'>('overview');
  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTicket = async () => {
      if (!id || !userAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📋 Loading ticket detail for:', id);

        const ticketData = await getTicketDetail(id, userAddress);

        if (ticketData) {
          setTicket(ticketData);
          console.log('✅ Ticket detail loaded');
        } else {
          console.error('❌ Failed to load ticket');
          toast.error('Failed to load ticket details');
        }
      } catch (error) {
        console.error('❌ Error loading ticket:', error);
        toast.error('Error loading ticket');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id, userAddress]);

  const handleDownload = () => {
    toast.success("Ticket downloaded successfully!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleViewOnExplorer = () => {
    if (!ticket) return;

    const explorerUrl = `https://explorer.hiro.so/txid/${ticket.contractId}?chain=testnet`;
    window.open(explorerUrl, '_blank');
    toast.info("Opening blockchain explorer...");
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="pl-4 pr-4 py-4 md:pl-6 md:pr-6 md:py-6 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-96 bg-gray-800 rounded-2xl"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // No ticket found
  if (!ticket) {
    return (
      <AppLayout>
        <div className="pl-4 pr-4 py-4 md:pl-6 md:pr-6 md:py-6 max-w-5xl mx-auto">
          <Link
            to="/app/my-tickets"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to My Tickets
          </Link>
          <div className="text-center py-16 bg-[#1A1A1A] border border-gray-800 rounded-2xl">
            <p className="text-white text-xl font-semibold mb-2">Ticket Not Found</p>
            <p className="text-gray-400">This ticket could not be loaded.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pl-4 pr-4 py-4 md:pl-6 md:pr-6 md:py-6 max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          to="/app/my-tickets"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My Tickets
        </Link>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-[#1A1A1A] border border-gray-800 rounded-lg p-1 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'metadata', label: 'NFT Metadata', icon: Hash }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-[#FE5C02] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#0A0A0A]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
            {/* Ticket Card with QR Code */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header Image */}
              <div
                className="h-48 bg-cover bg-center relative"
                style={{ backgroundImage: `url('${ticket.image}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
                <div className={`absolute top-4 right-4 px-3 py-1 text-white text-xs font-bold rounded-full ${
                  ticket.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {ticket.status.toUpperCase()}
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{ticket.eventName}</h1>
                <p className="text-gray-400 mb-6">{ticket.ticketNumber}</p>

                {/* QR Code */}
                <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl p-8 mb-6">
                  <div className="max-w-xs mx-auto">
                    <div className="aspect-square bg-white rounded-xl p-6 mb-4">
                      {/* Placeholder QR Code */}
                      <div className="w-full h-full bg-gradient-to-br from-[#FE5C02] to-purple-600 rounded-lg flex items-center justify-center">
                        <p className="text-white font-bold text-4xl">QR</p>
                      </div>
                    </div>
                    <p className="text-center text-gray-400 text-sm">
                      Scan this QR code at the event entrance
                    </p>
                  </div>
                </div>

                {/* Event Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#0A0A0A] rounded-lg">
                      <Calendar className="w-5 h-5 text-[#FE5C02]" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Date & Time</p>
                      <p className="text-white font-medium">{ticket.eventDate}</p>
                      <p className="text-gray-300 text-sm">{ticket.eventTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#0A0A0A] rounded-lg">
                      <MapPin className="w-5 h-5 text-[#FE5C02]" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Location</p>
                      <p className="text-white font-medium">{ticket.location}</p>
                      <p className="text-gray-300 text-sm">{ticket.fullAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-[#1A1A1A] border border-gray-800 hover:border-[#FE5C02] text-white font-semibold rounded-xl transition-all"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-[#1A1A1A] border border-gray-800 hover:border-[#FE5C02] text-white font-semibold rounded-xl transition-all"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>

          {/* Sidebar - NFT Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* NFT Information */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">NFT Details</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Token ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono text-sm">#{ticket.tokenId}</p>
                    <button
                      onClick={handleViewOnExplorer}
                      className="p-1 hover:bg-gray-800 rounded transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-1">Contract ID</p>
                  <p className="text-white font-mono text-xs break-all">{ticket.contractId}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-1">Blockchain</p>
                  <p className="text-white text-sm">Stacks Network</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-1">Token Standard</p>
                  <p className="text-white text-sm">SIP-009 (NFT)</p>
                </div>

                <button
                  onClick={handleViewOnExplorer}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0A0A0A] border border-gray-800 hover:border-[#FE5C02] text-white font-medium rounded-xl transition-all"
                >
                  <Shield className="w-4 h-4" />
                  View on Explorer
                </button>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Ticket Info</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Owner</span>
                  <span className="text-white text-xs font-mono truncate max-w-[150px]" title={String(ticket.owner)}>
                    {String(ticket.owner).slice(0, 6)}...{String(ticket.owner).slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Price</span>
                  <span className="text-[#FE5C02] text-sm font-bold">{ticket.purchasePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Category</span>
                  <span className="text-white text-sm font-medium">{ticket.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className={`text-sm font-medium ${ticket.status === 'active' ? 'text-green-500' : 'text-gray-500'}`}>
                    {ticket.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Transfer/Sell (if active) */}
            {ticket.status === "active" && (
              <div className="bg-gradient-to-br from-[#FE5C02]/10 to-purple-600/10 border border-[#FE5C02]/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Transfer or Sell</h3>
                <p className="text-gray-400 text-sm mb-4">
                  You can transfer this ticket to another wallet or list it on the secondary market.
                </p>
                <div className="space-y-2">
                  <button className="w-full px-4 py-3 bg-[#FE5C02] hover:bg-[#E54F02] text-white font-semibold rounded-xl transition-colors">
                    Transfer Ticket
                  </button>
                  <button className="w-full px-4 py-3 bg-[#1A1A1A] hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors border border-gray-800">
                    List for Sale
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* NFT Metadata Tab */}
        {activeTab === 'metadata' && (
          <NFTMetadataViewer
            tokenId={ticket.tokenId.toString()}
            contractAddress={ticket.contractId}
          />
        )}

      </div>
    </AppLayout>
  );
};

export default TicketDetail;
