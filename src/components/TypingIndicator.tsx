
import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isVisible, 
  userName = 'Alguém',
  className 
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground p-2", className)}>
      <span>{userName} está digitando</span>
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;
