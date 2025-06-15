import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

const INFRA_OPTIONS = [
  "Varanda", "Área Gourmet", "Churrasqueira", "Piscina", "Armários Embutidos",
  "Ar-condicionado", "Portaria 24h", "Elevador", "Playground", "Salão de Festas",
  "Pet friendly", "Acessibilidade", "Lavanderia", "Vagas de Garagem"
];

const CreateProperty = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    city: '',
    state: '',
    property_type: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    features: '',
    images: [] as string[],
    is_featured: false,
    purpose: '',
    reference_point: '',
    latitude: '',
    longitude: '',
    total_area: '',
    built_area: '',
    suites: '',
    condo_fee: '',
    iptu_fee: '',
    rental_price: '',
    negotiation_notes: '',
    broker_name: '',
    broker_creci: '',
    infra: [] as string[],
    status: 'available',
    virtual_tour_url: '',
    video_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma propriedade.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const featuresArray = formData.features
        ? formData.features.split(',').map(f => f.trim()).filter(f => f.length > 0)
        : [];

      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            price: parseFloat(formData.price),
            location: formData.location,
            city: formData.city,
            state: formData.state,
            property_type: formData.property_type,
            area: formData.area ? parseFloat(formData.area) : null,
            bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
            bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
            features: featuresArray,
            images: formData.images,
            user_id: user.id,
            status: formData.status,
            is_featured: formData.is_featured,
            purpose: formData.purpose,
            reference_point: formData.reference_point,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            total_area: formData.total_area ? parseFloat(formData.total_area) : null,
            built_area: formData.built_area ? parseFloat(formData.built_area) : null,
            suites: formData.suites ? parseInt(formData.suites) : null,
            condo_fee: formData.condo_fee ? parseFloat(formData.condo_fee) : null,
            iptu_fee: formData.iptu_fee ? parseFloat(formData.iptu_fee) : null,
            rental_price: formData.rental_price ? parseFloat(formData.rental_price) : null,
            negotiation_notes: formData.negotiation_notes,
            broker_name: formData.broker_name,
            broker_creci: formData.broker_creci,
            infra: formData.infra,
            virtual_tour_url: formData.virtual_tour_url,
            video_url: formData.video_url
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Propriedade criada com sucesso!",
      });

      navigate('/manage-properties');
    } catch (error: any) {
      console.error('Erro ao criar propriedade:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar propriedade: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
  };

  const handleInfraChange = (infra: string) => {
    setFormData((prev) => {
      const exists = prev.infra.includes(infra);
      return {
        ...prev,
        infra: exists ? prev.infra.filter(i => i !== infra) : [...prev.infra, infra]
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Cadastrar Novo Imóvel
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Preencha as informações do imóvel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ex: Casa com 3 Quartos no Bairro São José"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="property_type">Tipo de Imóvel *</Label>
                  <Select value={formData.property_type} onValueChange={(value) => handleChange('property_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="loft">Loft</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="sala">Sala Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="purpose">Finalidade *</Label>
                  <Select value={formData.purpose} onValueChange={value => handleChange('purpose', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ex: Venda, Aluguel, Temporada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                      <SelectItem value="temporada">Temporada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="unavailable">Indisponível</SelectItem>
                      <SelectItem value="sold">Vendido</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="is_featured">Destaque?</Label>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        is_featured: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span>Marcar como imóvel em destaque na Home</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Preço de Venda (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="850000"
                  />
                </div>

                <div>
                  <Label htmlFor="rental_price">Valor do Aluguel (R$)</Label>
                  <Input
                    id="rental_price"
                    type="number"
                    value={formData.rental_price}
                    onChange={(e) => handleChange('rental_price', e.target.value)}
                    placeholder="2500"
                  />
                </div>

                <div>
                  <Label htmlFor="condo_fee">Valor do Condomínio (R$)</Label>
                  <Input
                    id="condo_fee"
                    type="number"
                    value={formData.condo_fee}
                    onChange={(e) => handleChange('condo_fee', e.target.value)}
                    placeholder="350"
                  />
                </div>

                <div>
                  <Label htmlFor="iptu_fee">Valor do IPTU (R$)</Label>
                  <Input
                    id="iptu_fee"
                    type="number"
                    value={formData.iptu_fee}
                    onChange={(e) => handleChange('iptu_fee', e.target.value)}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="negotiation_notes">Observações de Negociação</Label>
                  <Textarea
                    id="negotiation_notes"
                    value={formData.negotiation_notes}
                    onChange={e => handleChange('negotiation_notes', e.target.value)}
                    placeholder="Aceita financiamento, permuta etc."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="broker_name">Corretor Responsável</Label>
                  <Input
                    id="broker_name"
                    value={formData.broker_name}
                    onChange={e => handleChange('broker_name', e.target.value)}
                    placeholder="Nome do corretor"
                  />
                </div>
                <div>
                  <Label htmlFor="broker_creci">CRECI</Label>
                  <Input
                    id="broker_creci"
                    value={formData.broker_creci}
                    onChange={e => handleChange('broker_creci', e.target.value)}
                    placeholder="12345-F"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva o imóvel..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Endereço Completo *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Rua das Flores, 123 - Centro"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reference_point">Ponto de Referência</Label>
                <Input
                  id="reference_point"
                  value={formData.reference_point}
                  onChange={e => handleChange('reference_point', e.target.value)}
                  placeholder="Próx. à escola, shopping, etc."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={e => handleChange('latitude', e.target.value)}
                    placeholder="-27.123456"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={e => handleChange('longitude', e.target.value)}
                    placeholder="-48.654321"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Características e Infraestrutura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="area">Área Privativa (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    placeholder="180"
                  />
                </div>
                <div>
                  <Label htmlFor="total_area">Área Total (m²)</Label>
                  <Input
                    id="total_area"
                    type="number"
                    value={formData.total_area}
                    onChange={e => handleChange('total_area', e.target.value)}
                    placeholder="250"
                  />
                </div>
                <div>
                  <Label htmlFor="built_area">Área Construída (m²)</Label>
                  <Input
                    id="built_area"
                    type="number"
                    value={formData.built_area}
                    onChange={e => handleChange('built_area', e.target.value)}
                    placeholder="180"
                  />
                </div>
                <div>
                  <Label htmlFor="bedrooms">Quartos</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="suites">Suítes</Label>
                  <Input
                    id="suites"
                    type="number"
                    value={formData.suites}
                    onChange={e => handleChange('suites', e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="features">Características (separadas por vírgula)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => handleChange('features', e.target.value)}
                    placeholder="Piscina, Garagem, Jardim, Churrasqueira"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label>Infraestrutura</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {INFRA_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center mr-4 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.infra.includes(opt)}
                        onChange={() => handleInfraChange(opt)}
                        className="mr-1"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload 
                images={formData.images}
                onChange={handleImagesChange}
              />
            </CardContent>
          </Card>

          {/* Campos extra: Tour Virtual e Vídeo */}
          <Card>
            <CardHeader>
              <CardTitle>Mídia Avançada (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="virtual_tour_url">Link do Tour Virtual</Label>
                <Input
                  id="virtual_tour_url"
                  value={formData.virtual_tour_url || ""}
                  onChange={e => handleChange('virtual_tour_url', e.target.value)}
                  placeholder="https://meu-tour.app/tour/12345"
                />
              </div>
              <div>
                <Label htmlFor="video_url">Link do Vídeo</Label>
                <Input
                  id="video_url"
                  value={formData.video_url || ""}
                  onChange={e => handleChange('video_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/manage-properties')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Propriedade'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateProperty;
