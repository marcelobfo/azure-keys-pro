
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Tag } from 'lucide-react';

interface ChatSessionTagsProps {
  sessionId: string;
  currentTags?: string[];
  onTagsUpdate: (sessionId: string, tags: string[]) => void;
  className?: string;
}

const ChatSessionTags: React.FC<ChatSessionTagsProps> = ({
  sessionId,
  currentTags = [],
  onTagsUpdate,
  className = ""
}) => {
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(currentTags);

  const commonTags = [
    'Dúvida Geral',
    'Interesse em Compra',
    'Agendamento de Visita',
    'Informações de Preço',
    'Documentação',
    'Financiamento',
    'Problema Técnico',
    'Reclamação',
    'Elogio',
    'Sugestão'
  ];

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      const updatedTags = [...tags, tag];
      setTags(updatedTags);
      onTagsUpdate(sessionId, updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    onTagsUpdate(sessionId, updatedTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag.trim());
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags do Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tags atuais */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto w-auto p-0 hover:bg-transparent"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input para nova tag */}
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma nova tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => addTag(newTag.trim())}
            disabled={!newTag.trim() || tags.includes(newTag.trim())}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Tags comuns */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Tags comuns:</p>
          <div className="flex flex-wrap gap-1">
            {commonTags
              .filter(tag => !tags.includes(tag))
              .map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSessionTags;
