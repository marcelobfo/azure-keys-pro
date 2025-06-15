import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EditProperty = () => {
  const { id } = useParams();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

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
    features: [] as string[],
    images: [] as string[],
    is_featured: false, // Novo campo
    virtual_tour_url: '',
    video_url: '',
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
      try {
        if (!id) throw new Error("ID inválido.");
        // Busca o imóvel pelo id no Supabase
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error || !data) throw new Error("Imóvel não encontrado.");

        setFormData({
          title: data.title ?? '',
          description: data.description ?? '',
          price: data.price ? String(data.price) : '',
          location: data.location ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          property_type: data.property_type ?? '',
          area: data.area ? String(data.area) : '',
          bedrooms: data.bedrooms ? String(data.bedrooms) : '',
          bathrooms: data.bathrooms ? String(data.bathrooms) : '',
          features: Array.isArray(data.features) ? data.features : [],
          images: Array.isArray(data.images) ? data.images : [],
          is_featured: Boolean(data.is_featured),
          virtual_tour_url: data.virtual_tour_url ?? '',
          video_url: data.video_url ?? '',
        });
      } catch (error) {
        toast({
          title: "Erro ao carregar imóvel",
          description: "Não foi possível carregar os dados do imóvel.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
    // eslint-disable-next-line
  }, [id]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!id) throw new Error("ID inválido.");
      // Atualiza o imóvel no Supabase
      const { error } = await supabase
        .from('properties')
        .update({
          title: formData.title,
          description: formData.description,
          price: Number(formData.price) || 0,
          location: formData.location,
          city: formData.city,
          state: formData.state,
          property_type: formData.property_type,
          area: formData.area !== '' ? Number(formData.area) : null,
          bedrooms: formData.bedrooms !== '' ? Number(formData.bedrooms) : null,
          bathrooms: formData.bathrooms !== '' ? Number(formData.bathrooms) : null,
          features: formData.features,
          images: formData.images,
          is_featured: formData.is_featured, // Novo campo
          virtual_tour_url: formData.virtual_tour_url,
          video_url: formData.video_url,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Imóvel atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      navigate('/manage-properties');
    } catch (error) {
      toast({
        title: "Erro ao atualizar imóvel",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    const dashboardRole = profile?.role === 'super_admin' ? 'admin' : (profile?.role || 'user');
    return (
      <DashboardLayout title="Editar Imóvel" userRole={dashboardRole}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg">Carregando imóvel...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const dashboardRole = profile?.role === 'super_admin' ? 'admin' : (profile?.role || 'user');

  return (
    <DashboardLayout title="Editar Imóvel" userRole={dashboardRole}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/manage-properties')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Editar Imóvel</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Casa Moderna no Centro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Tipo *</Label>
                  <Select value={formData.property_type} onValueChange={(value) => handleInputChange('property_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casa">Casa</SelectItem>
                      <SelectItem value="Apartamento">Apartamento</SelectItem>
                      <SelectItem value="Terreno">Terreno</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva as principais características do imóvel..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="500000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Quartos</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Endereço Completo *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Rua das Flores, 123 - Centro"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Características</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Ex: Piscina, Garagem, etc."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="px-3 py-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(feature)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Imagens</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Clique para adicionar mais imagens</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>Adicionar Imagens</span>
                    </Button>
                  </Label>
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NOVOS CAMPOS */}
              <div className="space-y-2">
                <Label htmlFor="virtual_tour_url">Link do Tour Virtual</Label>
                <Input
                  id="virtual_tour_url"
                  value={formData.virtual_tour_url || ""}
                  onChange={e => handleInputChange('virtual_tour_url', e.target.value)}
                  placeholder="https://meu-tour.app/tour/12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_url">Link do Vídeo</Label>
                <Input
                  id="video_url"
                  value={formData.video_url || ""}
                  onChange={e => handleInputChange('video_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {/* FIM NOVOS CAMPOS */}

              {/* Campo de destaque */}
              <div>
                <Label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={e => handleInputChange('is_featured', e.target.checked)}
                    className="mr-2"
                  />
                  <span>Exibir imóvel como destaque na home</span>
                </Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/manage-properties')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EditProperty;
