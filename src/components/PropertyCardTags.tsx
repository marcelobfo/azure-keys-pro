
import React from 'react';

interface TagData {
  text: string;
  color: string;
}

interface FeaturedProperty {
  is_featured?: boolean;
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  tags?: string[];
}

interface PropertyCardTagsProps {
  property: FeaturedProperty;
  maxVisibleTags?: number;
}

export const usePropertyTags = (property: FeaturedProperty): TagData[] => {
  // Garantir que tags sempre seja um array
  const propertyTags = Array.isArray(property.tags) ? property.tags : [];

  // Criar tags especiais baseadas nas propriedades booleanas
  const specialTags = [];
  if (property.is_featured) specialTags.push({ text: 'Destaque', color: 'bg-yellow-500' });
  if (property.is_beachfront) specialTags.push({ text: 'Frente Mar', color: 'bg-blue-500' });
  if (property.is_near_beach) specialTags.push({ text: 'Quadra Mar', color: 'bg-cyan-500' });
  if (property.is_development) specialTags.push({ text: 'Empreendimento', color: 'bg-purple-500' });

  // Combinar tags normais com tags especiais
  const allTags = [
    ...specialTags,
    ...propertyTags.slice(0, Math.max(0, 3 - specialTags.length)).map(tag => ({ text: tag, color: 'bg-gray-600' }))
  ];

  return allTags;
};

const PropertyCardTags: React.FC<PropertyCardTagsProps> = ({ property, maxVisibleTags = 2 }) => {
  const allTags = usePropertyTags(property);

  if (allTags.length === 0) return null;

  return (
    <div className="absolute top-4 left-4 flex flex-wrap gap-1">
      {allTags.slice(0, maxVisibleTags).map((tag, index) => (
        <span
          key={index}
          className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${tag.color}`}
        >
          {tag.text}
        </span>
      ))}
      {allTags.length > maxVisibleTags && (
        <span className="px-2 py-1 rounded-full text-xs font-semibold text-white bg-gray-600">
          +{allTags.length - maxVisibleTags}
        </span>
      )}
    </div>
  );
};

export default PropertyCardTags;
