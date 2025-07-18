import { useState, useEffect } from 'react';
import { useChatConfiguration } from './useChatConfiguration';

export const useChatBusinessHours = () => {
  const { configuration } = useChatConfiguration();
  const [isWithinBusinessHours, setIsWithinBusinessHours] = useState(true);

  useEffect(() => {
    const checkBusinessHours = () => {
      if (!configuration?.custom_responses?.horario_inicio || !configuration?.custom_responses?.horario_fim) {
        setIsWithinBusinessHours(true); // Se não configurado, considera sempre aberto
        return;
      }

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const startTime = configuration.custom_responses.horario_inicio;
      const endTime = configuration.custom_responses.horario_fim;

      // Verificar se está dentro do horário
      const withinHours = currentTime >= startTime && currentTime <= endTime;
      setIsWithinBusinessHours(withinHours);
    };

    // Verificar imediatamente
    checkBusinessHours();

    // Verificar a cada minuto
    const interval = setInterval(checkBusinessHours, 60000);

    return () => clearInterval(interval);
  }, [configuration]);

  const getBusinessHoursMessage = () => {
    if (!configuration?.custom_responses?.horario_inicio || !configuration?.custom_responses?.horario_fim) {
      return 'Estamos sempre disponíveis para atendê-lo!';
    }

    const inicio = configuration.custom_responses.horario_inicio;
    const fim = configuration.custom_responses.horario_fim;

    if (isWithinBusinessHours) {
      return `Nosso horário de atendimento é das ${inicio} às ${fim}. Responderemos em breve!`;
    } else {
      return `Estamos fora do horário de atendimento (${inicio} às ${fim}). Deixe sua mensagem e retornaremos assim que possível!`;
    }
  };

  return {
    isWithinBusinessHours,
    getBusinessHoursMessage,
    businessHours: {
      start: configuration?.custom_responses?.horario_inicio || '08:00',
      end: configuration?.custom_responses?.horario_fim || '18:00'
    }
  };
};