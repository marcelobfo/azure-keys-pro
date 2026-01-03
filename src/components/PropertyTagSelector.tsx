import React from 'react';
import { Check } from 'lucide-react';
import { usePropertyTags } from '@/hooks/usePropertyTags';
import { cn } from '@/lib/utils';

interface PropertyTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const PropertyTagSelector: React.FC<PropertyTagSelectorProps> = ({
  selectedTags,
  onTagsChange,
}) => {
  const { tags: availableTags, loading } = usePropertyTags();

  const toggleTag = (slug: string) => {
    if (selectedTags.includes(slug)) {
      onTagsChange(selectedTags.filter((t) => t !== slug));
    } else {
      onTagsChange([...selectedTags, slug]);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando tags...</div>;
  }

  if (!availableTags || availableTags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhuma tag cadastrada. Crie tags nas configurações do site.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableTags.map((tag) => {
        const isSelected = selectedTags.includes(tag.slug);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.slug)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1',
              isSelected
                ? 'text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            style={isSelected ? { backgroundColor: tag.color } : {}}
          >
            {tag.name}
            {isSelected && <Check className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );
};

export default PropertyTagSelector;
