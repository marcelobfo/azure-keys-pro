import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientTimeoutWarningProps {
  sessionId: string | null;
  lastAttendantMessage?: string;
  onTimeoutReached?: () => void;
}

const ClientTimeoutWarning: React.FC<ClientTimeoutWarningProps> = ({
  sessionId,
  lastAttendantMessage,
  onTimeoutReached
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);

  const WARNING_THRESHOLD = 120; // 2 minutes in seconds
  const TIMEOUT_THRESHOLD = 300; // 5 minutes in seconds

  useEffect(() => {
    if (!sessionId || !lastAttendantMessage) {
      setTimeElapsed(0);
      setShowWarning(false);
      setIsTimeout(false);
      return;
    }

    const lastMessageTime = new Date(lastAttendantMessage).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastMessageTime) / 1000);
      
      setTimeElapsed(elapsed);
      
      if (elapsed >= TIMEOUT_THRESHOLD) {
        setIsTimeout(true);
        setShowWarning(false);
        onTimeoutReached?.();
      } else if (elapsed >= WARNING_THRESHOLD) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
        setIsTimeout(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, lastAttendantMessage, onTimeoutReached]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeUntilTimeout = () => {
    return Math.max(0, TIMEOUT_THRESHOLD - timeElapsed);
  };

  if (!sessionId) return null;

  if (isTimeout) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <span>
              Tempo limite atingido. Um atendente retomará o contato em breve.
            </span>
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {formatTime(timeElapsed)}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (showWarning) {
    const remainingTime = getTimeUntilTimeout();
    const urgency = remainingTime < 60 ? 'high' : 'medium';
    
    return (
      <Alert className={cn(
        "border-yellow-200 bg-yellow-50 animate-pulse",
        urgency === 'high' && "border-red-200 bg-red-50"
      )}>
        <Clock className={cn(
          "h-4 w-4",
          urgency === 'high' ? "text-red-600" : "text-yellow-600"
        )} />
        <AlertDescription className={cn(
          urgency === 'high' ? "text-red-800" : "text-yellow-800"
        )}>
          <div className="flex items-center justify-between">
            <span>
              {urgency === 'high' 
                ? '⚠️ Um atendente responderá em instantes!' 
                : '💬 Um atendente irá responder em breve...'
              }
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <span>Aguardando:</span>
                <span className="font-mono">{formatTime(timeElapsed)}</span>
              </div>
              {urgency !== 'high' && (
                <div className="flex items-center gap-1 text-xs opacity-70">
                  <span>Restam:</span>
                  <span className="font-mono">{formatTime(remainingTime)}</span>
                </div>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show "attended" status when response is quick
  if (timeElapsed > 0 && timeElapsed < 30) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>✨ Atendimento ativo - Resposta rápida!</span>
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {formatTime(timeElapsed)}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ClientTimeoutWarning;