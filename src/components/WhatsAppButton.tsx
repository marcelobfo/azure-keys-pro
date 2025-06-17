
import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';

const WhatsAppButton = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    fetchWhatsAppConfig();
  }, []);

  const fetchWhatsAppConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_configurations')
        .select('whatsapp_enabled, whatsapp_number')
        .maybeSingle();

      if (data) {
        setIsEnabled(data.whatsapp_enabled || false);
        setWhatsappNumber(data.whatsapp_number || '');
      }
    } catch (error) {
      console.error('Erro ao buscar configuração do WhatsApp:', error);
    }
  };

  const handleWhatsAppClick = () => {
    if (whatsappNumber) {
      const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os imóveis disponíveis.');
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!isEnabled || !whatsappNumber) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button
        onClick={handleWhatsAppClick}
        className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
        title="Falar no WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default WhatsAppButton;
