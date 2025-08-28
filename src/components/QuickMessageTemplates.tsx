import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Edit2, Trash2, Clock, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickMessage {
  id: string;
  title: string;
  content: string;
  category: 'greeting' | 'info' | 'closing' | 'property' | 'general';
  isDefault: boolean;
  usageCount: number;
}

interface QuickMessageTemplatesProps {
  onSelectMessage: (content: string) => void;
}

const defaultTemplates: QuickMessage[] = [
  {
    id: '1',
    title: 'Saudação Inicial',
    content: '👋 Olá! Seja bem-vindo à Maresia Litoral Imóveis! Como posso ajudá-lo hoje?',
    category: 'greeting',
    isDefault: true,
    usageCount: 0
  },
  {
    id: '2',
    title: 'Solicitar Informações',
    content: 'Para te ajudar melhor, poderia me informar qual tipo de imóvel você está procurando e em qual região?',
    category: 'info',
    isDefault: true,
    usageCount: 0
  },
  {
    id: '3',
    title: 'Agendar Visita',
    content: 'Ótima escolha! Gostaria de agendar uma visita ao imóvel? Posso verificar os horários disponíveis para você.',
    category: 'property',
    isDefault: true,
    usageCount: 0
  },
  {
    id: '4',
    title: 'Informações de Financiamento',
    content: 'Temos parcerias com os principais bancos para facilitar seu financiamento. Posso te conectar com nosso especialista?',
    category: 'info',
    isDefault: true,
    usageCount: 0
  },
  {
    id: '5',
    title: 'Despedida Profissional',
    content: 'Foi um prazer atendê-lo! Estarei sempre aqui para ajudar. Tenha um excelente dia! 🌊🏡',
    category: 'closing',
    isDefault: true,
    usageCount: 0
  },
  {
    id: '6',
    title: 'Aguardar Resposta',
    content: 'Estou verificando essas informações para você. Um momento, por favor...',
    category: 'general',
    isDefault: true,
    usageCount: 0
  }
];

const QuickMessageTemplates: React.FC<QuickMessageTemplatesProps> = ({ onSelectMessage }) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<QuickMessage[]>(defaultTemplates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickMessage | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    category: 'general' as QuickMessage['category']
  });

  const categories = [
    { value: 'greeting', label: 'Saudação', color: 'bg-blue-100 text-blue-800' },
    { value: 'info', label: 'Informações', color: 'bg-green-100 text-green-800' },
    { value: 'property', label: 'Imóveis', color: 'bg-purple-100 text-purple-800' },
    { value: 'closing', label: 'Despedida', color: 'bg-orange-100 text-orange-800' },
    { value: 'general', label: 'Geral', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSelectTemplate = (template: QuickMessage) => {
    // Increment usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1 }
        : t
    ));
    
    onSelectMessage(template.content);
    
    toast({
      title: 'Mensagem inserida',
      description: `"${template.title}" foi adicionada ao campo de mensagem`,
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.title || !newTemplate.content) {
      toast({
        title: 'Erro',
        description: 'Título e conteúdo são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const template: QuickMessage = {
      id: editingTemplate?.id || Date.now().toString(),
      title: newTemplate.title,
      content: newTemplate.content,
      category: newTemplate.category,
      isDefault: false,
      usageCount: editingTemplate?.usageCount || 0
    };

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
      toast({
        title: 'Modelo atualizado',
        description: 'Suas alterações foram salvas'
      });
    } else {
      setTemplates(prev => [...prev, template]);
      toast({
        title: 'Modelo criado',
        description: 'Novo modelo de mensagem adicionado'
      });
    }

    setNewTemplate({ title: '', content: '', category: 'general' });
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const handleEditTemplate = (template: QuickMessage) => {
    if (template.isDefault) {
      toast({
        title: 'Não é possível editar',
        description: 'Modelos padrão não podem ser editados',
        variant: 'destructive'
      });
      return;
    }
    
    setEditingTemplate(template);
    setNewTemplate({
      title: template.title,
      content: template.content,
      category: template.category
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) {
      toast({
        title: 'Não é possível excluir',
        description: 'Modelos padrão não podem ser excluídos',
        variant: 'destructive'
      });
      return;
    }

    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast({
      title: 'Modelo excluído',
      description: 'Modelo de mensagem removido'
    });
  };

  const getCategoryInfo = (category: QuickMessage['category']) => {
    return categories.find(c => c.value === category) || categories[4];
  };

  const sortedTemplates = [...templates].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return b.usageCount - a.usageCount;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens Rápidas
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setEditingTemplate(null);
                  setNewTemplate({ title: '', content: '', category: 'general' });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Modelo' : 'Novo Modelo de Mensagem'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Saudação para novos clientes"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value as QuickMessage['category'] }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="content">Conteúdo da Mensagem</Label>
                  <Textarea
                    id="content"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Digite o conteúdo da mensagem..."
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveTemplate}>
                    {editingTemplate ? 'Atualizar' : 'Criar'} Modelo
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {sortedTemplates.map((template) => {
              const categoryInfo = getCategoryInfo(template.category);
              return (
                <div
                  key={template.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{template.title}</span>
                      <Badge className={`text-xs ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </Badge>
                      {template.isDefault && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {template.usageCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
                          <Clock className="h-3 w-3" />
                          {template.usageCount}
                        </div>
                      )}
                      {!template.isDefault && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {template.content}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    Usar esta mensagem
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default QuickMessageTemplates;