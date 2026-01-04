
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

interface KnowledgeBaseManagerProps {
  tenantId?: string;
}

const KnowledgeBaseManager = ({ tenantId }: KnowledgeBaseManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    published: true
  });

  const queryClient = useQueryClient();

  // Fetch articles filtered by tenant
  const { data: articles, isLoading } = useQuery({
    queryKey: ['knowledge-base-articles', searchTerm, tenantId],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_base_articles')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by tenant if provided
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (searchTerm) {
        query = query.textSearch('title,content', searchTerm);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeBaseArticle[];
    }
  });

  // Create/Update article mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (articleData: any) => {
      const tagsArray = articleData.tags ? articleData.tags.split(',').map((tag: string) => tag.trim()) : [];
      
      if (editingArticle) {
        const { data, error } = await supabase
          .from('knowledge_base_articles')
          .update({
            title: articleData.title,
            content: articleData.content,
            tags: tagsArray,
            published: articleData.published
          })
          .eq('id', editingArticle.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Include tenant_id when creating new article
        const insertData: any = {
          title: articleData.title,
          content: articleData.content,
          tags: tagsArray,
          published: articleData.published
        };
        
        if (tenantId) {
          insertData.tenant_id = tenantId;
        }
        
        const { data, error } = await supabase
          .from('knowledge_base_articles')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-articles'] });
      toast.success(editingArticle ? 'Artigo atualizado!' : 'Artigo criado!');
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao salvar artigo:', error);
      toast.error('Erro ao salvar artigo');
    }
  });

  // Delete article mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_base_articles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-articles'] });
      toast.success('Artigo excluído!');
    },
    onError: (error) => {
      console.error('Erro ao excluir artigo:', error);
      toast.error('Erro ao excluir artigo');
    }
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', tags: '', published: true });
    setEditingArticle(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (article: KnowledgeBaseArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      tags: article.tags.join(', '),
      published: article.published
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUpdateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Base de Conhecimento</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Artigo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="imóveis, vendas, documentação"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Publicado</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUpdateMutation.isPending}>
                  {createUpdateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar artigos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando artigos...</div>
      ) : (
        <div className="grid gap-4">
          {articles?.map((article) => (
            <Card key={article.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{article.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={article.published ? "default" : "secondary"}>
                        {article.published ? 'Publicado' : 'Rascunho'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(article)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(article.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {article.content}
                </p>
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {articles?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum artigo encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseManager;
