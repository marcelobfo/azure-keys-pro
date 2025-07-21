
import { useCallback } from 'react';

export const useChatSounds = () => {
  const playNotificationSound = useCallback(() => {
    try {
      console.log('Tentando tocar som de notificação');
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('Não foi possível tocar o som de notificação:', error);
        // Fallback para um beep do sistema
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance('');
          utterance.volume = 0;
          window.speechSynthesis.speak(utterance);
        }
      });
      console.log('Som de notificação tocado');
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
    }
  }, []);

  const playMessageSound = useCallback(() => {
    try {
      console.log('Tentando tocar som de mensagem');
      const audio = new Audio('/message.mp3');
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.log('Não foi possível tocar o som de mensagem:', error);
        // Fallback mais simples
        if (typeof window !== 'undefined') {
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(context.currentTime + 0.1);
          } catch (audioError) {
            console.log('Fallback de áudio também falhou:', audioError);
          }
        }
      });
      console.log('Som de mensagem tocado');
    } catch (error) {
      console.error('Erro ao tocar som de mensagem:', error);
    }
  }, []);

  return {
    playNotificationSound,
    playMessageSound
  };
};
