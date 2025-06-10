
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, User, Settings, LogOut, Bell, Moon, Sun, 
  Menu, X, Heart, Search, MessageSquare, Calendar,
  BarChart3, Users, Building
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole: 'user' | 'corretor' | 'admin';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, userRole }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'corretor': return 'Corretor';
      default: return 'Usuário';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'corretor': return 'default' as const;
      default: return 'secondary' as const;
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
      { icon: Heart, label: 'Favoritos', href: '/favorites' },
      { icon: Bell, label: 'Alertas', href: '/alerts' },
      { icon: User, label: 'Perfil', href: '/profile/settings' },
    ];

    if (userRole === 'corretor' || userRole === 'admin') {
      baseItems.splice(1, 0, 
        { icon: Building, label: 'Meus Imóveis', href: '/manage-properties' },
        { icon: MessageSquare, label: 'Leads', href: '/leads-management' },
        { icon: Calendar, label: 'Visitas', href: '/visits-management' }
      );
    }

    if (userRole === 'admin') {
      baseItems.splice(-1, 0,
        { icon: Users, label: 'Usuários', href: '/admin/users' },
        { icon: Settings, label: 'Configurações', href: '/webhook-settings' }
      );
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex w-full">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 
        bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 
        transition-transform duration-300 ease-in-out`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Maresia Litoral
            </span>
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
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
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
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

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
              <div className="relative">
                <NotificationDropdown />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>

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
  );
};

export default DashboardLayout;
