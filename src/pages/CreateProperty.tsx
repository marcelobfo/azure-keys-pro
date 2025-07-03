
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
    bedrooms: '',
    bathrooms: '',
    suites: '',
    images: [] as string[],
    features: [] as string[],
    tags: [] as string[],
    is_featured: false,
    is_beachfront: false,
    is_near_beach: false,
    is_development: false,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
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
      const { error } = await supabase
        .from('properties')
        .insert({
          ...formData,
          price: parseFloat(formData.price) || 0,
          rental_price: formData.rental_price ? parseFloat(formData.rental_price) : null,
          area: parseFloat(formData.area) || null,
          bedrooms: parseInt(formData.bedrooms) || null,
          bathrooms: parseInt(formData.bathrooms) || null,
          suites: parseInt(formData.suites) || null,
          user_id: user.id,
          status: 'available',
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
          <p className="text-muted-foreground">Preencha as informações da propriedade</p>
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
                  placeholder="Descreva a propriedade..."
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
                <Label htmlFor="location">Endereço *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="price">Preço de Venda *</Label>
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
                    <Label htmlFor="rental_price">Preço do Aluguel *</Label>
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

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="Ex: 120"
                  />
                </div>
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
              <CardDescription>Adicione tags para melhor categorização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleKeyPress}
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

          {/* Imagens */}
          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
              <CardDescription>Adicione fotos da propriedade</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={formData.images}
                onImagesChange={(images) => setFormData({...formData, images})}
                maxImages={10}
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
