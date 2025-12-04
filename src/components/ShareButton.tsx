
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import InstagramShareModal from './InstagramShareModal';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  city: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images?: string[];
  slug?: string;
  hide_address?: boolean;
}

interface ShareButtonProps {
  property: Property;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  property,
  variant = 'outline',
  size = 'default',
  className = '',
  showText = true
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
        onClick={() => setShowModal(true)}
      >
        <Share2 className="w-4 h-4" />
        {showText && 'Compartilhar'}
      </Button>

      <InstagramShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        property={property}
      />
    </>
  );
};

export default ShareButton;
