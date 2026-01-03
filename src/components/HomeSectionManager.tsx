import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useTenantContext } from '@/contexts/TenantContext';
import { usePropertyTags } from '@/hooks/usePropertyTags';
import { SectionFilter } from '@/hooks/useHomeSections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Pencil, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HomeSection {
  id: string;
  tenant_id: string | null;
  title: string;
  filters: SectionFilter[];
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

const FILTER_TYPE_LABELS: Record<string, string> = {
  boolean_field: 'Campo',
  tag: 'Tag',
  property_type: 'Tipo',
  city: 'Cidade',
  purpose: 'Finalidade',
};

const BOOLEAN_FIELD_LABELS: Record<string, string> = {
  is_featured: 'Em Destaque',
  is_beachfront: 'Frente Mar',
  is_near_beach: 'Quadra Mar',
  is_development: 'Empreendimento',
  accepts_exchange: 'Aceita Permuta',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartamento: 'Apartamento',
  apartamento_diferenciado: 'Apto Diferenciado',
  casa: 'Casa',
  cobertura: 'Cobertura',
  lote: 'Lote',
  studio: 'Studio',
  loft: 'Loft',
  sala_comercial: 'Sala Comercial',
  construcao: 'Construção',
};

const PURPOSE_LABELS: Record<string, string> = {
  venda: 'Venda',
  aluguel: 'Aluguel',
  temporada: 'Temporada',
};

const getFilterLabel = (filter: SectionFilter): string => {
  switch (filter.type) {
    case 'boolean_field':
      return BOOLEAN_FIELD_LABELS[filter.field || ''] || filter.field || '';
    case 'property_type':
      return PROPERTY_TYPE_LABELS[filter.value] || filter.value;
    case 'purpose':
      return PURPOSE_LABELS[filter.value] || filter.value;
    default:
      return filter.value;
  }
};

const SortableSectionItem: React.FC<SortableSectionItemProps> = ({ section, onEdit, onDelete, onToggleActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFiltersDescription = () => {
    const filters = section.filters && section.filters.length > 0 
      ? section.filters 
      : section.filter_type && (section.filter_field || section.filter_value)
        ? [{ 
            type: section.filter_type as SectionFilter['type'], 
            field: section.filter_field, 
            value: section.filter_value || '' 
          }]
        : [];

    if (filters.length === 0) return 'Sem filtros';

    return filters.map(f => {
      const typeLabel = FILTER_TYPE_LABELS[f.type] || f.type;
      const valueLabel = getFilterLabel(f);
      return `${typeLabel}: ${valueLabel}`;
    }).join(' • ');
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-2">
      <CardContent className="p-4 flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{section.title}</p>
          <p className="text-sm text-muted-foreground truncate">{getFiltersDescription()} • Máx: {section.max_items}</p>
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
  const { tags: availableTags } = usePropertyTags();

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formFilters, setFormFilters] = useState<SectionFilter[]>([]);
  const [formMaxItems, setFormMaxItems] = useState(8);

  // New filter form
  const [newFilterType, setNewFilterType] = useState<SectionFilter['type']>('boolean_field');
  const [newFilterField, setNewFilterField] = useState('is_featured');
  const [newFilterValue, setNewFilterValue] = useState('');

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
      
      const parsedSections = (data || []).map((s: any) => ({
        ...s,
        filters: Array.isArray(s.filters) ? s.filters : [],
      }));
      
      setSections(parsedSections);
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
    setFormFilters([]);
    setFormMaxItems(8);
    resetNewFilterForm();
    setDialogOpen(true);
  };

  const openEditDialog = (section: HomeSection) => {
    setEditingSection(section);
    setFormTitle(section.title);
    
    // Load existing filters
    if (section.filters && section.filters.length > 0) {
      setFormFilters([...section.filters]);
    } else if (section.filter_type && (section.filter_field || section.filter_value)) {
      // Convert legacy to new format
      setFormFilters([{
        type: section.filter_type as SectionFilter['type'],
        field: section.filter_field,
        value: section.filter_value || '',
      }]);
    } else {
      setFormFilters([]);
    }
    
    setFormMaxItems(section.max_items);
    resetNewFilterForm();
    setDialogOpen(true);
  };

  const resetNewFilterForm = () => {
    setNewFilterType('boolean_field');
    setNewFilterField('is_featured');
    setNewFilterValue('');
  };

  const handleAddFilter = () => {
    let filter: SectionFilter;

    if (newFilterType === 'boolean_field') {
      filter = { type: 'boolean_field', field: newFilterField, value: 'true' };
    } else {
      if (!newFilterValue.trim()) {
        toast.error('Selecione ou digite um valor para o filtro');
        return;
      }
      filter = { type: newFilterType, field: null, value: newFilterValue.trim() };
    }

    setFormFilters([...formFilters, filter]);
    resetNewFilterForm();
  };

  const handleRemoveFilter = (index: number) => {
    setFormFilters(formFilters.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (formFilters.length === 0) {
      toast.error('Adicione pelo menos um filtro');
      return;
    }

    // Build legacy fields from first filter for backward compatibility
    const firstFilter = formFilters[0];
    const legacyFilterType = firstFilter.type;
    const legacyFilterField = firstFilter.type === 'boolean_field' ? firstFilter.field : null;
    const legacyFilterValue = firstFilter.type !== 'boolean_field' ? firstFilter.value : null;

    // Cast filters to JSON-compatible format
    const filtersAsJson = formFilters.map(f => ({
      type: f.type,
      field: f.field,
      value: f.value,
    }));

    const sectionData = {
      tenant_id: effectiveTenantId,
      title: formTitle.trim(),
      filters: filtersAsJson,
      filter_type: legacyFilterType,
      filter_field: legacyFilterField,
      filter_value: legacyFilterValue,
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
          <p className="text-sm text-muted-foreground">Arraste para reordenar. Combine múltiplos filtros.</p>
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Editar Seção' : 'Nova Seção'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Casas de Luxo em Balneário"
              />
            </div>

            {/* Current Filters */}
            <div className="space-y-2">
              <Label>Filtros Ativos (combinados com AND)</Label>
              {formFilters.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Nenhum filtro adicionado</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formFilters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1.5 gap-2">
                      <span>{FILTER_TYPE_LABELS[filter.type]}: {getFilterLabel(filter)}</span>
                      <button onClick={() => handleRemoveFilter(index)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Filter */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label className="text-sm font-medium">Adicionar Filtro</Label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tipo de Filtro</Label>
                    <Select value={newFilterType} onValueChange={(v) => setNewFilterType(v as SectionFilter['type'])}>
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

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Valor</Label>
                    
                    {newFilterType === 'boolean_field' && (
                      <Select value={newFilterField} onValueChange={setNewFilterField}>
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
                    )}

                    {newFilterType === 'tag' && (
                      availableTags && availableTags.length > 0 ? (
                        <Select value={newFilterValue} onValueChange={setNewFilterValue}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTags.map((tag) => (
                              <SelectItem key={tag.id} value={tag.slug}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                  {tag.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-muted-foreground p-2 border rounded">
                          Nenhuma tag cadastrada
                        </div>
                      )
                    )}

                    {newFilterType === 'property_type' && (
                      <Select value={newFilterValue} onValueChange={setNewFilterValue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
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
                    )}

                    {newFilterType === 'city' && (
                      <Input
                        value={newFilterValue}
                        onChange={(e) => setNewFilterValue(e.target.value)}
                        placeholder="Ex: Balneário Camboriú"
                      />
                    )}

                    {newFilterType === 'purpose' && (
                      <Select value={newFilterValue} onValueChange={setNewFilterValue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="aluguel">Aluguel</SelectItem>
                          <SelectItem value="temporada">Temporada</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={handleAddFilter}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Filtro
                </Button>
              </CardContent>
            </Card>

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
