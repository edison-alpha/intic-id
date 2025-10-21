/**
 * Ticket Purchase Notification Service
 * Sends email notification after successful ticket purchase using Web3Forms
 */

import { addToGoogleCalendar, type CalendarEvent } from './calendarService';

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || 'YOUR_WEB3FORMS_KEY';

export interface PurchaseNotificationData {
  userEmail: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  ticketNumber: string;
  price: string;
  transactionId: string;
  contractId: string;
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmation(
  data: PurchaseNotificationData
): Promise<{ success: boolean; message: string }> {
  try {
    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `🎉 Ticket Purchase Confirmed - ${data.eventName}`);
    formData.append('from_name', 'INTIC - Event Ticketing');
    formData.append('email', data.userEmail);

    // Generate Google Calendar link
    const startDate = new Date(`${data.eventDate} ${data.eventTime}`);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours duration

    const calendarEvent: CalendarEvent = {
      title: `🎭 ${data.eventName}`,
      description: `Ticket Number: ${data.ticketNumber}\nLocation: ${data.location}\n\nTransaction: ${data.transactionId}\n\nPowered by INTIC`,
      location: data.location,
      startDate,
      endDate,
      url: `${typeof window !== 'undefined' ? window.location.origin : 'https://intic-id.vercel.app'}/app/my-tickets`,
    };

    const googleCalendarLink = addToGoogleCalendar(calendarEvent);

    // Create plain text email body (Web3Forms doesn't properly support HTML in message field)
    const plainTextBody = `
🎉 TICKET PURCHASE CONFIRMED

Congratulations! Your ticket purchase for ${data.eventName} has been successfully confirmed on the blockchain.

📋 TICKET DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 Ticket Number: ${data.ticketNumber}
🎭 Event Name: ${data.eventName}
📅 Date & Time: ${data.eventDate} at ${data.eventTime}
📍 Location: ${data.location}
💰 Price Paid: ${data.price} STX

🔗 BLOCKCHAIN TRANSACTION ID:
${data.transactionId}

📅 ADD TO YOUR CALENDAR (Click link below):
${googleCalendarLink}

📱 NEXT STEPS:
• Add event to your calendar (link above) - includes automatic reminders!
• Access your ticket QR code in the app under "My Tickets"
• Bring your QR code to the event for entry

🎟️ View Your Tickets:
${typeof window !== 'undefined' ? window.location.origin : 'https://intic-id.vercel.app'}/app/my-tickets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: Your ticket is an NFT stored securely on the Stacks blockchain.
You can view it anytime in your wallet or in the INTIC app.

REMINDERS: The calendar event includes automatic reminders:
• 2 days before the event
• 1 day before the event
• 1 hour before the event

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTIC Event Ticketing Platform
Powered by Stacks Blockchain Technology

This is an automated confirmation email.
Please do not reply to this message.
    `;

    formData.append('message', plainTextBody);
    formData.append('reply_to', 'noreply@intic.app');
    formData.append('redirect', 'false');

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Purchase confirmation email sent successfully');
      return {
        success: true,
        message: `Confirmation sent to ${data.userEmail}`,
      };
    } else {
      console.error('❌ Failed to send purchase confirmation:', result);
      return {
        success: false,
        message: result.message || 'Failed to send confirmation',
      };
    }

  } catch (error) {
    console.error('❌ Error sending purchase confirmation:', error);
    return {
      success: false,
      message: 'Network error while sending confirmation',
    };
  }
}

/**
 * Request user email for sending notifications
 * Returns email address or null if cancelled
 */
export function promptForEmail(): Promise<string | null> {
  return new Promise((resolve) => {
    const email = prompt(
      'Enter your email address to receive ticket confirmation and event reminders:'
    );

    if (!email) {
      resolve(null);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      resolve(null);
      return;
    }

    resolve(email);
  });
}

/**
 * Get stored user email from localStorage
 */
export function getStoredEmail(): string | null {
  return localStorage.getItem('user-notification-email');
}

/**
 * Store user email in localStorage
 */
export function storeEmail(email: string): void {
  localStorage.setItem('user-notification-email', email);
}
