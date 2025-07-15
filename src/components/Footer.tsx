
import React from 'react';
import { Home, Phone, MapPin, Mail, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const Footer = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = React.useState<Record<string, string>>({});
  const [logoHeight, setLogoHeight] = React.useState<number>(32);

  React.useEffect(() => {
    async function fetchFooter() {
      const keys = [
        'footer_logo',
        'footer_description', 
        'footer_email',
        'footer_phone',
        'footer_address',
        'footer_instagram',
        'footer_whatsapp',
        'footer_facebook',
        'logo_size_footer'
      ];
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);
      const result: Record<string, string> = {};
      data?.forEach((item: any) => {
        result[item.key] = item.value ?? "";
      });
      setSettings(result);
      
      // Configurar altura da logo do footer (padrão: 32px)
      const size = result.logo_size_footer ? parseInt(result.logo_size_footer) : 32;
      setLogoHeight(size > 16 && size < 150 ? size : 32); // Limitar entre 16-150px
    }
    fetchFooter();
  }, []);

  const socials = [
    {
      key: 'footer_instagram',
      url: settings['footer_instagram'],
      icon: <Instagram className="w-4 h-4" />,
    },
    {
      key: 'footer_whatsapp',
      url: settings['footer_whatsapp'],
      icon: <MessageCircle className="w-4 h-4" />, // Use generic message icon for WhatsApp
    },
    {
      key: 'footer_facebook',
      url: settings['footer_facebook'],
      icon: <Facebook className="w-4 h-4" />,
    }
  ].filter(s => s.url);

  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {settings.footer_logo ? (
                <img
                  src={settings.footer_logo}
                  alt="Logo"
                  style={{ height: `${logoHeight}px` }}
                  className="w-auto rounded-lg object-contain bg-white p-1"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
              )}
              <span className="text-xl font-bold">RealEstate Pro</span>
            </div>
            <p className="text-gray-300 mb-4">
              {settings.footer_description || t('home.about.text')}
            </p>
            <div className="flex space-x-4 mt-4">
              {socials.map(s => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
                  aria-label={s.key}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-blue-400 transition-colors">{t('nav.home')}</a></li>
              <li><a href="/properties" className="text-gray-300 hover:text-blue-400 transition-colors">{t('nav.properties')}</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-blue-400 transition-colors">{t('nav.contact')}</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('nav.contact')}</h3>
            <div className="space-y-2 text-gray-300">
              {settings.footer_phone && (
                <p className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{settings.footer_phone}</span>
                </p>
              )}
              {settings.footer_email && (
                <p className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{settings.footer_email}</span>
                </p>
              )}
              {settings.footer_address && (
                <p className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{settings.footer_address}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 RealEstate Pro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

