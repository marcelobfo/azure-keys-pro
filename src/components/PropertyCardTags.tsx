import React from 'react';
import { usePropertyTagsDisplay } from '@/hooks/usePropertyTags';

interface TagData {
  text: string;
  color: string;
}

interface FeaturedProperty {
  purpose?: string;
  is_featured?: boolean;
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  accepts_exchange?: boolean;
  tags?: string[];
}

interface PropertyCardTagsProps {
  property: FeaturedProperty;
  maxVisibleTags?: number;
}

export const usePropertyTags = (property: FeaturedProperty): TagData[] => {
  // Get property tags with registered colors
  const propertyTags = Array.isArray(property.tags) ? property.tags : [];
  const registeredTagsWithColors = usePropertyTagsDisplay(propertyTags);

  // Tag de finalidade (prioridade máxima)
  const purposeTags: TagData[] = [];
  if (property.purpose === 'sale') {
    purposeTags.push({ text: 'Venda', color: 'bg-green-600' });
  } else if (property.purpose === 'rent') {
    purposeTags.push({ text: 'Aluguel', color: 'bg-orange-500' });
  } else if (property.purpose === 'both') {
    purposeTags.push({ text: 'Venda/Aluguel', color: 'bg-blue-600' });
  }

  // Criar tags especiais baseadas nas propriedades booleanas
  const specialTags: TagData[] = [];
  if (property.is_featured) specialTags.push({ text: 'Destaque', color: 'bg-yellow-500' });
  if (property.is_beachfront) specialTags.push({ text: 'Frente Mar', color: 'bg-cyan-500' });
  if (property.is_near_beach) specialTags.push({ text: 'Quadra Mar', color: 'bg-sky-500' });
  if (property.is_development) specialTags.push({ text: 'Lançamento', color: 'bg-purple-500' });
  if (property.accepts_exchange) specialTags.push({ text: 'Aceita Permuta', color: 'bg-emerald-500' });

  // Combinar tags: finalidade primeiro, depois especiais, depois normais com cores registradas
  const maxNormalTags = Math.max(0, 3 - purposeTags.length - specialTags.length);
  const normalTags = registeredTagsWithColors.slice(0, maxNormalTags);

  const allTags = [
    ...purposeTags,
    ...specialTags,
    ...normalTags,
  ];

  return allTags;
};

const PropertyCardTags: React.FC<PropertyCardTagsProps> = ({ property, maxVisibleTags = 3 }) => {
  const allTags = usePropertyTags(property);

  if (allTags.length === 0) return null;

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-1 max-w-[60%]">
      {allTags.slice(0, maxVisibleTags).map((tag, index) => {
        // Check if color is a hex color or a tailwind class
        const isHexColor = tag.color.startsWith('#');
        
        return (
          <span
            key={index}
            className={`px-2 py-1 rounded-full text-xs font-semibold text-white shadow-md ${
              !isHexColor ? tag.color : ''
            }`}
            style={isHexColor ? { backgroundColor: tag.color } : {}}
          >
            {tag.text}
          </span>
        );
      })}
      {allTags.length > maxVisibleTags && (
        <span className="px-2 py-1 rounded-full text-xs font-semibold text-white bg-gray-600 shadow-md">
          +{allTags.length - maxVisibleTags}
        </span>
      )}
    </div>
  );
};

export default PropertyCardTags;
