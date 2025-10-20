import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { WalletProvider } from "./contexts/WalletContext";
import Index from "./pages/Index";
import BrowseEvents from "./pages/BrowseEvents";
import Dashboard from "./pages/Dashboard";
import MyTickets from "./pages/MyTickets";
import Staking from "./pages/Staking";
import Governance from "./pages/Governance";
import CreateEventNFT from "./pages/CreateEventNFT";
import EventDetail from "./pages/EventDetail";
import TicketDetail from "./pages/TicketDetail";
import Profile from "./pages/Profile";
import CreateTicket from "./pages/CreateTicket";
import Settings from "./pages/Settings";
import { AuthCallback } from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/app" element={<BrowseEvents />} />
              <Route path="/app/portofolio" element={<Dashboard />} />
              <Route path="/app/my-tickets" element={<MyTickets />} />
              <Route path="/app/staking" element={<Staking />} />
              <Route path="/app/governance" element={<Governance />} />
              <Route path="/app/create-event" element={<CreateEventNFT />} />
              <Route path="/app/event/:id" element={<EventDetail />} />
              <Route path="/app/ticket/:id" element={<TicketDetail />} />
              <Route path="/app/profile" element={<Profile />} />
              <Route path="/app/settings" element={<Settings />} />
              <Route path="/create-ticket" element={<CreateTicket />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
