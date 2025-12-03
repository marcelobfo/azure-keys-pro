import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImagePreviewDialogProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) onNavigate(currentIndex - 1);
          break;
        case 'ArrowRight':
          if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
          break;
        case 'Escape':
          onClose();
          break;
      }
    },
    [isOpen, currentIndex, images.length, onNavigate, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none flex flex-col items-center justify-center gap-4">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 h-10 w-10"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Navigation and Image Container */}
        <div className="relative flex items-center justify-center w-full h-full px-16">
          {/* Previous Button */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(currentIndex - 1)}
              className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {/* Main Image */}
          <img
            src={images[currentIndex]}
            alt={`Preview ${currentIndex + 1}`}
            className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg"
          />

          {/* Next Button */}
          {currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(currentIndex + 1)}
              className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}
        </div>

        {/* Footer with dots and counter */}
        <div className="absolute bottom-6 flex flex-col items-center gap-3">
          {/* Dots Navigation */}
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onNavigate(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Counter */}
          <span className="text-white/80 text-sm">
            {currentIndex + 1} de {images.length}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewDialog;
