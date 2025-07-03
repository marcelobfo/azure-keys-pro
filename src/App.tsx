
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import PropertiesPage from '@/pages/Properties';
import Contact from '@/pages/Contact';
import Favorites from '@/pages/Favorites';
import Auth from '@/pages/Auth';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ProfileSettings from '@/pages/ProfileSettings';
import Alerts from '@/pages/Alerts';
import LeadsManagement from '@/pages/LeadsManagement';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import WebhookSettings from '@/pages/WebhookSettings';
import CorretorDashboard from '@/pages/CorretorDashboard';
import CreateProperty from '@/pages/CreateProperty';
import ManageProperties from '@/pages/ManageProperties';
import EditProperty from '@/pages/EditProperty';
import UserDashboard from '@/pages/UserDashboard';
import NotFound from '@/pages/NotFound';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScheduleVisit from '@/pages/ScheduleVisit';
import ChatSettings from '@/pages/ChatSettings';
import AdminChatSettings from '@/pages/AdminChatSettings';
import Index from '@/pages/Index';
import PropertyDetail from '@/pages/PropertyDetail';
import VisitsManagement from '@/pages/VisitsManagement';
import AdminSiteSettings from '@/pages/AdminSiteSettings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Home />} />
                <Route path="/properties" element={<PropertiesPage />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/leads-management" element={<LeadsManagement />} />

                {/* Admin Routes */}
                <Route path="/admin/*" element={<AdminDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/site-settings" element={<AdminSiteSettings />} />
                <Route path="/admin/settings" element={<WebhookSettings />} />
                <Route path="/admin/chat-settings" element={<AdminChatSettings />} />

                {/* Corretor Routes */}
                <Route path="/corretor/*" element={<CorretorDashboard />} />
                <Route path="/create-property" element={<CreateProperty />} />
                <Route path="/manage-properties" element={<ManageProperties />} />
                <Route path="/edit-property/:id" element={<EditProperty />} />
                <Route path="/visits-management" element={<VisitsManagement />} />
                <Route path="/schedule-visit" element={<ScheduleVisit />} />
                <Route path="/schedule-visit/:propertyId" element={<ScheduleVisit />} />
                <Route path="/chat-settings" element={<ChatSettings />} />

                {/* User Routes */}
                <Route path="/user/*" element={<UserDashboard />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
