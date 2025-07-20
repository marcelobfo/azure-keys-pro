
import { useRef } from 'react';

export const useChatSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Verificar se o contexto está suspenso e tentar reativá-lo
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.error('Erro ao inicializar contexto de áudio:', error);
        return null;
      }
    }
    return audioContextRef.current;
  };

  const playNotificationSound = async () => {
    try {
      const audioContext = await initAudioContext();
      if (!audioContext) return;
      
      // Create a notification sound (higher pitch, longer duration)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Higher frequency for notifications
      oscillator.type = 'sine';
      
      // Envelope for more pleasant sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
      
      console.log('Som de notificação tocado');
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
    }
  };

  const playMessageSound = async () => {
    try {
      const audioContext = await initAudioContext();
      if (!audioContext) return;
      
      // Create a subtle message sound (lower pitch, shorter duration)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600; // Lower frequency for messages
      oscillator.type = 'sine';
      
      // Quick, subtle envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('Som de mensagem tocado');
    } catch (error) {
      console.error('Erro ao tocar som de mensagem:', error);
    }
  };

  return {
    playNotificationSound,
    playMessageSound
  };
};
