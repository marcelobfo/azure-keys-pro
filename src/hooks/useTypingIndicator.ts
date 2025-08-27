
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Shared registry to ensure a single subscribe() per channel name and proper cleanup
const typingChannels = new Map<string, { channel: any; subscribers: number; subscribed: boolean }>();

export const useTypingIndicator = (sessionId: string | null, userId: string | null) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const channelNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const channelName = `typing-${sessionId}`;
    channelNameRef.current = channelName;

    // Get or create the channel entry
    let entry = typingChannels.get(channelName);
    if (!entry) {
      const channel = supabase.channel(channelName);
      entry = { channel, subscribers: 0, subscribed: false };
      typingChannels.set(channelName, entry);
      console.log('[Typing] Created channel:', channelName);
    }

    const { channel } = entry;

    // Attach listener for this hook instance (allowed even if already subscribed)
    channel.on('broadcast', { event: 'typing' }, (payload: any) => {
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
    });

    // Subscribe only once per channel name
    if (!entry.subscribed) {
      channel.subscribe();
      entry.subscribed = true;
      console.log('[Typing] Subscribed channel:', channelName);
    }

    // Increment subscribers and expose channel for sending events
    entry.subscribers += 1;
    channelRef.current = channel;

    return () => {
      // Decrement and cleanup only when this was the last subscriber
      const currentEntry = typingChannels.get(channelName);
      if (!currentEntry) return;

      currentEntry.subscribers -= 1;
      if (currentEntry.subscribers <= 0) {
        try {
          supabase.removeChannel(currentEntry.channel);
          console.log('[Typing] Removed channel:', channelName);
        } catch (e) {
          console.warn('[Typing] Error removing channel:', e);
        } finally {
          typingChannels.delete(channelName);
        }
      }

      // Reset local state
      setTypingUsers(new Set());
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      channelRef.current = null;
      channelNameRef.current = null;
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
