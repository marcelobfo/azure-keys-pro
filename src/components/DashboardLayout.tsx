import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, User, Settings, LogOut, Bell, Moon, Sun, 
  Menu, X, Heart, MessageSquare, Calendar,
  BarChart3, Users, Building, Building2, FileText, ChevronLeft, ChevronRight, DollarSign, Store, Shield
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRoles } from '@/hooks/useRoles';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import TenantSelector from './TenantSelector';
import { useTenant } from '@/hooks/useTenant';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole: 'user' | 'corretor' | 'admin' | 'master';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, userRole }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { isSuperAdmin, isAdmin, isCorretor } = useRoles();
  const { hasFeature } = useTenantFeatures();
  useNotifications(); // Keep hook for subscription
  const { selectedTenant, isGlobalView } = useTenant();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  
  // Determine if sidebar should be expanded (collapsed but hovered = expanded)
  const isSidebarExpanded = !sidebarCollapsed || sidebarHovered;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  const getRoleLabel = (role: string) => {
    if (isSuperAdmin) return 'Super Admin';
    switch (role) {
      case 'admin': return 'Admin';
      case 'corretor': return 'Corretor';
      case 'master': return 'Super Admin';
      default: return 'Usuário';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    if (isSuperAdmin) return 'default' as const;
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'corretor': return 'default' as const;
      case 'master': return 'default' as const;
      default: return 'secondary' as const;
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
      { icon: Heart, label: 'Favoritos', href: '/favorites' },
      { icon: Bell, label: 'Alertas', href: '/alerts' },
      { icon: User, label: 'Perfil', href: '/profile' },
    ];

    // Items for corretor and admin
    if (isCorretor || userRole === 'corretor' || userRole === 'admin') {
      baseItems.splice(1, 0, 
        { icon: Building, label: 'Meus Imóveis', href: '/manage-properties' },
      );
      
      if (hasFeature('leads_enabled')) {
        baseItems.splice(2, 0, { icon: MessageSquare, label: 'Leads', href: '/leads-management' });
      }
      
      baseItems.splice(3, 0, { icon: Calendar, label: 'Visitas', href: '/visits-management' });
    }

    // Items for admin
    if (isAdmin || userRole === 'admin' || userRole === 'master') {
      baseItems.splice(-1, 0,
        { icon: Users, label: 'Usuários', href: '/admin/users' },
      );

      if (hasFeature('commissions_enabled')) {
        baseItems.splice(-1, 0, { icon: DollarSign, label: 'Comissões', href: '/commissions' });
      }

      baseItems.splice(-1, 0,
        { icon: FileText, label: 'Protocolos', href: '/admin/protocols' },
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
      );

      if (hasFeature('olx_enabled')) {
        baseItems.splice(-1, 0, { icon: Store, label: 'Integração OLX', href: '/admin/olx-settings' });
      }

      if (hasFeature('chat_enabled')) {
        baseItems.splice(-1, 0, { icon: MessageSquare, label: 'Chat', href: '/admin/chat-settings' });
      }

      baseItems.splice(-1, 0, { icon: Settings, label: 'Configurações', href: '/admin/site-settings' });
    }

    // Items ONLY for super_admin
    if (isSuperAdmin) {
      baseItems.splice(-1, 0, { icon: Building2, label: 'Tenants', href: '/admin/tenants' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex w-full">
        {/* Sidebar - Collapsible on desktop with hover expand */}
        <aside 
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 
            ${isSidebarExpanded ? 'w-64' : 'lg:w-16'} 
            bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 
            transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 shadow-lg lg:shadow-none`}
          onMouseEnter={() => sidebarCollapsed && setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          
          {/* Logo */}
          <div className={`flex items-center ${!isSidebarExpanded ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-200 dark:border-slate-700`}>
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5 text-white" />
              </div>
              {isSidebarExpanded && (
                <span className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  Maresia Litoral
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className={`p-4 border-b border-gray-200 dark:border-slate-700 ${!isSidebarExpanded ? 'flex justify-center' : ''}`}>
            {!isSidebarExpanded ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center cursor-pointer">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{profile?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile?.full_name || 'Usuário'}
                  </p>
                  <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
                    {getRoleLabel(userRole)}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`p-2 space-y-1 overflow-y-auto flex-1 ${!isSidebarExpanded ? 'px-2' : 'px-4'}`}>
            {menuItems.map((item) => (
              !isSidebarExpanded ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className="flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <item.icon className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            ))}
          </nav>

          {/* Collapse Toggle - Desktop only */}
          <div className="hidden lg:flex p-2 border-t border-gray-200 dark:border-slate-700 justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Tenant Selector for Super Admin */}
              <TenantSelector />

              {/* Home Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
              >
                {language === 'pt' ? 'EN' : 'PT'}
              </Button>

              {/* Notifications */}
              <NotificationDropdown />

              {/* Sign Out */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50 dark:bg-slate-900 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Tenant Context Indicator */}
            {isSuperAdmin && (selectedTenant || isGlobalView) && (
              <Alert className="mb-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {isGlobalView ? (
                    <>Visualizando: <strong>Todos os Tenants</strong> (visão global)</>
                  ) : (
                    <>Visualizando como: <strong>{selectedTenant?.name}</strong></>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {children}
          </div>
        </main>
      </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default DashboardLayout;
