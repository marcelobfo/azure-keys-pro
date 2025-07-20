
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTypingIndicator = (sessionId: string | null, userId: string | null) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const channelName = `typing-${sessionId}`;
    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, is_typing } = payload.payload;
        
        if (user_id !== userId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (is_typing) {
              newSet.add(user_id);
            } else {
              newSet.delete(user_id);
            }
            return newSet;
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId, userId]);

  const startTyping = () => {
    if (!sessionId || !userId || isTyping) return;

    setIsTyping(true);
    
    const channel = channelRef.current;
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: userId, is_typing: true }
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!sessionId || !userId || !isTyping) return;

    setIsTyping(false);
    
    const channel = channelRef.current;
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: userId, is_typing: false }
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  return {
    typingUsers: Array.from(typingUsers),
    isTyping,
    startTyping,
    stopTyping
  };
};
