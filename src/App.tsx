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
import NotificationsManagement from '@/pages/NotificationsManagement';
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
import { TenantProvider } from '@/contexts/TenantContext';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScheduleVisit from '@/pages/ScheduleVisit';
import AdminChatSettings from '@/pages/AdminChatSettings';
import Index from '@/pages/Index';
import PropertyDetail from '@/pages/PropertyDetail';
import VisitsManagement from '@/pages/VisitsManagement';
import AdminSiteSettings from '@/pages/AdminSiteSettings';
import ApiTokens from '@/pages/ApiTokens';
import Analytics from './pages/Analytics';
import Sitemap from './pages/Sitemap';
import Atendimento from '@/pages/Atendimento';
import AttendantChat from '@/pages/AttendantChat';
import AdminProtocols from '@/pages/AdminProtocols';
import CommissionsPanel from '@/pages/CommissionsPanel';
import AdminOLXSettings from '@/pages/AdminOLXSettings';
import OLXCallback from '@/pages/OLXCallback';
import AdminTenants from '@/pages/AdminTenants';
import TenantIndex from '@/pages/TenantIndex';
import TenantOnboarding from '@/pages/TenantOnboarding';
import SEOUpdater from '@/components/SEOUpdater';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import Team from '@/pages/Team';
import OwnersManagement from '@/pages/OwnersManagement';
import AdminIntegrationsOverview from '@/pages/AdminIntegrationsOverview';
import BrandColorApplier from '@/components/BrandColorApplier';
import { useEffect } from 'react';

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  console.log('[App] mounting with React version:', React.version);
  console.log('[App] React object:', React);
  console.log('[App] React.useEffect:', React.useEffect);
  console.log('[App] React.useState:', React.useState);
  
  // Bloquear clique direito nas imagens
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <LanguageProvider>
            <ThemeProvider>
              <BrandColorApplier />
              <SEOUpdater />
              <AnalyticsTracker />
              <Router>
              <Routes>
                {/* Tenant-specific routes (path-based) */}
                <Route path="/t/:tenantSlug" element={<TenantIndex />} />
                <Route path="/t/:tenantSlug/home" element={<Home />} />
                <Route path="/t/:tenantSlug/properties" element={<PropertiesPage />} />
                <Route path="/t/:tenantSlug/imoveis" element={<PropertiesPage />} />
                <Route path="/t/:tenantSlug/imovel/:identifier" element={<PropertyDetail />} />
                <Route path="/t/:tenantSlug/property/:identifier" element={<PropertyDetail />} />
                <Route path="/t/:tenantSlug/contact" element={<Contact />} />
                <Route path="/t/:tenantSlug/auth" element={<Auth />} />
                <Route path="/t/:tenantSlug/schedule-visit/:propertyId" element={<ScheduleVisit />} />

                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Home />} />
                <Route path="/properties" element={<PropertiesPage />} />
                <Route path="/imoveis" element={<PropertiesPage />} />
                
                {/* Property Detail Routes - SEO Friendly */}
                <Route path="/imovel/:identifier" element={<PropertyDetail />} />
                <Route path="/property/:identifier" element={<PropertyDetail />} />
                
                {/* Category Routes */}
                <Route path="/imoveis/destaque" element={<PropertiesPage />} />
                <Route path="/imoveis/frente-mar" element={<PropertiesPage />} />
                <Route path="/imoveis/quadra-mar" element={<PropertiesPage />} />
                <Route path="/imoveis/empreendimentos" element={<PropertiesPage />} />
                
                <Route path="/contact" element={<Contact />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/nossa-equipe" element={<Team />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Login />} />
                <Route path="/sitemap.xml" element={<Sitemap />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/notifications" element={<NotificationsManagement />} />
                <Route path="/leads-management" element={<LeadsManagement />} />

                {/* Admin Routes */}
                <Route path="/admin/*" element={<AdminDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/site-settings" element={<AdminSiteSettings />} />
                <Route path="/admin/settings" element={<WebhookSettings />} />
                <Route path="/admin/chat-settings" element={<AdminChatSettings />} />
                <Route path="/admin/protocols" element={<AdminProtocols />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/commissions" element={<CommissionsPanel />} />
                <Route path="/admin/olx-settings" element={<AdminOLXSettings />} />
                <Route path="/admin/tenants" element={<AdminTenants />} />
                <Route path="/admin/owners" element={<OwnersManagement />} />
                <Route path="/admin/integrations-overview" element={<AdminIntegrationsOverview />} />
                <Route path="/onboarding/:tenantId" element={<TenantOnboarding />} />
                <Route path="/olx-callback" element={<OLXCallback />} />

                {/* Corretor Routes */}
                <Route path="/corretor/*" element={<CorretorDashboard />} />
                <Route path="/create-property" element={<CreateProperty />} />
                <Route path="/manage-properties" element={<ManageProperties />} />
                <Route path="/edit-property/:id" element={<EditProperty />} />
                <Route path="/visits-management" element={<VisitsManagement />} />
                <Route path="/schedule-visit" element={<ScheduleVisit />} />
                <Route path="/schedule-visit/:propertyId" element={<ScheduleVisit />} />
                
                <Route path="/atendimento" element={<Atendimento />} />
                <Route path="/chat-attendant" element={<AttendantChat />} />

                {/* User Routes */}
                <Route path="/user/*" element={<UserDashboard />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Router>
              <Toaster />
            </ThemeProvider>
          </LanguageProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
