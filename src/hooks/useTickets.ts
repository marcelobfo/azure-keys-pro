import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupportTicket {
  id: string;
  protocol_number: string;
  lead_id: string;
  status: string;
  priority: string;
  subject?: string;
  description?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  lead?: {
    name: string;
    email: string;
    phone?: string;
  };
  assignee?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface TicketFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export const useTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('support-tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          console.log('[useTickets] Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newTicket = payload.new as SupportTicket;
            setTickets(prev => [newTicket, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedTicket = payload.new as SupportTicket;
            setTickets(prev => prev.map(ticket => 
              ticket.id === updatedTicket.id ? updatedTicket : ticket
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedTicket = payload.old as SupportTicket;
            setTickets(prev => prev.filter(ticket => ticket.id !== deletedTicket.id));
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchTickets = async (filters?: TicketFilters) => {
    try {
      setLoading(true);
      console.log('[useTickets] Fetching tickets with filters:', filters);

      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          lead:leads!support_tickets_lead_id_fkey (
            name,
            email,
            phone
          ),
          assignee:profiles!support_tickets_assigned_to_fkey (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.search) {
        query = query.ilike('protocol_number', `%${filters.search}%`);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useTickets] Error fetching tickets:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao buscar tickets',
          variant: 'destructive',
        });
        return;
      }

      setTickets(data || []);
    } catch (error) {
      console.error('[useTickets] Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: {
    lead_id: string;
    subject?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<SupportTicket> => {
    try {
      console.log('[useTickets] Creating ticket:', ticketData);

      // Generate protocol number
      const { data: protocolData, error: protocolError } = await supabase
        .rpc('generate_protocol_number');

      if (protocolError) {
        console.error('[useTickets] Error generating protocol:', protocolError);
        throw protocolError;
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          protocol_number: protocolData,
          lead_id: ticketData.lead_id,
          subject: ticketData.subject,
          description: ticketData.description,
          priority: ticketData.priority || 'medium',
          status: 'open'
        })
        .select(`
          *,
          lead:leads!support_tickets_lead_id_fkey (
            name,
            email,
            phone
          )
        `)
        .single();

      if (error) {
        console.error('[useTickets] Error creating ticket:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: `Ticket criado com protocolo ${data.protocol_number}`,
      });

      return data;
    } catch (error) {
      console.error('[useTickets] Error creating ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar ticket',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString()
      };

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error('[useTickets] Error updating ticket status:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Status do ticket atualizado',
      });
    } catch (error) {
      console.error('[useTickets] Error updating ticket status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do ticket',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTicketPriority = async (ticketId: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          priority, 
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        console.error('[useTickets] Error updating ticket priority:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Prioridade do ticket atualizada',
      });
    } catch (error) {
      console.error('[useTickets] Error updating ticket priority:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar prioridade do ticket',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const assignTicket = async (ticketId: string, assignedTo?: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          assigned_to: assignedTo, 
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        console.error('[useTickets] Error assigning ticket:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: assignedTo ? 'Ticket atribuído com sucesso' : 'Atribuição removida',
      });
    } catch (error) {
      console.error('[useTickets] Error assigning ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atribuir ticket',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getTicketByProtocol = async (protocol: string): Promise<SupportTicket | null> => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          lead:leads!support_tickets_lead_id_fkey (
            name,
            email,
            phone
          ),
          assignee:profiles!support_tickets_assigned_to_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('protocol_number', protocol)
        .maybeSingle();

      if (error) {
        console.error('[useTickets] Error fetching ticket by protocol:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[useTickets] Error fetching ticket by protocol:', error);
      return null;
    }
  };

  const linkTicketToChat = async (ticketId: string, sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ ticket_id: ticketId })
        .eq('id', sessionId);

      if (error) {
        console.error('[useTickets] Error linking ticket to chat:', error);
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Ticket vinculado ao chat',
      });
    } catch (error) {
      console.error('[useTickets] Error linking ticket to chat:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao vincular ticket ao chat',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Load tickets on mount
  useEffect(() => {
    fetchTickets();
  }, []);

  return {
    tickets,
    loading,
    fetchTickets,
    createTicket,
    updateTicketStatus,
    updateTicketPriority,
    assignTicket,
    getTicketByProtocol,
    linkTicketToChat,
  };
};