/**
 * Attendee Check-In Page (IMPROVED FLOW)
 * 1. Load user's tickets on page load
 * 2. User selects which ticket to check-in
 * 3. User scans QR code from EO
 * 4. Validate ticket matches scanned event
 * 5. Approve transaction to check-in
 */

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import QRScanner from '@/components/QRScanner';
import {
  parseCheckInPointQR,
  checkInTicket,
  CheckInPointData,
} from '@/services/ticketCheckInService';
import { getUserTicketsFromIndexerCached } from '@/services/nftFetcher';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle,
  Ticket,
  Calendar,
  MapPin,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AttendeeCheckIn = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();

  // Step tracking
  const [currentStep, setCurrentStep] = useState<'select-ticket' | 'scan-qr' | 'confirm' | 'success'>('select-ticket');

  // Data states
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [checkInPoint, setCheckInPoint] = useState<CheckInPointData | null>(null);
  const [txId, setTxId] = useState<string>('');

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load user tickets on mount
  useEffect(() => {
    if (wallet?.address) {
      loadUserTickets();
    }
  }, [wallet?.address]);

  const loadUserTickets = async () => {
    if (!wallet?.address) return;

    setIsLoading(true);
    try {
      const tickets = await getUserTicketsFromIndexerCached(wallet.address);

      console.log('📋 [AttendeeCheckIn] Loaded tickets:', tickets);

      // Filter only active tickets (not used, not expired)
      const activeTickets = tickets.filter((t: any) => t.status === 'active');

      setUserTickets(activeTickets);

      if (activeTickets.length === 0) {
        toast.info('No active tickets', {
          description: 'You don\'t have any active tickets available for check-in',
        });
      }
    } catch (error) {
      console.error('❌ Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTicket = (ticket: any) => {
    console.log('🎫 [AttendeeCheckIn] Ticket selected:', ticket);
    setSelectedTicket(ticket);
    setCurrentStep('scan-qr');
  };

  const handleScanSuccess = async (decodedText: string) => {
    console.log('📱 [AttendeeCheckIn] ===== SCAN STARTED =====');
    console.log('📱 [AttendeeCheckIn] Raw QR Code:', decodedText);

    // Parse QR data
    const pointData = parseCheckInPointQR(decodedText);

    console.log('📱 [AttendeeCheckIn] Parsed result:', pointData);

    if (!pointData) {
      console.error('❌ [AttendeeCheckIn] Failed to parse QR code');
      toast.error('Invalid QR code', {
        description: 'Please scan the check-in QR code displayed by event organizer',
      });
      setIsScanning(false);
      return;
    }

    // Validate ticket matches event
    if (!selectedTicket) {
      toast.error('No ticket selected');
      setIsScanning(false);
      return;
    }

    const scannedContractId = `${pointData.contractAddress}.${pointData.contractName}`;
    const ticketContractId = selectedTicket.contractId;

    console.log('🔍 [AttendeeCheckIn] Validating match:');
    console.log('   Scanned:', scannedContractId);
    console.log('   Ticket:', ticketContractId);

    if (scannedContractId !== ticketContractId) {
      console.error('❌ [AttendeeCheckIn] Event mismatch!');
      toast.error('Wrong event!', {
        description: `This QR code is for a different event. Your ticket is for: ${selectedTicket.eventName}`,
      });
      setIsScanning(false);
      return;
    }

    // Success - QR matched with ticket
    console.log('✅ [AttendeeCheckIn] Event match confirmed!');
    setCheckInPoint(pointData);
    setIsScanning(false);
    setCurrentStep('confirm');

    toast.success('Event verified!', {
      description: `Ready to check-in with ticket #${selectedTicket.tokenId}`,
    });
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedTicket || !checkInPoint || !wallet?.privateKey) {
      toast.error('Missing information');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🎯 [AttendeeCheckIn] Calling use-ticket...');

      const result = await checkInTicket(
        checkInPoint.contractAddress,
        checkInPoint.contractName,
        selectedTicket.tokenId,
        wallet.privateKey
      );

      if (result.success) {
        console.log('✅ [AttendeeCheckIn] Check-in successful!', result.txId);
        setTxId(result.txId || '');
        setCurrentStep('success');
        toast.success('Check-in successful!', {
          description: 'Your attendance has been recorded on blockchain',
        });
      } else {
        console.error('❌ [AttendeeCheckIn] Check-in failed:', result.message);
        toast.error('Check-in failed', {
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('❌ [AttendeeCheckIn] Error:', error);
      toast.error('Error', {
        description: error.message || 'Failed to check-in',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedTicket(null);
    setCheckInPoint(null);
    setCurrentStep('select-ticket');
    setTxId('');
  };

  if (!wallet?.address) {
    return (
      <AppLayout>
        <div className="px-4 py-6 md:px-6 md:py-8 max-w-3xl mx-auto">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Wallet Not Connected</h3>
            <p className="text-gray-400">Please connect your wallet to check-in</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Success State
  if (currentStep === 'success') {
    return (
      <AppLayout>
        <div className="px-4 py-6 md:px-6 md:py-8 max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500 rounded-3xl p-12 text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
              Check-In Successful!
            </h1>
            <p className="text-gray-300 mb-2">Your attendance has been recorded</p>
            <p className="text-gray-400 text-sm mb-6">
              Transaction: {txId.substring(0, 8)}...{txId.substring(txId.length - 6)}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/app/my-tickets')}
                className="px-6 py-3 bg-[#1A1A1A] border border-gray-800 text-white rounded-xl hover:border-green-500 transition-colors"
              >
                View My Tickets
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
              >
                Check-In Another
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 md:px-6 md:py-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Event Check-In</h1>
          <p className="text-gray-400">Select your ticket and scan QR code at entrance</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            currentStep === 'select-ticket' ? 'bg-[#FE5C02] text-white' : 'bg-[#1A1A1A] text-gray-400'
          }`}>
            <Ticket className="w-4 h-4" />
            <span className="text-sm font-medium">1. Select Ticket</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            currentStep === 'scan-qr' ? 'bg-[#FE5C02] text-white' : 'bg-[#1A1A1A] text-gray-400'
          }`}>
            <Camera className="w-4 h-4" />
            <span className="text-sm font-medium">2. Scan QR</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            currentStep === 'confirm' ? 'bg-[#FE5C02] text-white' : 'bg-[#1A1A1A] text-gray-400'
          }`}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">3. Confirm</span>
          </div>
        </div>

        {/* STEP 1: Select Ticket */}
        {currentStep === 'select-ticket' && (
          <div>
            <h3 className="text-white font-semibold mb-4">Select Your Ticket</h3>

            {isLoading ? (
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-12 text-center">
                <Loader2 className="w-12 h-12 text-[#FE5C02] mx-auto mb-4 animate-spin" />
                <p className="text-white">Loading your tickets...</p>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Tickets</h3>
                <p className="text-gray-400 mb-6">You don't have any active tickets</p>
                <button
                  onClick={() => navigate('/app')}
                  className="px-6 py-3 bg-[#FE5C02] hover:bg-[#E54F02] text-white font-semibold rounded-xl transition-colors"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className="w-full text-left p-4 bg-[#1A1A1A] border-2 border-gray-800 hover:border-[#FE5C02] rounded-xl transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Ticket className="w-5 h-5 text-[#FE5C02] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold mb-2">{ticket.eventName}</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {ticket.eventDate}
                          </div>
                          {ticket.location && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <MapPin className="w-3 h-3" />
                              {ticket.location}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Token #{ticket.tokenId}</span>
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Scan QR */}
        {currentStep === 'scan-qr' && selectedTicket && (
          <div>
            {/* Selected Ticket Info */}
            <div className="mb-6 p-4 bg-gradient-to-br from-[#FE5C02]/10 to-orange-600/10 border border-[#FE5C02]/20 rounded-2xl">
              <p className="text-gray-400 text-sm mb-1">Selected Ticket</p>
              <h3 className="text-white font-semibold text-lg mb-2">{selectedTicket.eventName}</h3>
              <p className="text-gray-400 text-sm">Token #{selectedTicket.tokenId}</p>
            </div>

            {/* Scan Instruction */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-[#FE5C02]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-[#FE5C02]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Scan Check-In QR Code</h3>
              <p className="text-gray-400 mb-6">
                Position your camera at the QR code displayed at event entrance
              </p>
              <button
                onClick={() => setIsScanning(true)}
                className="px-8 py-4 bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-[#E54F02] hover:to-orange-700 text-white font-semibold rounded-xl transition-all"
              >
                Start Scanning
              </button>
              <button
                onClick={() => setCurrentStep('select-ticket')}
                className="mt-3 w-full px-4 py-2 bg-[#0A0A0A] border border-gray-800 text-gray-400 rounded-xl hover:border-gray-700 transition-colors text-sm"
              >
                ← Change Ticket
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm Check-In */}
        {currentStep === 'confirm' && selectedTicket && checkInPoint && (
          <div>
            {/* Event Match Confirmed */}
            <div className="mb-6 p-6 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500 rounded-2xl text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Event Verified!</h3>
              <p className="text-gray-300 text-sm">QR code matches your ticket</p>
            </div>

            {/* Ticket Details */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">Check-In Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-sm">Event</span>
                  <span className="text-white font-semibold text-right">{selectedTicket.eventName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-sm">Token ID</span>
                  <span className="text-white font-mono">#{selectedTicket.tokenId}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-sm">Date</span>
                  <span className="text-white">{selectedTicket.eventDate}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-sm">Location</span>
                  <span className="text-white text-right">{selectedTicket.location || 'TBA'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCheckInPoint(null);
                  setCurrentStep('scan-qr');
                }}
                className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-gray-800 text-white rounded-xl hover:border-gray-700 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckIn}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Check-In'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {isScanning && (
        <QRScanner
          isScanning={isScanning}
          onScanSuccess={handleScanSuccess}
          onScanError={(error) => console.error(error)}
          onClose={() => setIsScanning(false)}
        />
      )}
    </AppLayout>
  );
};

export default AttendeeCheckIn;
