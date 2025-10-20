# My Tickets - Feature Documentation

## Overview
The **My Tickets** page is a comprehensive dashboard for users to view and manage their NFT event tickets purchased on the INTIC platform. All ticket data is retrieved directly from the Stacks blockchain, ensuring transparency and ownership verification.

## Key Features

### 1. Blockchain Data Integration
- **Real-time Data**: All ticket information is fetched directly from smart contracts on the Stacks blockchain
- **NFT Ownership Verification**: Uses `get-owner` function to verify user ownership of tickets
- **Event Details**: Retrieves event metadata including name, date, time, location, and pricing
- **Supply Information**: Shows total supply, minted count, and remaining tickets

#### Data Sources
- `userTickets.ts` - Service that fetches user's owned NFT tickets from all registered events
- `nftIndexer.ts` - Indexes NFT contract data from the blockchain
- `eventRegistry.ts` - Gets all registered events from the registry contract
- `stacksReader.ts` - Reads contract data using Stacks.js

### 2. Email Reminder System
Users can set up email notifications to be reminded before their events start.

#### Features
- **24-Hour Reminders**: Automatic email sent 24 hours before event
- **Custom Email Setup**: Users enter their email address (stored in localStorage)
- **Batch Reminders**: Automatically detects all upcoming events needing reminders
- **Reminder Status**: Visual indicator showing active reminders

#### How It Works
1. User clicks the Bell/Mail icon in the header
2. Enters their email address in the modal
3. System checks for upcoming events (within 7 days)
4. Enables automatic reminders for all upcoming events
5. Emails are sent via Web3Forms API

#### Email Content
- Event name, date, and time
- Venue location
- Ticket number
- QR code access reminder
- Direct link to ticket in app

#### Service Files
- `emailReminderService.ts` - Handles email reminder scheduling and sending
- Uses **Web3Forms** API for serverless email delivery
- No backend required - runs entirely client-side

### 3. Calendar Integration
Advanced calendar export functionality supporting multiple platforms.

#### Supported Platforms
- **Google Calendar** - Opens Google Calendar web interface
- **Outlook Calendar** - Opens Outlook web interface
- **Apple Calendar** - Downloads .ics file compatible with Apple Calendar
- **Other Calendar Apps** - Universal .ics file download

#### Calendar Features
- **Automatic Reminders**: Pre-configured reminders (1 hour and 1 day before)
- **Event Details**: Includes full event information
- **Deep Links**: Links back to ticket in INTIC app
- **Multi-Device Sync**: Works across all devices when using cloud calendars

#### How to Use
1. Click the Calendar icon on any ticket
2. Choose your preferred calendar platform
3. Event is automatically added with reminders

#### Service Files
- `calendarService.ts` - Generates ICS files and calendar URLs
- Supports iCalendar format (RFC 5545)
- Platform-specific URL generation

### 4. Ticket Display & Management

#### Ticket Information Shown
- Event banner image
- Event name and description
- Event date and time
- Venue location
- Ticket number (format: #TKT-XXXXXX)
- Ticket quantity owned
- Ticket status (Active/Used)
- Token ID (NFT identifier)

#### Interactive Features
- **QR Code**: Tap to display ticket QR code for event entry
- **Calendar**: Add event to personal calendar
- **Search**: Filter tickets by event name or location
- **Status Filter**: Filter by Active or Used tickets
- **Refresh**: Manually refresh blockchain data

### 5. Statistics Dashboard

#### Metrics Displayed
- **Total Tickets**: Sum of all ticket quantities owned
- **Active Tickets**: Count of tickets for upcoming events
- **Upcoming Events**: Number of future events

### 6. Real-time Blockchain Sync

#### Features
- **Auto-Refresh**: Tickets load automatically on page visit
- **Manual Refresh**: Refresh button to get latest blockchain state
- **Cache System**: 2-minute cache to reduce API calls
- **Parallel Processing**: Batched contract reads for faster loading

#### Performance Optimizations
- Batch size: 3 contracts processed in parallel
- Cache TTL: 120 seconds
- Smart contract function caching
- Optimized ownership checks

## User Flow

### First-time User
1. Connect Stacks wallet
2. System checks all registered event contracts
3. Verifies ownership of NFT tickets
4. Displays owned tickets with full details
5. (Optional) Set up email reminders
6. (Optional) Add events to calendar

### Returning User
1. Page loads with cached data (if available)
2. Background refresh fetches latest blockchain state
3. New tickets automatically appear
4. Email reminders work automatically

## Technical Implementation

### Smart Contract Interactions
```clarity
;; Check NFT ownership
(get-owner token-id)

;; Get event details
(get-event-details)

;; Get last minted token ID
(get-last-token-id)

;; Get total supply
(get-total-supply)
```

### Data Flow
1. User connects wallet → Get user address
2. Fetch all events from registry → Get contract IDs
3. For each contract:
   - Check ownership (get-owner for each token)
   - Fetch event metadata (get-event-details)
   - Build ticket object
4. Display tickets sorted by date
5. Enable reminders and calendar exports

### State Management
- React useState for UI state
- localStorage for email preferences
- Blockchain as source of truth for tickets
- In-memory cache for performance

## Configuration

### Environment Variables
```env
# Required for email reminders
VITE_WEB3FORMS_KEY=your_web3forms_access_key

# Required for blockchain data
VITE_HIRO_API_KEY=your_hiro_api_key
VITE_NETWORK=testnet
VITE_REGISTRY_CONTRACT_ADDRESS=ST1XXX.event-registry
```

### Web3Forms Setup
1. Go to [web3forms.com](https://web3forms.com)
2. Sign up for free account
3. Get your access key
4. Add to `.env` file as `VITE_WEB3FORMS_KEY`

## Future Enhancements

### Planned Features
- [ ] Push notifications (browser notifications)
- [ ] SMS reminders via Twilio
- [ ] Ticket transfer functionality
- [ ] Secondary market integration
- [ ] Event check-in tracking
- [ ] Proof of Attendance (POAP) integration
- [ ] Multiple reminder schedules (1 hour, 1 day, 1 week)
- [ ] Calendar sync with recurring events
- [ ] Export all tickets to PDF

### Potential Improvements
- WebSocket for real-time updates
- Service worker for offline support
- Push notification service
- Email verification flow
- Reminder preferences per event
- Custom reminder timing
- WhatsApp reminders

## Troubleshooting

### No Tickets Showing
- **Check**: Wallet is connected
- **Check**: User owns NFT tickets
- **Check**: Events are registered in event-registry
- **Solution**: Click refresh button to re-sync

### Email Reminders Not Working
- **Check**: Valid email entered
- **Check**: Web3Forms key configured
- **Check**: Event is upcoming (within 7 days)
- **Check**: Browser allows third-party requests

### Calendar Not Opening
- **Check**: Browser allows pop-ups
- **Check**: Calendar platform is accessible
- **Solution**: Try downloading .ics file instead

## API Reference

### getUserNFTTickets()
Fetches all NFT tickets owned by a user.

```typescript
getUserNFTTickets(userAddress: string): Promise<UserTicket[]>
```

### scheduleEventReminder()
Schedules an email reminder for an event.

```typescript
scheduleEventReminder(
  reminder: EventReminder,
  reminderType: '1day' | '1week' | '1hour'
): Promise<{ success: boolean; message: string }>
```

### createCalendarEventFromTicket()
Converts ticket data to calendar event format.

```typescript
createCalendarEventFromTicket(ticket: any): CalendarEvent
```

### downloadICS()
Downloads an .ics calendar file.

```typescript
downloadICS(event: CalendarEvent, filename?: string): void
```

## Security Considerations

### Data Privacy
- Email stored only in browser localStorage
- No server-side storage of user data
- Blockchain data is public by design
- Web3Forms uses secure HTTPS

### Best Practices
- Never share private keys
- Verify contract addresses
- Use official INTIC domain only
- Check transaction details before signing

## Support

For issues or questions:
- GitHub: [INTIC Issues](https://github.com/your-repo/issues)
- Documentation: [INTIC Docs](https://docs.intic.app)
- Email: support@intic.app
