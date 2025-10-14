import React, { useState } from "react";
import AppLayout from "@/components/app/AppLayout";
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
  Activity,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import NFTMetadataViewer from "@/components/NFTMetadataViewer";
import ActivityFeed from "@/components/ActivityFeed";

const TicketDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'metadata' | 'activity'>('overview');

  const ticket = {
    id: parseInt(id || "1"),
    eventName: "Summer Music Festival 2025",
    eventDate: "July 15, 2025",
    eventTime: "6:00 PM - 11:00 PM",
    location: "Madison Square Garden, New York",
    fullAddress: "4 Pennsylvania Plaza, New York, NY 10001",
    image: "/background-section1.png",
    ticketNumber: "#NFT-001234",
    tokenId: "0x7F2...8A3B",
    contractAddress: "SP2J6Z...X8K2",
    purchaseDate: "May 10, 2025",
    purchasePrice: "25 STX",
    status: "active",
    seatInfo: "General Admission",
    quantity: 2
  };

  const handleDownload = () => {
    toast.success("Ticket downloaded successfully!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleViewOnExplorer = () => {
    toast.info("Opening blockchain explorer...");
  };

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
            { id: 'metadata', label: 'NFT Metadata', icon: Hash },
            { id: 'activity', label: 'Activity', icon: Activity }
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
                <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  ACTIVE
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
                    <p className="text-white font-mono text-sm">{ticket.tokenId}</p>
                    <button
                      onClick={handleViewOnExplorer}
                      className="p-1 hover:bg-gray-800 rounded transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-1">Contract Address</p>
                  <p className="text-white font-mono text-sm break-all">{ticket.contractAddress}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-1">Blockchain</p>
                  <p className="text-white text-sm">Stack Network</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-1">Token Standard</p>
                  <p className="text-white text-sm">ERC-721</p>
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
              <h2 className="text-lg font-bold text-white mb-4">Purchase Info</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Purchase Date</span>
                  <span className="text-white text-sm font-medium">{ticket.purchaseDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Price Paid</span>
                  <span className="text-[#FE5C02] text-sm font-bold">{ticket.purchasePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Quantity</span>
                  <span className="text-white text-sm font-medium">×{ticket.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Seat Type</span>
                  <span className="text-white text-sm font-medium">{ticket.seatInfo}</span>
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
            tokenId={id || "1"}
            contractAddress="SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.nft-ticket"
          />
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <ActivityFeed
            showUserActivity={true}
            showGlobalActivity={false}
            maxItems={10}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default TicketDetail;
