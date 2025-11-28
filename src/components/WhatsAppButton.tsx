import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const WhatsAppButton = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [customIcon, setCustomIcon] = useState<string>('');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('chat_configurations')
        .select('whatsapp_enabled, whatsapp_number, whatsapp_position, whatsapp_icon_url')
        .eq('active', true)
        .maybeSingle();

      if (data) {
        setIsEnabled(data.whatsapp_enabled || false);
        setWhatsappNumber(data.whatsapp_number || '');
        setPosition(data.whatsapp_position || 'left');
        setCustomIcon(data.whatsapp_icon_url || '');
      }
    };

    fetchSettings();
  }, []);

  if (!isEnabled || !whatsappNumber) {
    return null;
  }

  const defaultIcon = 'https://automacao-piwigo.w3lidv.easypanel.host/i.php?/upload/2025/11/28/20251128004019-db6c7d58-la.webp';

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 ${position === 'left' ? 'left-6' : 'right-6'} z-50 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-whatsapp-pulse flex items-center justify-center w-14 h-14`}
      aria-label="Contato via WhatsApp"
    >
      <img 
        src={customIcon || defaultIcon} 
        alt="WhatsApp" 
        className="w-10 h-10 object-contain"
      />
    </a>
  );
};

export default WhatsAppButton;
