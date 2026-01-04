import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, User, Settings, LogOut, Bell, Moon, Sun, 
  Menu, X, Heart, MessageSquare, Calendar,
  BarChart3, Users, Building, Building2, FileText, ChevronLeft, ChevronRight, DollarSign, Store, Shield, UserCircle, PlugZap
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
import { cn } from '@/lib/utils';

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
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  
  // Determine if sidebar should be expanded (collapsed but hovered = expanded)
  const isSidebarExpanded = !sidebarCollapsed || sidebarHovered;

  // Check if a route is active
  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

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
      baseItems.splice(-1, 0, { icon: UserCircle, label: 'Proprietários', href: '/admin/owners' });
    }

    // Items ONLY for super_admin
    if (isSuperAdmin) {
      baseItems.splice(-1, 0, { icon: Building2, label: 'Tenants', href: '/admin/tenants' });
      baseItems.splice(-1, 0, { icon: PlugZap, label: 'Integrações', href: '/admin/integrations-overview' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex w-full">
        {/* Sidebar - Modern design with gradient */}
        <aside 
          className={cn(
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50',
            isSidebarExpanded ? 'w-64' : 'lg:w-16',
            'bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
            'border-r border-border/50',
            'transition-all duration-300 ease-in-out flex flex-col flex-shrink-0',
            'shadow-xl lg:shadow-none'
          )}
          onMouseEnter={() => sidebarCollapsed && setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          
          {/* Logo */}
          <div className={cn(
            'flex items-center p-4 border-b border-border/50',
            !isSidebarExpanded ? 'justify-center' : 'justify-between'
          )}>
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                <Home className="w-5 h-5 text-white" />
              </div>
              {isSidebarExpanded && (
                <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent whitespace-nowrap">
                  Maresia Litoral
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className={cn(
            'p-4 border-b border-border/50',
            !isSidebarExpanded ? 'flex justify-center' : ''
          )}>
            {!isSidebarExpanded ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile?.full_name || 'Usuário'} 
                        className="w-10 h-10 rounded-xl object-cover cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 rounded-xl flex items-center justify-center cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background"></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border-border">
                  <p className="font-medium">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile?.full_name || 'Usuário'} 
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {profile?.full_name || 'Usuário'}
                  </p>
                  <Badge 
                    variant={getRoleBadgeVariant(userRole)} 
                    className="text-xs mt-0.5 font-medium"
                  >
                    {getRoleLabel(userRole)}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            'py-4 space-y-1 overflow-y-auto flex-1',
            !isSidebarExpanded ? 'px-2' : 'px-3'
          )}>
            {menuItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              
              return !isSidebarExpanded ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center justify-center p-2.5 rounded-xl transition-all duration-200',
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <item.icon className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border-border font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <item.icon className={cn('w-5 h-5', isActive && 'text-white')} />
                  <span className={cn('font-medium', isActive && 'text-white')}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Collapse Toggle - Desktop only */}
          <div className="hidden lg:flex p-3 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                'w-full hover:bg-accent',
                !isSidebarExpanded && 'justify-center px-0'
              )}
            >
              {sidebarCollapsed ? (
                <>
                  <ChevronRight className="w-4 h-4" />
                  {isSidebarExpanded && <span className="ml-2">Expandir</span>}
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="ml-2">Recolher</span>
                </>
              )}
            </Button>
          </div>
        </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* Top Bar - Modern design */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 px-6 py-4 flex-shrink-0 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden hover:bg-accent"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              {/* Tenant Selector for Super Admin */}
              <TenantSelector />

              {/* Home Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="hidden sm:flex hover:bg-accent"
              >
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-accent"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="hover:bg-accent font-medium"
              >
                {language === 'pt' ? 'EN' : 'PT'}
              </Button>

              {/* Notifications */}
              <NotificationDropdown />

              {/* Sign Out */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-background overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Tenant Context Indicator */}
            {isSuperAdmin && (selectedTenant || isGlobalView) && (
              <Alert className="mb-4 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50">
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
