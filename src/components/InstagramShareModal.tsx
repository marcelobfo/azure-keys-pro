
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, Share2 } from 'lucide-react';
import { useInstagramShare } from '@/hooks/useInstagramShare';

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
}

interface InstagramShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

const InstagramShareModal: React.FC<InstagramShareModalProps> = ({
  isOpen,
  onClose,
  property
}) => {
  const { 
    generateShareContent, 
    downloadImage, 
    copyCaption, 
    shareViaWebAPI,
    shareData, 
    isGenerating,
    setShareData 
  } = useInstagramShare();

  React.useEffect(() => {
    if (isOpen && !shareData) {
      generateShareContent(property);
    }
  }, [isOpen, property]);

  React.useEffect(() => {
    if (!isOpen) {
      setShareData(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartilhar no Instagram
          </DialogTitle>
          <DialogDescription>
            Preview do seu post otimizado para Instagram
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isGenerating ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Gerando conteúdo...</span>
            </div>
          ) : shareData ? (
            <>
              {/* Preview da Imagem */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Imagem para Instagram</h3>
                <div className="aspect-square max-w-sm mx-auto">
                  <img
                    src={shareData.imageUrl}
                    alt="Preview Instagram"
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* Preview da Caption */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Texto do Post</h3>
                <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {shareData.caption}
                  </pre>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => shareViaWebAPI()}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
                
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar Imagem
                </Button>
                
                <Button
                  onClick={copyCaption}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Texto
                </Button>
              </div>

              <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
                💡 <strong>Dica:</strong> Baixe a imagem e copie o texto, depois cole no Instagram para um post perfeito!
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Erro ao gerar conteúdo. Tente novamente.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramShareModal;
