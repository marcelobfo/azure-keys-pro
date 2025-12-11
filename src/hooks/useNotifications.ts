
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'property_alert' | 'lead_assigned' | 'system';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);
  const isSubscribingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const cleanup = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribingRef.current = false;
    };

    if (user?.id) {
      fetchNotifications(isMounted);
      setupRealtimeSubscription(isMounted);
    } else {
      cleanup();
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [user?.id]);

  const fetchNotifications = async (isMounted: boolean) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
      } else if (isMounted) {
        const typedData = (data || []).map(item => ({
          ...item,
          type: item.type as 'property_alert' | 'lead_assigned' | 'system'
        }));
        setNotifications(typedData);
        setUnreadCount(typedData.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
    if (isMounted) setLoading(false);
  };

  const setupRealtimeSubscription = (isMounted: boolean) => {
    if (!user?.id || isSubscribingRef.current || channelRef.current) {
      return;
    }

    isSubscribingRef.current = true;

    try {
      const channelName = `notifications-${user.id}-${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (!isMounted) return;
            const newNotification = {
              ...payload.new,
              type: payload.new.type as 'property_alert' | 'lead_assigned' | 'system'
            } as Notification;
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (!error) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const refetch = async () => {
    await fetchNotifications(true);
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch,
  };
};
