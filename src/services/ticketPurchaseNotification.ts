/**
 * Ticket Purchase Notification Service
 * Sends email notification after successful ticket purchase using Web3Forms
 */

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

    // Email body with HTML
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #FE5C02 0%, #FF7A33 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
          }
          .content {
            padding: 40px 30px;
          }
          .success-badge {
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .event-details {
            background: #f9fafb;
            padding: 24px;
            border-radius: 10px;
            margin: 24px 0;
            border: 1px solid #e5e7eb;
          }
          .event-details h3 {
            margin: 0 0 16px 0;
            color: #FE5C02;
            font-size: 18px;
          }
          .detail-row {
            display: flex;
            margin: 12px 0;
            align-items: flex-start;
          }
          .detail-icon {
            font-size: 20px;
            margin-right: 12px;
            min-width: 24px;
          }
          .detail-label {
            font-weight: 600;
            min-width: 120px;
            color: #6b7280;
            font-size: 14px;
          }
          .detail-value {
            color: #1f2937;
            font-size: 14px;
            flex: 1;
          }
          .transaction-box {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .transaction-box strong {
            color: #92400e;
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .transaction-id {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #78350f;
            word-break: break-all;
            background: white;
            padding: 8px;
            border-radius: 4px;
          }
          .cta-section {
            text-align: center;
            margin: 30px 0;
          }
          .cta-button {
            display: inline-block;
            background: #FE5C02;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(254, 92, 2, 0.3);
          }
          .info-box {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 8px 0;
            font-size: 14px;
            color: #1e40af;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            padding: 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 8px 0;
          }
          ul {
            margin: 16px 0;
            padding-left: 20px;
          }
          ul li {
            margin: 8px 0;
            color: #4b5563;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Purchase Successful!</h1>
            <p>Your ticket has been confirmed</p>
          </div>

          <div class="content">
            <div class="success-badge">
              ✓ Payment Confirmed
            </div>

            <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
              Congratulations! Your ticket purchase for <strong>${data.eventName}</strong> has been successfully confirmed on the blockchain.
            </p>

            <div class="event-details">
              <h3>📋 Ticket Details</h3>

              <div class="detail-row">
                <span class="detail-icon">🎫</span>
                <div style="flex: 1;">
                  <div class="detail-label">Ticket Number</div>
                  <div class="detail-value" style="font-weight: 600; color: #FE5C02;">${data.ticketNumber}</div>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-icon">🎭</span>
                <div style="flex: 1;">
                  <div class="detail-label">Event Name</div>
                  <div class="detail-value">${data.eventName}</div>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-icon">📅</span>
                <div style="flex: 1;">
                  <div class="detail-label">Date & Time</div>
                  <div class="detail-value">${data.eventDate} at ${data.eventTime}</div>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-icon">📍</span>
                <div style="flex: 1;">
                  <div class="detail-label">Location</div>
                  <div class="detail-value">${data.location}</div>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-icon">💰</span>
                <div style="flex: 1;">
                  <div class="detail-label">Price Paid</div>
                  <div class="detail-value">${data.price} STX</div>
                </div>
              </div>
            </div>

            <div class="transaction-box">
              <strong>🔗 Blockchain Transaction ID:</strong>
              <div class="transaction-id">${data.transactionId}</div>
            </div>

            <div class="info-box">
              <p><strong>📱 Next Steps:</strong></p>
              <ul style="margin: 12px 0; padding-left: 20px;">
                <li>Access your ticket QR code in the app under "My Tickets"</li>
                <li>Add the event to your calendar to get reminders</li>
                <li>Bring your QR code to the event for entry</li>
              </ul>
            </div>

            <div class="cta-section">
              <a href="${window.location.origin}/app/my-tickets" class="cta-button">
                View My Tickets
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">
                <strong>Important:</strong> Your ticket is an NFT stored securely on the Stacks blockchain.
                You can view it anytime in your wallet or in the INTIC app.
              </p>
            </div>
          </div>

          <div class="footer">
            <p><strong>INTIC Event Ticketing Platform</strong></p>
            <p>Powered by Stacks Blockchain Technology</p>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
              This is an automated confirmation email. Please do not reply to this message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Append message as HTML
    formData.append('message', emailBody);
    formData.append('reply_to', 'noreply@intic.app');

    // Important: Tell Web3Forms this is HTML content
    formData.append('redirect', 'false');
    formData.append('content_type', 'text/html');

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
