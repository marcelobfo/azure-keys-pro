import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, Share2, Link, MessageCircle, Square, Smartphone } from 'lucide-react';
import { useInstagramShare } from '@/hooks/useInstagramShare';
import { formatCurrency } from '@/utils/priceUtils';

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
  const [format, setFormat] = useState<'feed' | 'stories'>('feed');
  
  const { 
    generateShareContent, 
    downloadImage, 
    copyCaption, 
    copyPropertyLink,
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
      setFormat('feed');
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
            Escolha o formato ideal para seu post
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
              {/* Tabs para escolher formato */}
              <Tabs value={format} onValueChange={(v) => setFormat(v as 'feed' | 'stories')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="feed" className="flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    Feed (1:1)
                  </TabsTrigger>
                  <TabsTrigger value="stories" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Stories (9:16)
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Preview da Imagem */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">
                  {format === 'feed' ? 'Imagem para Feed' : 'Imagem para Stories'}
                </h3>
                <div className={`mx-auto ${format === 'feed' ? 'aspect-square max-w-sm' : 'aspect-[9/16] max-w-xs'}`}>
                  <img
                    src={format === 'feed' ? shareData.imageUrl : shareData.storiesImageUrl}
                    alt={`Preview ${format === 'feed' ? 'Feed' : 'Stories'}`}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {format === 'feed' ? '1080 x 1080 pixels' : '1080 x 1920 pixels'}
                </p>
              </div>

              {/* Preview da Caption */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Texto do Post</h3>
                <div className="bg-white dark:bg-slate-700 p-4 rounded border max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                    {shareData.caption}
                  </pre>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <Button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `🏡 ${property.title}\n💰 ${formatCurrency(property.price)}\n📍 ${property.hide_address ? property.city : property.location}\n\n🔗 ${window.location.origin}/imovel/${property.slug || property.id}`
                    );
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>

                <Button
                  onClick={copyPropertyLink}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Link className="w-4 h-4" />
                  Copiar Link
                </Button>

                <Button
                  onClick={() => shareViaWebAPI(format)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
                
                <Button
                  onClick={() => downloadImage(format)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar {format === 'feed' ? 'Feed' : 'Stories'}
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

              <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                💡 <strong>Dica:</strong> {format === 'feed' 
                  ? 'Use o formato Feed para posts no seu perfil!' 
                  : 'Use o formato Stories para compartilhar nos stories - o QR Code maior facilita o escaneamento!'}
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