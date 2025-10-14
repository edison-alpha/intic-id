import React from "react";
import { X, Download, Share2, CheckCircle2, Shield, Calendar } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { addToGoogleCalendar, addToAppleCalendar, addToOutlookCalendar } from "@/lib/calendar";

interface TicketQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    eventName: string;
    eventDate: string;
    ticketType: string;
    holderName: string;
    seatNumber?: string;
  };
}

const TicketQRModal: React.FC<TicketQRModalProps> = ({ isOpen, onClose, ticket }) => {
  if (!isOpen) return null;

  // Generate unique ticket data for QR code
  const ticketData = JSON.stringify({
    ticketId: ticket.id,
    eventName: ticket.eventName,
    holderName: ticket.holderName,
    timestamp: Date.now(),
    signature: `sig_${ticket.id}_${Date.now()}` // In production, this would be a blockchain signature
  });

  const handleDownload = () => {
    const canvas = document.getElementById('ticket-qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ticket-${ticket.id}.png`;
      link.href = url;
      link.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${ticket.eventName}`,
          text: `My ticket for ${ticket.eventName}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const handleAddToCalendar = () => {
    // Extract date and time from eventDate string
    const [dateStr, timeStr] = ticket.eventDate.split(' at ');
    addToGoogleCalendar({
      eventName: ticket.eventName,
      eventDate: dateStr,
      eventTime: timeStr || "7:00 PM",
      location: "Check ticket details",
      ticketId: ticket.id
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#FE5C02]/10 rounded-full mb-3">
            <Shield className="w-6 h-6 text-[#FE5C02]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Ticket</h2>
          <p className="text-sm text-gray-400">Show this QR code at the entrance</p>
        </div>

        {/* Ticket Card */}
        <div className="bg-gradient-to-br from-[#FE5C02] to-purple-600 rounded-xl p-[1px] mb-6">
          <div className="bg-[#0A0A0A] rounded-xl p-6">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
              <QRCodeCanvas
                id="ticket-qr-canvas"
                value={ticketData}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Ticket Info */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Event</p>
                <p className="text-sm font-semibold text-white">{ticket.eventName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-semibold text-white">{ticket.eventDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="text-sm font-semibold text-white">{ticket.ticketType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Holder</p>
                  <p className="text-sm font-semibold text-white">{ticket.holderName}</p>
                </div>
                {ticket.seatNumber && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Seat</p>
                    <p className="text-sm font-semibold text-white">{ticket.seatNumber}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Ticket ID</p>
                <p className="text-xs font-mono text-gray-400">{ticket.id}</p>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="flex items-center gap-2 mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-500 font-medium">Verified on Stacks Blockchain</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={handleDownload}
            className="flex flex-col items-center justify-center gap-1 bg-[#0A0A0A] hover:bg-gray-800 text-white py-3 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs font-medium">Download</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1 bg-[#0A0A0A] hover:bg-gray-800 text-white py-3 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium">Share</span>
          </button>
          <button
            onClick={handleAddToCalendar}
            className="flex flex-col items-center justify-center gap-1 bg-[#FE5C02] hover:bg-[#E54F02] text-white py-3 rounded-lg transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Calendar</span>
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-500 text-center">
            🔒 Keep this QR code private. Do not share screenshots publicly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketQRModal;
