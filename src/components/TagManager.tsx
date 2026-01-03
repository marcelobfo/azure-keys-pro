import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePropertyTags, PropertyTag } from '@/hooks/usePropertyTags';

const PRESET_COLORS = [
  '#ef4444', // Vermelho
  '#f97316', // Laranja
  '#eab308', // Amarelo
  '#22c55e', // Verde
  '#06b6d4', // Ciano
  '#3b82f6', // Azul
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#6b7280', // Cinza
  '#1e293b', // Slate
];

const TagManager: React.FC = () => {
  const { tags, loading, createTag, updateTag, deleteTag } = usePropertyTags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<PropertyTag | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formDescription, setFormDescription] = useState('');

  const openCreateDialog = () => {
    setEditingTag(null);
    setFormName('');
    setFormColor('#3b82f6');
    setFormDescription('');
    setDialogOpen(true);
  };

  const openEditDialog = (tag: PropertyTag) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormDescription(tag.description || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    if (editingTag) {
      await updateTag(editingTag.id, {
        name: formName.trim(),
        color: formColor,
        description: formDescription.trim(),
      });
    } else {
      await createTag({
        name: formName.trim(),
        color: formColor,
        description: formDescription.trim(),
      });
    }

    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTag(id);
    setDeleteConfirmId(null);
  };

  if (loading) {
    return <div className="text-center py-4">Carregando tags...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tags de Imóveis</h3>
          <p className="text-sm text-muted-foreground">
            Crie tags personalizadas para categorizar seus imóveis
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          Nenhuma tag criada. Clique em "Nova Tag" para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <div className="min-w-0">
                  <span className="font-medium truncate block">{tag.name}</span>
                  <span className="text-xs text-muted-foreground">({tag.slug})</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(tag)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {deleteConfirmId === tag.id ? (
                  <div className="flex gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(tag.id)}
                    >
                      Sim
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Não
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(tag.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Tag *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Alto Padrão"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formColor === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
                <Input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-8 h-8 p-0 border-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: formColor }}
                />
                <span className="text-sm text-muted-foreground">{formColor}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descrição da tag..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editingTag ? 'Salvar' : 'Criar Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManager;
