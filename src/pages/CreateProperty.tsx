
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Building2, Home, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import DashboardLayout from '@/components/DashboardLayout';
import ImageUpload from '@/components/ImageUpload';
import PropertyTagSelector from '@/components/PropertyTagSelector';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { useTenantContext } from '@/contexts/TenantContext';

const CreateProperty = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [currentUnitFeature, setCurrentUnitFeature] = useState('');
  const [currentBuildingFeature, setCurrentBuildingFeature] = useState('');
  
  const dashboardRole = profile?.role === 'master' ? 'admin' : (profile?.role || 'user');

  const { currentTenant, selectedTenantId } = useTenantContext();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    rental_price: '',
    location: '',
    neighborhood: '',
    city: '',
    state: '',
    property_type: '',
    purpose: 'sale',
    area: '',
    built_area: '',
    total_area: '',
    bedrooms: '',
    bathrooms: '',
    lavabos: '',
    suites: '',
    garage_spaces: '',
    condo_fee: '',
    iptu_fee: '',
    reference_point: '',
    video_url: '',
    virtual_tour_url: '',
    broker_name: '',
    broker_creci: '',
    negotiation_notes: '',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    owner_notes: '',
    // Dados do Empreendimento
    development_name: '',
    development_description: '',
    apartment_number: '',
    show_apartment_details: false,
    images: [] as string[],
    features: [] as string[],
    tags: [] as string[],
    is_featured: false,
    is_beachfront: false,
    is_near_beach: false,
    is_development: false,
    is_pre_launch: false,
    accepts_exchange: false,
    hide_address: false,
    // Características do Imóvel (unidade)
    has_sacada: false,
    has_sacada_churrasqueira: false,
    has_sacada_integrada: false,
    has_lavabo: false,
    has_area_servico: false,
    has_varanda: false,
    has_furnished: false,
    has_air_conditioning: false,
    has_solar_energy: false,
    // Custom unit features
    customUnitFeatures: [] as string[],
    // Características do Empreendimento
    has_pool: false,
    has_gym: false,
    has_playground: false,
    has_barbecue: false,
    has_party_room: false,
    has_concierge: false,
    has_elevator: false,
    has_garden: false,
    // Custom building features
    customBuildingFeatures: [] as string[],
  });

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const addUnitFeature = () => {
    if (currentUnitFeature.trim() && !formData.customUnitFeatures.includes(currentUnitFeature.trim())) {
      setFormData({ ...formData, customUnitFeatures: [...formData.customUnitFeatures, currentUnitFeature.trim()] });
      setCurrentUnitFeature('');
    }
  };

  const removeUnitFeature = (f: string) => {
    setFormData({ ...formData, customUnitFeatures: formData.customUnitFeatures.filter(x => x !== f) });
  };

  const addBuildingFeature = () => {
    if (currentBuildingFeature.trim() && !formData.customBuildingFeatures.includes(currentBuildingFeature.trim())) {
      setFormData({ ...formData, customBuildingFeatures: [...formData.customBuildingFeatures, currentBuildingFeature.trim()] });
      setCurrentBuildingFeature('');
    }
  };

  const removeBuildingFeature = (f: string) => {
    setFormData({ ...formData, customBuildingFeatures: formData.customBuildingFeatures.filter(x => x !== f) });
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleSubmit = async (status: 'draft' | 'active') => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para criar uma propriedade", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Build unit features array
      const unitFeatures: string[] = [];
      if (formData.has_sacada) unitFeatures.push('Sacada');
      if (formData.has_sacada_churrasqueira) unitFeatures.push('Sacada com Churrasqueira');
      if (formData.has_sacada_integrada) unitFeatures.push('Sacada Integrada');
      if (formData.has_lavabo) unitFeatures.push('Lavabo');
      if (formData.has_area_servico) unitFeatures.push('Área de Serviço');
      if (formData.has_varanda) unitFeatures.push('Varanda');
      if (formData.has_furnished) unitFeatures.push('Mobiliado');
      if (formData.has_air_conditioning) unitFeatures.push('Ar Condicionado');
      if (formData.has_solar_energy) unitFeatures.push('Energia Solar');
      const allUnitFeatures = [...unitFeatures, ...formData.customUnitFeatures];

      // Build building features array
      const buildingFeatures: string[] = [];
      if (formData.has_pool) buildingFeatures.push('Piscina');
      if (formData.has_gym) buildingFeatures.push('Academia');
      if (formData.has_playground) buildingFeatures.push('Playground');
      if (formData.has_barbecue) buildingFeatures.push('Churrasqueira');
      if (formData.has_party_room) buildingFeatures.push('Salão de Festas');
      if (formData.has_concierge) buildingFeatures.push('Portaria 24h');
      if (formData.has_elevator) buildingFeatures.push('Elevador');
      if (formData.has_garden) buildingFeatures.push('Jardim');
      const allBuildingFeatures = [...buildingFeatures, ...formData.customBuildingFeatures];

      // Combined for backward compatibility
      const allFeatures = [...allUnitFeatures, ...allBuildingFeatures];

      const { error } = await supabase
        .from('properties')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          rental_price: formData.rental_price ? parseFloat(formData.rental_price) : null,
          location: formData.location,
          neighborhood: formData.neighborhood || null,
          city: formData.city,
          state: formData.state,
          property_type: formData.property_type,
          purpose: formData.purpose,
          area: parseFloat(formData.area) || null,
          built_area: parseFloat(formData.built_area) || null,
          total_area: parseFloat(formData.total_area) || null,
          bedrooms: parseInt(formData.bedrooms) || null,
          bathrooms: parseInt(formData.bathrooms) || null,
          lavabos: parseInt(formData.lavabos) || null,
          suites: parseInt(formData.suites) || null,
          garage_spaces: parseInt(formData.garage_spaces) || null,
          condo_fee: parseFloat(formData.condo_fee) || null,
          iptu_fee: parseFloat(formData.iptu_fee) || null,
          reference_point: formData.reference_point || null,
          video_url: formData.video_url || null,
          virtual_tour_url: formData.virtual_tour_url || null,
          broker_name: formData.broker_name || null,
          broker_creci: formData.broker_creci || null,
          negotiation_notes: formData.negotiation_notes || null,
          owner_name: formData.owner_name || null,
          owner_phone: formData.owner_phone || null,
          owner_email: formData.owner_email || null,
          owner_notes: formData.owner_notes || null,
          development_name: formData.development_name || null,
          development_description: formData.development_description || null,
          apartment_number: formData.apartment_number || null,
          show_apartment_details: formData.show_apartment_details,
          images: formData.images,
          features: allFeatures,
          unit_features: allUnitFeatures,
          building_features: allBuildingFeatures,
          tags: formData.tags,
          is_featured: formData.is_featured,
          is_beachfront: formData.is_beachfront,
          is_near_beach: formData.is_near_beach,
          is_development: formData.is_development,
          is_pre_launch: formData.is_pre_launch,
          accepts_exchange: formData.accepts_exchange,
          hide_address: formData.hide_address,
          user_id: user.id,
          status: status,
        } as any);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: status === 'draft' ? "Imóvel salvo como rascunho!" : "Imóvel publicado com sucesso!",
      });
      navigate('/manage-properties');
    } catch (error: any) {
      console.error('Erro ao criar propriedade:', error);
      toast({ title: "Erro", description: "Erro ao criar propriedade", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Cadastrar Imóvel" userRole={dashboardRole}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Cadastrar Nova Propriedade</h2>
          <p className="text-muted-foreground">Preencha as informações completas da propriedade</p>
        </div>

        <form className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais da propriedade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ex: Apartamento 3 dormitórios na praia" />
                </div>
                <div>
                  <Label htmlFor="property_type">Tipo de Propriedade *</Label>
                  <Select required value={formData.property_type} onValueChange={(value) => setFormData({...formData, property_type: value})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="apartamento_diferenciado">Apartamento Diferenciado</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                      <SelectItem value="construcao">Construção/Planta</SelectItem>
                      <SelectItem value="loft">Loft</SelectItem>
                      <SelectItem value="lote">Lote</SelectItem>
                      <SelectItem value="sala_comercial">Sala Comercial</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="sobrado">Sobrado</SelectItem>
                      <SelectItem value="galpao">Galpão</SelectItem>
                      <SelectItem value="fazenda">Fazenda</SelectItem>
                      <SelectItem value="sitio">Sítio</SelectItem>
                      <SelectItem value="chacara">Chácara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição do Imóvel</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Descreva a propriedade em detalhes..." rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Endereço (Rua, Número) *</Label>
                <Input id="location" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Ex: Rua das Flores, 123" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <LocationAutocomplete type="neighborhood" value={formData.neighborhood} onChange={(value) => setFormData({...formData, neighborhood: value})} placeholder="Digite ou selecione o bairro" tenantId={effectiveTenantId} cityFilter={formData.city} />
                </div>
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <LocationAutocomplete type="city" value={formData.city} onChange={(value) => setFormData({...formData, city: value})} placeholder="Digite ou selecione a cidade" tenantId={effectiveTenantId} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} placeholder="Ex: SC" />
                </div>
                <div>
                  <Label htmlFor="reference_point">Ponto de Referência</Label>
                  <Input id="reference_point" value={formData.reference_point} onChange={(e) => setFormData({...formData, reference_point: e.target.value})} placeholder="Ex: Próximo ao shopping" />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="hide_address" checked={formData.hide_address} onCheckedChange={(checked) => setFormData({...formData, hide_address: !!checked})} />
                <Label htmlFor="hide_address" className="text-sm font-normal cursor-pointer">Ocultar endereço completo (mostrar apenas cidade/bairro para visitantes)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Valores e Finalidade */}
          <Card>
            <CardHeader><CardTitle>Valores e Finalidade</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="purpose">Finalidade *</Label>
                <Select required value={formData.purpose} onValueChange={(value) => setFormData({...formData, purpose: value})}>
                  <SelectTrigger><SelectValue placeholder="Selecione a finalidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Venda</SelectItem>
                    <SelectItem value="rent">Aluguel</SelectItem>
                    <SelectItem value="rent_annual">Aluguel Anual</SelectItem>
                    <SelectItem value="rent_seasonal">Aluguel Temporada</SelectItem>
                    <SelectItem value="both">Venda e Aluguel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['sale', 'both'].includes(formData.purpose)) && (
                  <div>
                    <Label htmlFor="price">Preço de Venda (R$) *</Label>
                    <Input id="price" type="number" required={['sale', 'both'].includes(formData.purpose)} value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Ex: 450000" />
                  </div>
                )}
                {(['rent', 'rent_annual', 'rent_seasonal', 'both'].includes(formData.purpose)) && (
                  <div>
                    <Label htmlFor="rental_price">Preço do Aluguel (R$) *</Label>
                    <Input id="rental_price" type="number" required={['rent', 'rent_annual', 'rent_seasonal', 'both'].includes(formData.purpose)} value={formData.rental_price} onChange={(e) => setFormData({...formData, rental_price: e.target.value})} placeholder="Ex: 2500" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Áreas e Medidas */}
          <Card>
            <CardHeader>
              <CardTitle>Áreas e Medidas</CardTitle>
              <CardDescription>Informações sobre as dimensões do imóvel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="area">Área Privativa (m²)</Label>
                  <Input id="area" type="number" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} placeholder="Ex: 85" />
                </div>
                <div>
                  <Label htmlFor="built_area">Área Construída (m²)</Label>
                  <Input id="built_area" type="number" value={formData.built_area} onChange={(e) => setFormData({...formData, built_area: e.target.value})} placeholder="Ex: 120" />
                </div>
                <div>
                  <Label htmlFor="total_area">Área Total (m²)</Label>
                  <Input id="total_area" type="number" value={formData.total_area} onChange={(e) => setFormData({...formData, total_area: e.target.value})} placeholder="Ex: 150" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características do Imóvel (Unidade) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Home className="w-5 h-5" /> Características do Imóvel</CardTitle>
              <CardDescription>Detalhes específicos da unidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Quartos</Label>
                  <Input id="bedrooms" type="number" value={formData.bedrooms} onChange={(e) => setFormData({...formData, bedrooms: e.target.value})} placeholder="Ex: 3" />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input id="bathrooms" type="number" value={formData.bathrooms} onChange={(e) => setFormData({...formData, bathrooms: e.target.value})} placeholder="Ex: 2" />
                </div>
                <div>
                  <Label htmlFor="lavabos">Lavabos</Label>
                  <Input id="lavabos" type="number" value={formData.lavabos} onChange={(e) => setFormData({...formData, lavabos: e.target.value})} placeholder="Ex: 1" />
                </div>
                <div>
                  <Label htmlFor="suites">Suítes</Label>
                  <Input id="suites" type="number" value={formData.suites} onChange={(e) => setFormData({...formData, suites: e.target.value})} placeholder="Ex: 1" />
                </div>
                <div>
                  <Label htmlFor="garage_spaces">Vagas Garagem</Label>
                  <Input id="garage_spaces" type="number" value={formData.garage_spaces} onChange={(e) => setFormData({...formData, garage_spaces: e.target.value})} placeholder="Ex: 2" />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Comodidades da Unidade</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'has_sacada', label: 'Sacada' },
                    { key: 'has_sacada_churrasqueira', label: 'Sacada com Churrasqueira' },
                    { key: 'has_sacada_integrada', label: 'Sacada Integrada' },
                    { key: 'has_lavabo', label: 'Lavabo' },
                    { key: 'has_area_servico', label: 'Área de Serviço' },
                    { key: 'has_varanda', label: 'Varanda' },
                    { key: 'has_furnished', label: 'Mobiliado' },
                    { key: 'has_air_conditioning', label: 'Ar Condicionado' },
                    { key: 'has_solar_energy', label: 'Energia Solar' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox id={item.key} checked={(formData as any)[item.key]} onCheckedChange={(checked) => setFormData({...formData, [item.key]: !!checked})} />
                      <Label htmlFor={item.key} className="text-sm">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Características personalizadas do imóvel</p>
                <div className="flex gap-2">
                  <Input value={currentUnitFeature} onChange={(e) => setCurrentUnitFeature(e.target.value)} onKeyDown={(e) => handleKeyPress(e, addUnitFeature)} placeholder="Ex: Closet, Despensa..." />
                  <Button type="button" onClick={addUnitFeature} variant="secondary">Adicionar</Button>
                </div>
                {formData.customUnitFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.customUnitFeatures.map((f, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-1">{f}<X className="h-3 w-3 cursor-pointer" onClick={() => removeUnitFeature(f)} /></Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Características do Empreendimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Características do Empreendimento</CardTitle>
              <CardDescription>Infraestrutura e comodidades do condomínio/empreendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'has_pool', label: 'Piscina' },
                  { key: 'has_gym', label: 'Academia' },
                  { key: 'has_playground', label: 'Playground' },
                  { key: 'has_barbecue', label: 'Churrasqueira' },
                  { key: 'has_party_room', label: 'Salão de Festas' },
                  { key: 'has_concierge', label: 'Portaria 24h' },
                  { key: 'has_elevator', label: 'Elevador' },
                  { key: 'has_garden', label: 'Jardim' },
                ].map(item => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox id={item.key} checked={(formData as any)[item.key]} onCheckedChange={(checked) => setFormData({...formData, [item.key]: !!checked})} />
                    <Label htmlFor={item.key} className="text-sm">{item.label}</Label>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Características personalizadas do empreendimento</p>
                <div className="flex gap-2">
                  <Input value={currentBuildingFeature} onChange={(e) => setCurrentBuildingFeature(e.target.value)} onKeyDown={(e) => handleKeyPress(e, addBuildingFeature)} placeholder="Ex: Bicicletário, Coworking..." />
                  <Button type="button" onClick={addBuildingFeature} variant="secondary">Adicionar</Button>
                </div>
                {formData.customBuildingFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.customBuildingFeatures.map((f, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-1">{f}<X className="h-3 w-3 cursor-pointer" onClick={() => removeBuildingFeature(f)} /></Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados do Empreendimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Dados do Empreendimento</CardTitle>
              <CardDescription>Informações sobre o empreendimento (para apartamentos e coberturas)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="development_name">Nome do Empreendimento</Label>
                  <Input id="development_name" value={formData.development_name} onChange={(e) => setFormData({...formData, development_name: e.target.value})} placeholder="Ex: Residencial Vista Mar" />
                </div>
                <div>
                  <Label htmlFor="apartment_number">Número do Apartamento</Label>
                  <Input id="apartment_number" value={formData.apartment_number} onChange={(e) => setFormData({...formData, apartment_number: e.target.value})} placeholder="Ex: 1201" />
                </div>
              </div>
              <div>
                <Label htmlFor="development_description">Descrição do Empreendimento</Label>
                <Textarea id="development_description" value={formData.development_description} onChange={(e) => setFormData({...formData, development_description: e.target.value})} placeholder="Descreva o empreendimento, diferenciais, construtora, etc." rows={3} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  {formData.show_apartment_details ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">Exibir nome e nº do apartamento publicamente</p>
                    <p className="text-xs text-muted-foreground">Por padrão, essas informações ficam ocultas para visitantes</p>
                  </div>
                </div>
                <Switch checked={formData.show_apartment_details} onCheckedChange={(checked) => setFormData({...formData, show_apartment_details: checked})} />
              </div>
            </CardContent>
          </Card>

          {/* Detalhes Financeiros */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes Financeiros</CardTitle>
              <CardDescription>Taxas e custos adicionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condo_fee">Taxa de Condomínio (R$/mês)</Label>
                  <Input id="condo_fee" type="number" value={formData.condo_fee} onChange={(e) => setFormData({...formData, condo_fee: e.target.value})} placeholder="Ex: 350" />
                </div>
                <div>
                  <Label htmlFor="iptu_fee">IPTU (R$/ano)</Label>
                  <Input id="iptu_fee" type="number" value={formData.iptu_fee} onChange={(e) => setFormData({...formData, iptu_fee: e.target.value})} placeholder="Ex: 1200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorias Especiais */}
          <Card>
            <CardHeader>
              <CardTitle>Categorias Especiais</CardTitle>
              <CardDescription>Marque as categorias que se aplicam</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'is_featured', label: '⭐ Imóvel em Destaque' },
                  { key: 'is_beachfront', label: '🏖️ Frente Mar' },
                  { key: 'is_near_beach', label: '🌊 Quadra Mar' },
                  { key: 'is_development', label: '🏗️ Empreendimento' },
                  { key: 'is_pre_launch', label: '🚀 Pré-lançamento' },
                  { key: 'accepts_exchange', label: '🔄 Aceita Permuta' },
                ].map(item => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox id={item.key} checked={(formData as any)[item.key]} onCheckedChange={(checked) => setFormData({...formData, [item.key]: !!checked})} />
                    <Label htmlFor={item.key}>{item.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Selecione as tags que se aplicam a este imóvel</CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyTagSelector selectedTags={formData.tags} onTagsChange={(tags) => setFormData({ ...formData, tags })} />
            </CardContent>
          </Card>

          {/* Mídia e Tours */}
          <Card>
            <CardHeader>
              <CardTitle>Mídia e Tours Virtuais</CardTitle>
              <CardDescription>Adicione vídeos e tours virtuais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="video_url">URL do Vídeo</Label>
                  <Input id="video_url" value={formData.video_url} onChange={(e) => setFormData({...formData, video_url: e.target.value})} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div>
                  <Label htmlFor="virtual_tour_url">URL do Tour Virtual</Label>
                  <Input id="virtual_tour_url" value={formData.virtual_tour_url} onChange={(e) => setFormData({...formData, virtual_tour_url: e.target.value})} placeholder="https://matterport.com/..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Corretor */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Corretor</CardTitle>
              <CardDescription>Dados do corretor responsável</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="broker_name">Nome do Corretor</Label>
                  <Input id="broker_name" value={formData.broker_name} onChange={(e) => setFormData({...formData, broker_name: e.target.value})} placeholder="Nome completo" />
                </div>
                <div>
                  <Label htmlFor="broker_creci">CRECI</Label>
                  <Input id="broker_creci" value={formData.broker_creci} onChange={(e) => setFormData({...formData, broker_creci: e.target.value})} placeholder="Ex: CRECI 12345-J" />
                </div>
              </div>
              <div>
                <Label htmlFor="negotiation_notes">Observações de Negociação</Label>
                <Textarea id="negotiation_notes" value={formData.negotiation_notes} onChange={(e) => setFormData({...formData, negotiation_notes: e.target.value})} placeholder="Informações importantes sobre negociação, documentação, etc." rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Proprietário */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Proprietário</CardTitle>
              <CardDescription>Informações confidenciais do proprietário (visível apenas para corretores e administradores)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner_name">Nome do Proprietário</Label>
                  <Input id="owner_name" value={formData.owner_name} onChange={(e) => setFormData({...formData, owner_name: e.target.value})} placeholder="Nome completo do proprietário" />
                </div>
                <div>
                  <Label htmlFor="owner_phone">Telefone do Proprietário</Label>
                  <Input id="owner_phone" value={formData.owner_phone} onChange={(e) => setFormData({...formData, owner_phone: e.target.value})} placeholder="(47) 99999-9999" />
                </div>
              </div>
              <div>
                <Label htmlFor="owner_email">Email do Proprietário</Label>
                <Input id="owner_email" type="email" value={formData.owner_email} onChange={(e) => setFormData({...formData, owner_email: e.target.value})} placeholder="proprietario@email.com" />
              </div>
              <div>
                <Label htmlFor="owner_notes">Observações sobre o Proprietário</Label>
                <Textarea id="owner_notes" value={formData.owner_notes} onChange={(e) => setFormData({...formData, owner_notes: e.target.value})} placeholder="Informações relevantes sobre o proprietário, disponibilidade, etc." rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Imagens */}
          <Card>
            <CardHeader>
              <CardTitle>Imagens da Propriedade</CardTitle>
              <CardDescription>Adicione fotos do imóvel (máximo 20 imagens). A marca d'água da logo será aplicada automaticamente.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload images={formData.images} onChange={(images) => setFormData({...formData, images})} tenantId={effectiveTenantId} />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/manage-properties')}>Cancelar</Button>
            <Button type="button" variant="secondary" disabled={loading} onClick={() => handleSubmit('draft')}>{loading ? 'Salvando...' : 'Salvar Rascunho'}</Button>
            <Button type="button" disabled={loading} onClick={() => handleSubmit('active')}>{loading ? 'Publicando...' : 'Publicar'}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateProperty;
