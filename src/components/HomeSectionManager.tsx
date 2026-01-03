import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useTenantContext } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Pencil } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HomeSection {
  id: string;
  tenant_id: string | null;
  title: string;
  filter_type: string;
  filter_field: string | null;
  filter_value: string | null;
  display_order: number;
  is_active: boolean;
  max_items: number;
}

interface SortableSectionItemProps {
  section: HomeSection;
  onEdit: (section: HomeSection) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const SortableSectionItem: React.FC<SortableSectionItemProps> = ({ section, onEdit, onDelete, onToggleActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFilterDescription = () => {
    switch (section.filter_type) {
      case 'boolean_field':
        const fieldLabels: Record<string, string> = {
          'is_featured': 'Em Destaque',
          'is_beachfront': 'Frente Mar',
          'is_near_beach': 'Quadra Mar',
          'is_development': 'Empreendimento',
          'accepts_exchange': 'Aceita Permuta',
        };
        return fieldLabels[section.filter_field || ''] || section.filter_field;
      case 'tag':
        return `Tag: ${section.filter_value}`;
      case 'property_type':
        return `Tipo: ${section.filter_value}`;
      case 'city':
        return `Cidade: ${section.filter_value}`;
      case 'purpose':
        return `Finalidade: ${section.filter_value}`;
      default:
        return section.filter_type;
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-2">
      <CardContent className="p-4 flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1">
          <p className="font-medium">{section.title}</p>
          <p className="text-sm text-muted-foreground">{getFilterDescription()} • Máx: {section.max_items} imóveis</p>
        </div>

        <Switch
          checked={section.is_active}
          onCheckedChange={(checked) => onToggleActive(section.id, checked)}
        />
        
        <Button variant="ghost" size="icon" onClick={() => onEdit(section)}>
          <Pencil className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={() => onDelete(section.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardContent>
    </Card>
  );
};

const HomeSectionManager: React.FC = () => {
  const { selectedTenantId } = useTenantContext();
  const { currentTenant } = useTenant();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formFilterType, setFormFilterType] = useState('boolean_field');
  const [formFilterField, setFormFilterField] = useState('is_featured');
  const [formFilterValue, setFormFilterValue] = useState('');
  const [formMaxItems, setFormMaxItems] = useState(8);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSections = async () => {
    if (!effectiveTenantId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Erro ao carregar seções');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveTenantId) {
      fetchSections();
    }
  }, [effectiveTenantId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const newSections = arrayMove(sections, oldIndex, newIndex);
    
    setSections(newSections);

    // Update display_order in database
    try {
      for (let i = 0; i < newSections.length; i++) {
        await supabase
          .from('home_sections')
          .update({ display_order: i + 1 })
          .eq('id', newSections[i].id);
      }
      toast.success('Ordem atualizada');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar ordem');
      fetchSections();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('home_sections')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      setSections(sections.map(s => s.id === id ? { ...s, is_active: isActive } : s));
      toast.success(isActive ? 'Seção ativada' : 'Seção desativada');
    } catch (error) {
      console.error('Error toggling section:', error);
      toast.error('Erro ao atualizar seção');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta seção?')) return;

    try {
      const { error } = await supabase
        .from('home_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSections(sections.filter(s => s.id !== id));
      toast.success('Seção excluída');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Erro ao excluir seção');
    }
  };

  const openCreateDialog = () => {
    setEditingSection(null);
    setFormTitle('');
    setFormFilterType('boolean_field');
    setFormFilterField('is_featured');
    setFormFilterValue('');
    setFormMaxItems(8);
    setDialogOpen(true);
  };

  const openEditDialog = (section: HomeSection) => {
    setEditingSection(section);
    setFormTitle(section.title);
    setFormFilterType(section.filter_type);
    setFormFilterField(section.filter_field || 'is_featured');
    setFormFilterValue(section.filter_value || '');
    setFormMaxItems(section.max_items);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const sectionData = {
      tenant_id: effectiveTenantId,
      title: formTitle.trim(),
      filter_type: formFilterType,
      filter_field: formFilterType === 'boolean_field' ? formFilterField : null,
      filter_value: ['tag', 'property_type', 'city', 'purpose'].includes(formFilterType) ? formFilterValue : null,
      max_items: formMaxItems,
      display_order: editingSection ? editingSection.display_order : sections.length + 1,
      is_active: true,
    };

    try {
      if (editingSection) {
        const { error } = await supabase
          .from('home_sections')
          .update(sectionData)
          .eq('id', editingSection.id);

        if (error) throw error;
        toast.success('Seção atualizada');
      } else {
        const { error } = await supabase
          .from('home_sections')
          .insert([sectionData]);

        if (error) throw error;
        toast.success('Seção criada');
      }

      setDialogOpen(false);
      fetchSections();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Erro ao salvar seção');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando seções...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Seções da Home Page</h3>
          <p className="text-sm text-muted-foreground">Arraste para reordenar. Crie seções com diferentes filtros.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Seção
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma seção criada. Clique em "Nova Seção" para começar.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Editar Seção' : 'Nova Seção'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Imóveis de Alto Padrão"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Filtro</Label>
              <Select value={formFilterType} onValueChange={setFormFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean_field">Campo Booleano</SelectItem>
                  <SelectItem value="tag">Por Tag</SelectItem>
                  <SelectItem value="property_type">Tipo de Imóvel</SelectItem>
                  <SelectItem value="city">Por Cidade</SelectItem>
                  <SelectItem value="purpose">Finalidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formFilterType === 'boolean_field' && (
              <div className="space-y-2">
                <Label>Campo</Label>
                <Select value={formFilterField} onValueChange={setFormFilterField}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="is_featured">Em Destaque</SelectItem>
                    <SelectItem value="is_beachfront">Frente Mar</SelectItem>
                    <SelectItem value="is_near_beach">Quadra Mar</SelectItem>
                    <SelectItem value="is_development">Empreendimento</SelectItem>
                    <SelectItem value="accepts_exchange">Aceita Permuta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formFilterType === 'tag' && (
              <div className="space-y-2">
                <Label>Nome da Tag</Label>
                <Input
                  value={formFilterValue}
                  onChange={(e) => setFormFilterValue(e.target.value)}
                  placeholder="Ex: alto-padrao, oportunidade, lancamento"
                />
              </div>
            )}

            {formFilterType === 'property_type' && (
              <div className="space-y-2">
                <Label>Tipo de Imóvel</Label>
                <Select value={formFilterValue} onValueChange={setFormFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="apartamento_diferenciado">Apartamento Diferenciado</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="cobertura">Cobertura</SelectItem>
                    <SelectItem value="lote">Lote</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="loft">Loft</SelectItem>
                    <SelectItem value="sala_comercial">Sala Comercial</SelectItem>
                    <SelectItem value="construcao">Construção/Planta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formFilterType === 'city' && (
              <div className="space-y-2">
                <Label>Nome da Cidade</Label>
                <Input
                  value={formFilterValue}
                  onChange={(e) => setFormFilterValue(e.target.value)}
                  placeholder="Ex: Balneário Camboriú, Itapema"
                />
              </div>
            )}

            {formFilterType === 'purpose' && (
              <div className="space-y-2">
                <Label>Finalidade</Label>
                <Select value={formFilterValue} onValueChange={setFormFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a finalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                    <SelectItem value="temporada">Temporada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Limite de Imóveis</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={formMaxItems}
                onChange={(e) => setFormMaxItems(Number(e.target.value) || 8)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingSection ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeSectionManager;
