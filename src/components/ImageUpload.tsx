import React, { useState, useEffect } from 'react';
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
import ImagePreviewDialog from './ImagePreviewDialog';
import { compressImage, formatFileSize } from '@/utils/imageCompression';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  tenantId?: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onChange, tenantId }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch tenant logo for watermark
  useEffect(() => {
    const fetchLogo = async () => {
      if (!tenantId) return;
      const { data } = await supabase
        .from('tenants')
        .select('logo_url')
        .eq('id', tenantId)
        .maybeSingle();
      if (data?.logo_url) {
        setLogoUrl(data.logo_url);
      }
    };
    fetchLogo();
  }, [tenantId]);

  const openPreview = (index: number) => setPreviewIndex(index);
  const closePreview = () => setPreviewIndex(null);
  const navigatePreview = (index: number) => {
    if (index >= 0 && index < images.length) {
      setPreviewIndex(index);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const applyWatermark = (file: File, logo: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }

        ctx.drawImage(img, 0, 0);

        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          // Place logo in bottom-right corner with opacity
          const maxLogoWidth = img.width * 0.2;
          const maxLogoHeight = img.height * 0.15;
          const scale = Math.min(maxLogoWidth / logoImg.width, maxLogoHeight / logoImg.height, 1);
          const logoW = logoImg.width * scale;
          const logoH = logoImg.height * scale;
          const padding = Math.min(img.width, img.height) * 0.03;

          ctx.globalAlpha = 0.4;
          ctx.drawImage(logoImg, img.width - logoW - padding, img.height - logoH - padding, logoW, logoH);
          ctx.globalAlpha = 1.0;

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.92);
        };
        logoImg.onerror = () => resolve(file); // If logo fails, use original
        logoImg.src = logo;
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `properties/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

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
      // Compress all images first
      const compressionResults = await Promise.all(
        Array.from(files).map(file => compressImage(file))
      );

      const totalOriginal = compressionResults.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressed = compressionResults.reduce((sum, r) => sum + r.compressedSize, 0);
      const totalSavings = Math.round((1 - totalCompressed / totalOriginal) * 100);

      // Apply watermark if logo is available
      let processedFiles = compressionResults.map(r => r.file);
      if (logoUrl) {
        processedFiles = await Promise.all(
          processedFiles.map(file => applyWatermark(file, logoUrl))
        );
      }

      // Upload files
      const uploadedUrls = await Promise.all(processedFiles.map(f => uploadImage(f)));
      
      onChange([...images, ...uploadedUrls]);
      
      const savingsText = totalSavings > 0 
        ? ` Economia de ${totalSavings}% (${formatFileSize(totalOriginal - totalCompressed)})`
        : '';
      const watermarkText = logoUrl ? ' com marca d\'água' : '';
      
      toast({
        title: "Sucesso!",
        description: `${uploadedUrls.length} imagem(ns) enviada(s)${watermarkText}.${savingsText}`,
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
      if (event.target) event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const setFeaturedImage = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [movedImage] = newImages.splice(index, 1);
    newImages.unshift(movedImage);
    onChange(newImages);
    toast({ title: "Imagem destacada", description: "A imagem foi definida como destaque do imóvel." });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img === active.id);
      const newIndex = images.findIndex((img) => img === over.id);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Imagens do Imóvel</Label>
        {logoUrl && (
          <p className="text-xs text-muted-foreground mt-1">✓ Marca d'água da logo será aplicada automaticamente</p>
        )}
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
            <Input id="image-upload" type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Formatos aceitos: JPG, PNG, WebP</p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Arraste as imagens para reordenar. A primeira imagem será a capa do imóvel.</span>
          </div>
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                    onPreview={() => openPreview(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <ImagePreviewDialog
        images={images}
        currentIndex={previewIndex ?? 0}
        isOpen={previewIndex !== null}
        onClose={closePreview}
        onNavigate={navigatePreview}
      />
    </div>
  );
};

export default ImageUpload;
