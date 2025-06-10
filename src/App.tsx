
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ManageProperties from "./pages/ManageProperties";
import CreateProperty from "./pages/CreateProperty";
import EditProperty from "./pages/EditProperty";
import LeadsManagement from "./pages/LeadsManagement";
import VisitsManagement from "./pages/VisitsManagement";
import ScheduleVisit from "./pages/ScheduleVisit";
import WebhookSettings from "./pages/WebhookSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Home />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/manage-properties" element={<ManageProperties />} />
                <Route path="/properties/create" element={<CreateProperty />} />
                <Route path="/properties/edit/:id" element={<EditProperty />} />
                <Route path="/leads-management" element={<LeadsManagement />} />
                <Route path="/visits-management" element={<VisitsManagement />} />
                <Route path="/schedule-visit/:propertyId" element={<ScheduleVisit />} />
                <Route path="/webhook-settings" element={<WebhookSettings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
