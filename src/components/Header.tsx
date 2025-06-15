
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, User, LogOut, Settings, Heart, Home, Phone, Menu, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Badge } from '@/components/ui/badge';
import NotificationDropdown from './NotificationDropdown';
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerLogoUrl, setHeaderLogoUrl] = useState<string | null>(null);

  // Busca logo global do site nas configs
  useEffect(() => {
    async function fetchLogo() {
      // Busque site_settings.footer_logo OU site_settings.header_logo se existir futuramente
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_logo')
        .maybeSingle();
      setHeaderLogoUrl(data && data.value ? data.value : null);
    }
    fetchLogo();
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
      case 'admin': return 'destructive';
      case 'corretor': return 'default';
      default: return 'secondary';
    }
  };

  const navItems = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/properties', label: 'Imóveis', icon: Home },
    { href: '/contact', label: 'Contato', icon: Phone },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            {headerLogoUrl ? (
              <img
                src={headerLogoUrl}
                alt="Logo"
                className="h-10 w-auto object-contain rounded-lg bg-white dark:bg-white"
                style={{ maxHeight: 40 }}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
            )}
            {/* Se tiver logo, esconde nome visual! */}
            {!headerLogoUrl && (
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Maresia Litoral
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="hidden sm:flex"
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
              className="hidden sm:flex"
            >
              {language === 'pt' ? 'EN' : 'PT'}
            </Button>

            {/* Notifications (only for authenticated users) */}
            {user && <NotificationDropdown />}

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {profile?.full_name || 'Usuário'}
                    </span>
                    {profile?.role && (
                      <Badge variant={getRoleBadgeVariant(profile.role)} className="ml-1">
                        {getRoleLabel(profile.role)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="mr-2 h-4 w-4" />
                    Favoritos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  Entrar
                </Button>
                <Button onClick={() => navigate('/auth')}>
                  Cadastrar
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-700 py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-slate-700">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLanguage}
                >
                  {language === 'pt' ? 'EN' : 'PT'}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
// O arquivo está ficando grande. Recomendo fortemente refatorar components/Header.tsx em mais arquivos/componentes após esse ajuste.
