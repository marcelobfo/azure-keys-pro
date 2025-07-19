
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Clock, MessageCircle } from 'lucide-react';

const AttendantStatusToggle = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [currentChats, setCurrentChats] = useState(0);
  const [maxChats, setMaxChats] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAvailabilityStatus();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchAvailabilityStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('attendant_availability')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setIsOnline(data.is_online);
        setCurrentChats(data.current_chats || 0);
        setMaxChats(data.max_concurrent_chats || 3);
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`attendant-${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendant_availability',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Status atualizado:', payload);
          if (payload.new) {
            setIsOnline(payload.new.is_online);
            setCurrentChats(payload.new.current_chats || 0);
            setMaxChats(payload.new.max_concurrent_chats || 3);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleOnlineStatus = async () => {
    if (!user) return;

    try {
      const newStatus = !isOnline;
      
      const { error } = await supabase
        .from('attendant_availability')
        .upsert({
          user_id: user.id,
          is_online: newStatus,
          last_seen: new Date().toISOString(),
          max_concurrent_chats: maxChats,
          current_chats: newStatus ? currentChats : 0
        });

      if (error) throw error;

      setIsOnline(newStatus);
      if (!newStatus) {
        setCurrentChats(0);
      }

      toast({
        title: newStatus ? "Status: Online" : "Status: Offline",
        description: newStatus ? "Você está disponível para atendimento" : "Você está indisponível",
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando status...</div>;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" />
            <div>
              <div className="flex items-center gap-2">
                <Label>Status do Atendente</Label>
                <Badge variant={isOnline ? "default" : "secondary"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{currentChats}/{maxChats} chats</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Última atividade: agora</span>
                </div>
              </div>
            </div>
          </div>
          
          <Switch
            checked={isOnline}
            onCheckedChange={toggleOnlineStatus}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendantStatusToggle;
