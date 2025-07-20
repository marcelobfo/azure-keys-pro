import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ChatConnectionIndicatorProps {
  status: 'connecting' | 'connected' | 'disconnected';
  retryCount?: number;
  maxRetries?: number;
}

const ChatConnectionIndicator: React.FC<ChatConnectionIndicatorProps> = ({
  status,
  retryCount = 0,
  maxRetries = 3
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: 'Conectado',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'connecting':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: retryCount > 0 ? `Reconectando... (${retryCount}/${maxRetries})` : 'Conectando...',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: retryCount >= maxRetries ? 'Falha na conexão' : 'Desconectado',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      {config.icon}
      <span className="text-xs">{config.text}</span>
    </Badge>
  );
};

export default ChatConnectionIndicator;