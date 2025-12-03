import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Star, ZoomIn } from 'lucide-react';
import { Button } from './ui/button';

interface SortableImageItemProps {
  id: string;
  image: string;
  index: number;
  isFirst: boolean;
  onRemove: () => void;
  onSetFeatured: () => void;
  onPreview: () => void;
}

const SortableImageItem: React.FC<SortableImageItemProps> = ({
  id,
  image,
  index,
  isFirst,
  onRemove,
  onSetFeatured,
  onPreview,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden ${
        isDragging ? 'opacity-50 scale-105 z-50' : ''
      } ${isFirst ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      {/* Featured Badge */}
      {isFirst && (
        <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Destaque
        </div>
      )}

      {/* Position Number */}
      <div className="absolute top-2 right-10 z-10 bg-background/80 text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
        {index + 1}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Image */}
      <img
        src={image}
        alt={`Imagem ${index + 1}`}
        className="w-full h-32 object-cover"
      />

      {/* Zoom Overlay - appears on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <ZoomIn className="w-8 h-8 text-white" />
      </button>

      {/* Bottom Actions Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded bg-background/20 hover:bg-background/40 transition-colors"
        >
          <GripVertical className="w-4 h-4 text-white" />
        </div>

        {/* Set as Featured Button */}
        {!isFirst && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSetFeatured();
            }}
            className="h-7 px-2 text-xs text-white hover:text-primary hover:bg-background/40"
          >
            <Star className="w-3 h-3 mr-1" />
            Destacar
          </Button>
        )}
      </div>
    </div>
  );
};

export default SortableImageItem;
