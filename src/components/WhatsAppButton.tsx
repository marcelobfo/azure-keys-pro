
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
      console.log('Buscando configuração do WhatsApp...');
      const { data, error } = await supabase
        .rpc('get_public_chat_config');

      if (error) {
        console.error('Erro ao buscar configuração do WhatsApp:', error);
        return;
      }

      if (data && data.length > 0) {
        const config = data[0];
        console.log('Configuração WhatsApp carregada:', { 
          enabled: config.whatsapp_enabled, 
          hasNumber: !!config.whatsapp_number 
        });
        setIsEnabled(config.whatsapp_enabled || false);
        setWhatsappNumber(config.whatsapp_number || '');
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

  // Só renderizar se o WhatsApp estiver habilitado e tiver número configurado
  if (!isEnabled || !whatsappNumber) {
    console.log('WhatsApp não será exibido:', { enabled: isEnabled, hasNumber: !!whatsappNumber });
    return null;
  }

  console.log('WhatsApp será exibido');

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
