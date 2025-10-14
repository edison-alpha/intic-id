import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TurnkeyWalletProvider } from "./contexts/TurnkeyWalletContext";
import Index from "./pages/Index";
import BrowseEvents from "./pages/app/BrowseEvents";
import Dashboard from "./pages/app/Dashboard";
import MyTickets from "./pages/app/MyTickets";
import Staking from "./pages/app/Staking";
import Governance from "./pages/app/Governance";
import CreateEventNFT from "./pages/app/CreateEventNFT";
import EventDetail from "./pages/app/EventDetail";
import TicketDetail from "./pages/app/TicketDetail";
import Profile from "./pages/app/Profile";
import CreateTicket from "./pages/CreateTicket";
import { AuthCallback } from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TurnkeyWalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/app" element={<BrowseEvents />} />
            <Route path="/app/dashboard" element={<Dashboard />} />
            <Route path="/app/my-tickets" element={<MyTickets />} />
            <Route path="/app/staking" element={<Staking />} />
            <Route path="/app/governance" element={<Governance />} />
            <Route path="/app/create-event" element={<CreateEventNFT />} />
            <Route path="/app/event/:id" element={<EventDetail />} />
            <Route path="/app/ticket/:id" element={<TicketDetail />} />
            <Route path="/app/profile" element={<Profile />} />
            <Route path="/create-ticket" element={<CreateTicket />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TurnkeyWalletProvider>
  </QueryClientProvider>
);

export default App;
