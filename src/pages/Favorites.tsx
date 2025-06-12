
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface FavoriteProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  image: string;
}

const Favorites = () => {
  const { user } = useAuth();
  const [favoriteProperties, setFavoriteProperties] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
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
            images
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        return;
      }

      const favorites = data
        ?.filter(item => item.properties)
        ?.map(item => ({
          id: item.properties.id,
          title: item.properties.title,
          price: item.properties.price,
          location: item.properties.location,
          area: item.properties.area || 0,
          bedrooms: item.properties.bedrooms || 0,
          bathrooms: item.properties.bathrooms || 0,
          image: item.properties.images?.[0] || '/placeholder.svg'
        })) || [];

      setFavoriteProperties(favorites);
    } catch (error) {
      console.error('Error in fetchFavorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meus Favoritos
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Imóveis que você salvou como favoritos
          </p>
        </div>

        {favoriteProperties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum favorito ainda
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Explore nossos imóveis e adicione seus favoritos
              </p>
              <Button onClick={() => window.location.href = '/properties'}>
                Ver Imóveis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    R$ {property.price.toLocaleString()}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.location}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                  
                  <Button className="w-full" onClick={() => window.location.href = `/property/${property.id}`}>
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
