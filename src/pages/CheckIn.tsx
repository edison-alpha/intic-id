/**
 * Check-In Page
 * For event organizers to scan and validate tickets
 */

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import QRScanner from '@/components/QRScanner';
import {
  parseCheckInQRData,
  validateTicket,
  checkInTicket,
  CheckInData,
  TicketValidation,
} from '@/services/ticketCheckInService';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Hash,
  Ticket,
} from 'lucide-react';

interface CheckInRecord {
  tokenId: number;
  eventName: string;
  owner: string;
  timestamp: Date;
  status: 'success' | 'already-used' | 'expired' | 'invalid';
}

const CheckIn = () => {
  const { wallet } = useWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<TicketValidation | null>(null);
  const [currentCheckInData, setCurrentCheckInData] = useState<CheckInData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInHistory, setCheckInHistory] = useState<CheckInRecord[]>([]);

  const handleScanSuccess = async (decodedText: string) => {
    console.log('📱 [CheckIn] QR Code scanned:', decodedText);

    // Parse QR data
    const checkInData = parseCheckInQRData(decodedText);

    if (!checkInData) {
      toast.error('Invalid QR code', {
        description: 'This QR code is not a valid ticket check-in code',
      });
      setIsScanning(false);
      return;
    }

    setCurrentCheckInData(checkInData);

    // Validate ticket
    setIsProcessing(true);
    const validation = await validateTicket(
      checkInData.contractAddress,
      checkInData.contractName,
      checkInData.tokenId,
      checkInData.eventDate,
      checkInData.eventTime
    );

    setValidationResult(validation);
    setIsProcessing(false);
    setIsScanning(false);

    // Show validation result
    if (validation.isValid) {
      toast.success('Ticket validated!', {
        description: 'Ready for check-in',
      });
    } else if (validation.isUsed) {
      toast.error('Ticket already used', {
        description: 'This ticket has already been checked in',
      });
    } else if (validation.isExpired) {
      toast.error('Ticket expired', {
        description: 'Event time has passed',
      });
    } else {
      toast.error('Invalid ticket', {
        description: validation.message,
      });
    }
  };

  const handleScanError = (error: string) => {
    console.error('❌ [CheckIn] Scan error:', error);
  };

  const handleConfirmCheckIn = async () => {
    if (!currentCheckInData || !validationResult?.isValid || !wallet?.privateKey) {
      toast.error('Cannot check in', {
        description: 'Missing required data or wallet not connected',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await checkInTicket(
        currentCheckInData.contractAddress,
        currentCheckInData.contractName,
        currentCheckInData.tokenId,
        wallet.privateKey
      );

      if (result.success) {
        toast.success('Check-in successful!', {
          description: `Transaction: ${result.txId?.substring(0, 8)}...`,
        });

        // Add to history
        const record: CheckInRecord = {
          tokenId: currentCheckInData.tokenId,
          eventName: 'Event', // Could fetch from contract
          owner: validationResult.owner,
          timestamp: new Date(),
          status: 'success',
        };

        setCheckInHistory([record, ...checkInHistory]);

        // Reset
        setValidationResult(null);
        setCurrentCheckInData(null);
      } else {
        toast.error('Check-in failed', {
          description: result.message,
        });

        // Add to history as failed
        const record: CheckInRecord = {
          tokenId: currentCheckInData.tokenId,
          eventName: 'Event',
          owner: validationResult.owner,
          timestamp: new Date(),
          status: result.status === 'used' ? 'already-used' : 'invalid',
        };

        setCheckInHistory([record, ...checkInHistory]);
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to process check-in',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelCheckIn = () => {
    setValidationResult(null);
    setCurrentCheckInData(null);
  };

  const statusIcons = {
    success: CheckCircle,
    'already-used': XCircle,
    expired: Clock,
    invalid: AlertTriangle,
  };

  const statusColors = {
    success: 'text-green-500',
    'already-used': 'text-orange-500',
    expired: 'text-gray-500',
    invalid: 'text-red-500',
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 md:px-6 md:py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Ticket Check-In</h1>
          <p className="text-gray-400">Scan and validate event tickets</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Scanner & Validation */}
          <div className="space-y-6">
            {/* Scan Button */}
            {!validationResult && (
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-[#FE5C02]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-10 h-10 text-[#FE5C02]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Scan Ticket QR Code</h3>
                <p className="text-gray-400 mb-6">
                  Position the attendee's QR code in front of your camera
                </p>
                <button
                  onClick={() => setIsScanning(true)}
                  className="px-8 py-4 bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-[#E54F02] hover:to-orange-700 text-white font-semibold rounded-xl transition-all"
                >
                  Start Scanning
                </button>
              </div>
            )}

            {/* Validation Result */}
            {validationResult && currentCheckInData && (
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                {/* Status Header */}
                <div className="flex items-center gap-4 mb-6">
                  {validationResult.isValid ? (
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  ) : validationResult.isUsed ? (
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-orange-500" />
                    </div>
                  ) : validationResult.isExpired ? (
                    <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center">
                      <Clock className="w-8 h-8 text-gray-500" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {validationResult.isValid
                        ? 'Valid Ticket'
                        : validationResult.isUsed
                        ? 'Already Used'
                        : validationResult.isExpired
                        ? 'Expired'
                        : 'Invalid Ticket'}
                    </h3>
                    <p className="text-gray-400 text-sm">{validationResult.message}</p>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Token ID:</span>
                    <span className="text-white font-mono">#{currentCheckInData.tokenId}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Owner:</span>
                    <span className="text-white font-mono text-xs">
                      {validationResult.owner.slice(0, 8)}...{validationResult.owner.slice(-6)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Event Date:</span>
                    <span className="text-white">{currentCheckInData.eventDate}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Event Time:</span>
                    <span className="text-white">{currentCheckInData.eventTime}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {validationResult.isValid ? (
                    <>
                      <button
                        onClick={handleCancelCheckIn}
                        className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-gray-800 text-white rounded-xl hover:border-gray-700 transition-colors"
                        disabled={isProcessing}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmCheckIn}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Confirm Check-In'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCancelCheckIn}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-gray-800 text-white rounded-xl hover:border-gray-700 transition-colors"
                    >
                      Scan Another Ticket
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Total Check-ins</p>
                <p className="text-2xl font-bold text-white">
                  {checkInHistory.filter((r) => r.status === 'success').length}
                </p>
              </div>
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Failed</p>
                <p className="text-2xl font-bold text-orange-500">
                  {checkInHistory.filter((r) => r.status !== 'success').length}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Check-In History */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Check-In History</h3>
              <Ticket className="w-5 h-5 text-gray-400" />
            </div>

            {checkInHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400">No check-ins yet</p>
                <p className="text-gray-500 text-sm mt-1">Scan tickets to see history here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {checkInHistory.map((record, index) => {
                  const StatusIcon = statusIcons[record.status];
                  const statusColor = statusColors[record.status];

                  return (
                    <div
                      key={index}
                      className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <StatusIcon className={`w-5 h-5 ${statusColor} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-semibold text-sm">
                              Token #{record.tokenId}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {record.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <p className="text-gray-400 text-xs font-mono truncate">
                            {record.owner.slice(0, 12)}...{record.owner.slice(-8)}
                          </p>
                          <p className={`text-xs mt-1 ${statusColor} font-medium`}>
                            {record.status === 'success'
                              ? 'Checked In'
                              : record.status === 'already-used'
                              ? 'Already Used'
                              : record.status === 'expired'
                              ? 'Expired'
                              : 'Invalid'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {isScanning && (
        <QRScanner
          isScanning={isScanning}
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
          onClose={() => setIsScanning(false)}
        />
      )}
    </AppLayout>
  );
};

export default CheckIn;
