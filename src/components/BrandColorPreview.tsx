import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Heart, Phone, MessageCircle } from 'lucide-react';

interface BrandColorPreviewProps {
  primaryColor: string;
  accentColor: string;
  successColor?: string;
}

const BrandColorPreview = ({ 
  primaryColor, 
  accentColor, 
  successColor = '#10B981' 
}: BrandColorPreviewProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Preview em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header simulado */}
        <div 
          className="h-12 rounded-lg flex items-center justify-between px-4"
          style={{ backgroundColor: primaryColor }}
        >
          <span className="text-white font-semibold text-sm">Sua Imobiliária</span>
          <div className="flex gap-2">
            <div className="w-16 h-2 bg-white/30 rounded" />
            <div className="w-16 h-2 bg-white/30 rounded" />
          </div>
        </div>
        
        {/* Botões */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Botões</p>
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm"
              className="text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Botão Primário
            </Button>
            <Button 
              size="sm"
              className="text-white"
              style={{ backgroundColor: accentColor }}
            >
              <Phone className="w-3 h-3 mr-1" />
              Destaque
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Outline
            </Button>
          </div>
        </div>
        
        {/* Badges */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Badges e Tags</p>
          <div className="flex gap-2 flex-wrap">
            <Badge 
              className="text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Novo
            </Badge>
            <Badge 
              className="text-white"
              style={{ backgroundColor: accentColor }}
            >
              Destaque
            </Badge>
            <Badge 
              className="text-white"
              style={{ backgroundColor: successColor }}
            >
              <Check className="w-3 h-3 mr-1" />
              Ativo
            </Badge>
          </div>
        </div>
        
        {/* Card de imóvel simulado */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Card de Imóvel</p>
          <div className="border rounded-lg p-3 space-y-2">
            <div className="h-20 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
              Imagem do Imóvel
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">Apartamento 3 Quartos</p>
                <p 
                  className="text-lg font-bold"
                  style={{ color: primaryColor }}
                >
                  R$ 450.000
                </p>
              </div>
              <button 
                className="p-2 rounded-full hover:bg-muted transition-colors"
                style={{ color: accentColor }}
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>
            <Button 
              size="sm" 
              className="w-full text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Entrar em contato
            </Button>
          </div>
        </div>
        
        {/* Links */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Links</p>
          <div className="flex gap-4">
            <a 
              href="#" 
              style={{ color: primaryColor }}
              className="text-sm hover:underline"
              onClick={e => e.preventDefault()}
            >
              Link primário
            </a>
            <a 
              href="#" 
              style={{ color: accentColor }}
              className="text-sm hover:underline"
              onClick={e => e.preventDefault()}
            >
              Link destaque
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandColorPreview;
