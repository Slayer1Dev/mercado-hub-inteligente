
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";
import StockManagement from "./pages/StockManagement";
import AiResponses from "./pages/AiResponses";
import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route 
            path="/dashboard" 
            element={
              <SignedIn>
                <Dashboard />
              </SignedIn>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <SignedIn>
                <AdminDashboard />
              </SignedIn>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <SignedIn>
                <Settings />
              </SignedIn>
            } 
          />
          <Route 
            path="/billing" 
            element={
              <SignedIn>
                <Billing />
              </SignedIn>
            } 
          />
          <Route 
            path="/stock-management" 
            element={
              <SignedIn>
                <StockManagement />
              </SignedIn>
            } 
          />
          <Route 
            path="/ai-responses" 
            element={
              <SignedIn>
                <AiResponses />
              </SignedIn>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <SignedIn>
                <Analytics />
              </SignedIn>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
