
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

const CreateProperty = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [currentFeature, setCurrentFeature] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    rental_price: '',
    location: '',
    city: '',
    state: '',
    property_type: '',
    purpose: 'sale',
    area: '',
    built_area: '',
    total_area: '',
    bedrooms: '',
    bathrooms: '',
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
    images: [] as string[],
    features: [] as string[],
    tags: [] as string[],
    is_featured: false,
    is_beachfront: false,
    is_near_beach: false,
    is_development: false,
    // Facilidades/Comodidades
    has_pool: false,
    has_gym: false,
    has_playground: false,
    has_barbecue: false,
    has_party_room: false,
    has_concierge: false,
    has_elevator: false,
    has_garden: false,
    has_balcony: false,
    has_furnished: false,
    has_air_conditioning: false,
    has_solar_energy: false,
  });

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addFeature = () => {
    if (currentFeature.trim() && !formData.features.includes(currentFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, currentFeature.trim()]
      });
      setCurrentFeature('');
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter(feature => feature !== featureToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'tag' | 'feature') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'tag') {
        addTag();
      } else {
        addFeature();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma propriedade",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Criar array de características baseado nos checkboxes
      const facilidades = [];
      if (formData.has_pool) facilidades.push('Piscina');
      if (formData.has_gym) facilidades.push('Academia');
      if (formData.has_playground) facilidades.push('Playground');
      if (formData.has_barbecue) facilidades.push('Churrasqueira');
      if (formData.has_party_room) facilidades.push('Salão de Festas');
      if (formData.has_concierge) facilidades.push('Portaria 24h');
      if (formData.has_elevator) facilidades.push('Elevador');
      if (formData.has_garden) facilidades.push('Jardim');
      if (formData.has_balcony) facilidades.push('Varanda');
      if (formData.has_furnished) facilidades.push('Mobiliado');
      if (formData.has_air_conditioning) facilidades.push('Ar Condicionado');
      if (formData.has_solar_energy) facilidades.push('Energia Solar');

      const allFeatures = [...formData.features, ...facilidades];

      const { error } = await supabase
        .from('properties')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          rental_price: formData.rental_price ? parseFloat(formData.rental_price) : null,
          location: formData.location,
          city: formData.city,
          state: formData.state,
          property_type: formData.property_type,
          purpose: formData.purpose,
          area: parseFloat(formData.area) || null,
          built_area: parseFloat(formData.built_area) || null,
          total_area: parseFloat(formData.total_area) || null,
          bedrooms: parseInt(formData.bedrooms) || null,
          bathrooms: parseInt(formData.bathrooms) || null,
          suites: parseInt(formData.suites) || null,
          condo_fee: parseFloat(formData.condo_fee) || null,
          iptu_fee: parseFloat(formData.iptu_fee) || null,
          reference_point: formData.reference_point || null,
          video_url: formData.video_url || null,
          virtual_tour_url: formData.virtual_tour_url || null,
          broker_name: formData.broker_name || null,
          broker_creci: formData.broker_creci || null,
          negotiation_notes: formData.negotiation_notes || null,
          images: formData.images,
          features: allFeatures,
          tags: formData.tags,
          is_featured: formData.is_featured,
          is_beachfront: formData.is_beachfront,
          is_near_beach: formData.is_near_beach,
          is_development: formData.is_development,
          user_id: user.id,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Propriedade criada com sucesso!",
      });

      navigate('/manage-properties');
    } catch (error: any) {
      console.error('Erro ao criar propriedade:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar propriedade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Cadastrar Nova Propriedade</h2>
          <p className="text-muted-foreground">Preencha as informações completas da propriedade</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Apartamento 3 dormitórios na praia"
                  />
                </div>
                <div>
                  <Label htmlFor="property_type">Tipo de Propriedade *</Label>
                  <Select
                    required
                    value={formData.property_type}
                    onValueChange={(value) => setFormData({...formData, property_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                      <SelectItem value="lote">Lote</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="loft">Loft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva a propriedade em detalhes..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Endereço Completo *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Ex: Florianópolis"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="Ex: SC"
                  />
                </div>
                <div>
                  <Label htmlFor="reference_point">Ponto de Referência</Label>
                  <Input
                    id="reference_point"
                    value={formData.reference_point}
                    onChange={(e) => setFormData({...formData, reference_point: e.target.value})}
                    placeholder="Ex: Próximo ao shopping"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores e Finalidade */}
          <Card>
            <CardHeader>
              <CardTitle>Valores e Finalidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="purpose">Finalidade *</Label>
                <Select
                  required
                  value={formData.purpose}
                  onValueChange={(value) => setFormData({...formData, purpose: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a finalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Venda</SelectItem>
                    <SelectItem value="rent">Aluguel</SelectItem>
                    <SelectItem value="both">Venda e Aluguel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.purpose === 'sale' || formData.purpose === 'both') && (
                  <div>
                    <Label htmlFor="price">Preço de Venda (R$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      required={formData.purpose === 'sale' || formData.purpose === 'both'}
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="Ex: 450000"
                    />
                  </div>
                )}
                
                {(formData.purpose === 'rent' || formData.purpose === 'both') && (
                  <div>
                    <Label htmlFor="rental_price">Preço do Aluguel (R$) *</Label>
                    <Input
                      id="rental_price"
                      type="number"
                      required={formData.purpose === 'rent' || formData.purpose === 'both'}
                      value={formData.rental_price}
                      onChange={(e) => setFormData({...formData, rental_price: e.target.value})}
                      placeholder="Ex: 2500"
                    />
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
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="Ex: 85"
                  />
                </div>
                <div>
                  <Label htmlFor="built_area">Área Construída (m²)</Label>
                  <Input
                    id="built_area"
                    type="number"
                    value={formData.built_area}
                    onChange={(e) => setFormData({...formData, built_area: e.target.value})}
                    placeholder="Ex: 120"
                  />
                </div>
                <div>
                  <Label htmlFor="total_area">Área Total (m²)</Label>
                  <Input
                    id="total_area"
                    type="number"
                    value={formData.total_area}
                    onChange={(e) => setFormData({...formData, total_area: e.target.value})}
                    placeholder="Ex: 150"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características do Imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Quartos</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                    placeholder="Ex: 3"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                    placeholder="Ex: 2"
                  />
                </div>
                <div>
                  <Label htmlFor="suites">Suítes</Label>
                  <Input
                    id="suites"
                    type="number"
                    value={formData.suites}
                    onChange={(e) => setFormData({...formData, suites: e.target.value})}
                    placeholder="Ex: 1"
                  />
                </div>
                <div>
                  <Label htmlFor="garage_spaces">Vagas Garagem</Label>
                  <Input
                    id="garage_spaces"
                    type="number"
                    value={formData.garage_spaces}
                    onChange={(e) => setFormData({...formData, garage_spaces: e.target.value})}
                    placeholder="Ex: 2"
                  />
                </div>
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
                  <Input
                    id="condo_fee"
                    type="number"
                    value={formData.condo_fee}
                    onChange={(e) => setFormData({...formData, condo_fee: e.target.value})}
                    placeholder="Ex: 350"
                  />
                </div>
                <div>
                  <Label htmlFor="iptu_fee">IPTU (R$/ano)</Label>
                  <Input
                    id="iptu_fee"
                    type="number"
                    value={formData.iptu_fee}
                    onChange={(e) => setFormData({...formData, iptu_fee: e.target.value})}
                    placeholder="Ex: 1200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facilidades e Comodidades */}
          <Card>
            <CardHeader>
              <CardTitle>Facilidades e Comodidades</CardTitle>
              <CardDescription>Marque as comodidades disponíveis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_pool"
                    checked={formData.has_pool}
                    onCheckedChange={(checked) => setFormData({...formData, has_pool: !!checked})}
                  />
                  <Label htmlFor="has_pool">Piscina</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_gym"
                    checked={formData.has_gym}
                    onCheckedChange={(checked) => setFormData({...formData, has_gym: !!checked})}
                  />
                  <Label htmlFor="has_gym">Academia</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_playground"
                    checked={formData.has_playground}
                    onCheckedChange={(checked) => setFormData({...formData, has_playground: !!checked})}
                  />
                  <Label htmlFor="has_playground">Playground</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_barbecue"
                    checked={formData.has_barbecue}
                    onCheckedChange={(checked) => setFormData({...formData, has_barbecue: !!checked})}
                  />
                  <Label htmlFor="has_barbecue">Churrasqueira</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_party_room"
                    checked={formData.has_party_room}
                    onCheckedChange={(checked) => setFormData({...formData, has_party_room: !!checked})}
                  />
                  <Label htmlFor="has_party_room">Salão de Festas</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_concierge"
                    checked={formData.has_concierge}
                    onCheckedChange={(checked) => setFormData({...formData, has_concierge: !!checked})}
                  />
                  <Label htmlFor="has_concierge">Portaria 24h</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_elevator"
                    checked={formData.has_elevator}
                    onCheckedChange={(checked) => setFormData({...formData, has_elevator: !!checked})}
                  />
                  <Label htmlFor="has_elevator">Elevador</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_garden"
                    checked={formData.has_garden}
                    onCheckedChange={(checked) => setFormData({...formData, has_garden: !!checked})}
                  />
                  <Label htmlFor="has_garden">Jardim</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_balcony"
                    checked={formData.has_balcony}
                    onCheckedChange={(checked) => setFormData({...formData, has_balcony: !!checked})}
                  />
                  <Label htmlFor="has_balcony">Varanda</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_furnished"
                    checked={formData.has_furnished}
                    onCheckedChange={(checked) => setFormData({...formData, has_furnished: !!checked})}
                  />
                  <Label htmlFor="has_furnished">Mobiliado</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_air_conditioning"
                    checked={formData.has_air_conditioning}
                    onCheckedChange={(checked) => setFormData({...formData, has_air_conditioning: !!checked})}
                  />
                  <Label htmlFor="has_air_conditioning">Ar Condicionado</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_solar_energy"
                    checked={formData.has_solar_energy}
                    onCheckedChange={(checked) => setFormData({...formData, has_solar_energy: !!checked})}
                  />
                  <Label htmlFor="has_solar_energy">Energia Solar</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle>Características Adicionais</CardTitle>
              <CardDescription>Adicione características específicas do imóvel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentFeature}
                  onChange={(e) => setCurrentFeature(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'feature')}
                  placeholder="Digite uma característica e pressione Enter"
                />
                <Button type="button" onClick={addFeature}>
                  Adicionar
                </Button>
              </div>
              
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {feature}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFeature(feature)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({...formData, is_featured: !!checked})}
                  />
                  <Label htmlFor="is_featured">Imóvel em Destaque</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_beachfront"
                    checked={formData.is_beachfront}
                    onCheckedChange={(checked) => setFormData({...formData, is_beachfront: !!checked})}
                  />
                  <Label htmlFor="is_beachfront">Frente Mar</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_near_beach"
                    checked={formData.is_near_beach}
                    onCheckedChange={(checked) => setFormData({...formData, is_near_beach: !!checked})}
                  />
                  <Label htmlFor="is_near_beach">Quadra Mar</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_development"
                    checked={formData.is_development}
                    onCheckedChange={(checked) => setFormData({...formData, is_development: !!checked})}
                  />
                  <Label htmlFor="is_development">Empreendimento</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Adicione tags para melhor categorização e busca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'tag')}
                  placeholder="Digite uma tag e pressione Enter"
                />
                <Button type="button" onClick={addTag}>
                  Adicionar
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
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
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <Label htmlFor="virtual_tour_url">URL do Tour Virtual</Label>
                  <Input
                    id="virtual_tour_url"
                    value={formData.virtual_tour_url}
                    onChange={(e) => setFormData({...formData, virtual_tour_url: e.target.value})}
                    placeholder="https://matterport.com/..."
                  />
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
                  <Input
                    id="broker_name"
                    value={formData.broker_name}
                    onChange={(e) => setFormData({...formData, broker_name: e.target.value})}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="broker_creci">CRECI</Label>
                  <Input
                    id="broker_creci"
                    value={formData.broker_creci}
                    onChange={(e) => setFormData({...formData, broker_creci: e.target.value})}
                    placeholder="Ex: CRECI 12345-J"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="negotiation_notes">Observações de Negociação</Label>
                <Textarea
                  id="negotiation_notes"
                  value={formData.negotiation_notes}
                  onChange={(e) => setFormData({...formData, negotiation_notes: e.target.value})}
                  placeholder="Informações importantes sobre negociação, documentação, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Imagens */}
          <Card>
            <CardHeader>
              <CardTitle>Imagens da Propriedade</CardTitle>
              <CardDescription>Adicione fotos do imóvel (máximo 20 imagens)</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={formData.images}
                onChange={(images) => setFormData({...formData, images})}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/manage-properties')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Propriedade'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateProperty;
