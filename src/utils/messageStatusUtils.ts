import { supabase } from '@/integrations/supabase/client';

export const updateMessageStatus = async (
  messageId: string, 
  status: 'sent' | 'delivered' | 'read',
  sessionId?: string
) => {
  try {
    await supabase.functions.invoke('message-status', {
      body: {
        messageId,
        status,
        sessionId
      }
    });
  } catch (error) {
    console.error('Error updating message status:', error);
  }
};

export const getMessageStatusIcon = (message: any) => {
  if (message.sender_type !== 'lead') return null;
  
  switch (message.status) {
    case 'sending':
      return '⏳';
    case 'error':
      return '❌';
    case 'sent':
      return '✔';
    case 'delivered':
      return '✔✔';
    case 'read':
      return '✔✔'; // This would be blue in UI
    default:
      return '✔';
  }
};

export const getMessageStatusColor = (message: any) => {
  if (message.sender_type !== 'lead') return 'text-muted-foreground';
  
  switch (message.status) {
    case 'sending':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    case 'sent':
      return 'text-gray-400';
    case 'delivered':
      return 'text-gray-400';
    case 'read':
      return 'text-blue-500';
    default:
      return 'text-gray-400';
  }
};