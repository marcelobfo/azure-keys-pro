
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Home, User, Settings, LogOut, MapPin, Bed, Bath, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  images: string[];
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
      fetchFavorites();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        property_id,
        properties (
          id,
          title,
          price,
          location,
          area,
          bedrooms,
          bathrooms,
          property_type,
          images
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      const favoriteProperties = data?.map(item => item.properties).filter(Boolean) as Property[];
      setFavorites(favoriteProperties || []);
    }
    setLoading(false);
  };

  const removeFavorite = async (propertyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', propertyId);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover dos favoritos",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Imóvel removido dos favoritos",
      });
      fetchFavorites();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Bem-vindo, {profile?.full_name || user?.email}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate('/')} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  Meus Imóveis Favoritos ({favorites.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhum favorito ainda
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Explore nossos imóveis e adicione seus favoritos
                    </p>
                    <Button onClick={() => navigate('/properties')}>
                      Ver Imóveis
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((property) => (
                      <Card key={property.id} className="group hover:shadow-lg transition-all duration-300">
                        <div className="relative overflow-hidden">
                          <img
                            src={property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'}
                            alt={property.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {formatPrice(property.price)}
                          </div>
                          <Button
                            onClick={() => removeFavorite(property.id)}
                            className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                            size="sm"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {property.location}
                          </p>
                          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Square className="w-4 h-4 mr-1" />
                              {property.area}m²
                            </span>
                            <span className="flex items-center">
                              <Bed className="w-4 h-4 mr-1" />
                              {property.bedrooms}
                            </span>
                            <span className="flex items-center">
                              <Bath className="w-4 h-4 mr-1" />
                              {property.bathrooms}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome Completo
                  </label>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    {profile?.full_name || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    {profile?.email || user?.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Telefone
                  </label>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    {profile?.phone || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Usuário
                  </label>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white capitalize">
                    {profile?.role || 'usuário'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Preferências
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
