
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Favorites = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Mock data - você pode conectar com o hook useFavorites depois
  const favoriteProperties = [
    {
      id: '1',
      title: 'Casa Moderna no Centro',
      price: 450000,
      location: 'Centro, Balneário Camboriú',
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
      image: '/placeholder.svg'
    }
  ];

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
                  
                  <Button className="w-full">
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
