
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
    images: [] as string[]
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    // Simulate loading property data
    const loadProperty = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in real app, fetch from API
        setFormData({
          title: 'Casa Moderna no Centro',
          description: 'Linda casa com acabamento de primeira qualidade',
          price: '850000',
          location: 'Rua das Flores, 123 - Centro',
          city: 'São Paulo',
          state: 'SP',
          property_type: 'Casa',
          area: '180',
          bedrooms: '3',
          bathrooms: '2',
          features: ['Piscina', 'Garagem', 'Jardim'],
          images: ['https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop']
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
    };

    loadProperty();
  }, [id, toast]);

  const handleInputChange = (field: string, value: string) => {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
    return (
      <DashboardLayout title="Editar Imóvel" userRole={profile?.role || 'user'}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg">Carregando imóvel...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Editar Imóvel" userRole={profile?.role || 'user'}>
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
              {/* Same form fields as CreateProperty */}
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
