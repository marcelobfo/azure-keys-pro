
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PropertyTagProps {
  tag: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const PropertyTag: React.FC<PropertyTagProps> = ({ tag, variant = 'default' }) => {
  // Definir cores baseadas no tipo de tag
  const getTagVariant = (tagName: string) => {
    const lowerTag = tagName.toLowerCase();
    if (lowerTag.includes('destaque') || lowerTag.includes('lançamento')) return 'destructive';
    if (lowerTag.includes('financiamento') || lowerTag.includes('parcelamento')) return 'secondary';
    if (lowerTag.includes('construção') || lowerTag.includes('obra')) return 'outline';
    return 'default';
  };

  return (
    <Badge 
      variant={variant !== 'default' ? variant : getTagVariant(tag)}
      className="text-xs md:text-sm font-medium px-2 py-1 whitespace-nowrap"
    >
      {tag}
    </Badge>
  );
};

export default PropertyTag;
