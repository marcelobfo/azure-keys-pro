import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, ImageIcon, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SortableImageItem from './SortableImageItem';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onChange }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `properties/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(uploadImage);
      const uploadedUrls = await Promise.all(uploadPromises);
      
      onChange([...images, ...uploadedUrls]);
      
      toast({
        title: "Sucesso!",
        description: `${uploadedUrls.length} imagem(ns) enviada(s) com sucesso!`,
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: `Erro ao fazer upload: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const setFeaturedImage = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [movedImage] = newImages.splice(index, 1);
    newImages.unshift(movedImage);
    onChange(newImages);
    toast({
      title: "Imagem destacada",
      description: "A imagem foi definida como destaque do imóvel.",
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img === active.id);
      const newIndex = images.findIndex((img) => img === over.id);
      
      const newImages = arrayMove(images, oldIndex, newIndex);
      onChange(newImages);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Imagens do Imóvel</Label>
        <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="mt-4">
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Button type="button" disabled={uploading} asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Selecionar Imagens'}
                </span>
              </Button>
            </Label>
            <Input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Formatos aceitos: JPG, PNG, WebP
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Arraste as imagens para reordenar. A primeira imagem será a capa do imóvel.
            </span>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={image}
                    id={image}
                    image={image}
                    index={index}
                    isFirst={index === 0}
                    onRemove={() => removeImage(index)}
                    onSetFeatured={() => setFeaturedImage(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
