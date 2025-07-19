import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SupportTicket {
  id: string;
  protocol_number: string;
  lead_id: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject?: string;
  initial_message?: string;
  resolution_notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  rating?: number;
  feedback?: string;
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

export const useTicketsSimple = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  // Simular tickets para desenvolvimento
  const mockTickets: SupportTicket[] = [
    {
      id: '1',
      protocol_number: '2025000001',
      lead_id: '1',
      status: 'pending',
      priority: 'normal',
      subject: 'Atendimento via chat',
      initial_message: 'Preciso de informações sobre imóveis',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lead: {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-9999'
      }
    }
  ];

  // Buscar tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Simular busca
      setTimeout(() => {
        setTickets(mockTickets);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      setLoading(false);
    }
  };

  // Criar ticket
  const createTicket = async (ticketData: {
    lead_id: string;
    subject?: string;
    initial_message?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) => {
    try {
      // Gerar protocolo sequencial
      const nextNumber = tickets.length + 1;
      const protocol = `2025${nextNumber.toString().padStart(6, '0')}`;
      
      const newTicket: SupportTicket = {
        id: Date.now().toString(),
        protocol_number: protocol,
        lead_id: ticketData.lead_id,
        status: 'pending',
        priority: ticketData.priority || 'normal',
        subject: ticketData.subject,
        initial_message: ticketData.initial_message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTickets(prev => [newTicket, ...prev]);
      
      toast({
        title: 'Sucesso',
        description: `Ticket criado com protocolo ${protocol}`,
      });
      
      return newTicket;
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar ticket',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Atualizar status do ticket
  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              status, 
              updated_at: new Date().toISOString(),
              resolved_at: (status === 'resolved' || status === 'closed') ? new Date().toISOString() : ticket.resolved_at
            }
          : ticket
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Status do ticket atualizado',
      });
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do ticket',
        variant: 'destructive',
      });
    }
  };

  // Buscar ticket por protocolo
  const getTicketByProtocol = async (protocol: string) => {
    try {
      const ticket = tickets.find(t => t.protocol_number === protocol);
      return ticket || null;
    } catch (error) {
      console.error('Erro ao buscar ticket por protocolo:', error);
      return null;
    }
  };

  // Avaliar ticket
  const rateTicket = async (ticketId: string, rating: number, feedback?: string) => {
    try {
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, rating, feedback, updated_at: new Date().toISOString() }
          : ticket
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Avaliação enviada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao avaliar ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar avaliação',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return {
    tickets,
    loading,
    fetchTickets,
    createTicket,
    updateTicketStatus,
    getTicketByProtocol,
    rateTicket,
  };
};