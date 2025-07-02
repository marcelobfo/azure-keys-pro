
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PropertyPurposeButtons: React.FC = () => {
  const navigate = useNavigate();

  const handlePurposeClick = (purpose: 'sale' | 'rent') => {
    navigate(`/properties?purpose=${purpose}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
      <Button
        onClick={() => handlePurposeClick('sale')}
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
      >
        <Home className="w-6 h-6 mr-3" />
        Comprar Imóvel
      </Button>
      <Button
        onClick={() => handlePurposeClick('rent')}
        size="lg"
        variant="outline"
        className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
      >
        <Key className="w-6 h-6 mr-3" />
        Alugar Imóvel
      </Button>
    </div>
  );
};

export default PropertyPurposeButtons;
