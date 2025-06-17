
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

export const useInstagramShare = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareData, setShareData] = useState<{
    imageUrl: string;
    caption: string;
  } | null>(null);
  const { toast } = useToast();

  const generateShareContent = async (property: Property) => {
    setIsGenerating(true);
    
    try {
      // Gerar a imagem com canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas não suportado');
      }

      // Configurar dimensões do Instagram (1080x1080)
      canvas.width = 1080;
      canvas.height = 1080;

      // Background gradiente
      const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // Carregar imagem do imóvel se disponível
      if (property.images && property.images.length > 0) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = property.images![0];
          });

          // Desenhar imagem do imóvel (parte superior)
          const imgHeight = 600;
          ctx.drawImage(img, 0, 0, 1080, imgHeight);
          
          // Overlay escuro para texto
          const overlayGradient = ctx.createLinearGradient(0, imgHeight - 200, 0, imgHeight);
          overlayGradient.addColorStop(0, 'rgba(0,0,0,0)');
          overlayGradient.addColorStop(1, 'rgba(0,0,0,0.7)');
          ctx.fillStyle = overlayGradient;
          ctx.fillRect(0, imgHeight - 200, 1080, 200);
        } catch (error) {
          console.log('Erro ao carregar imagem, usando apenas background');
        }
      }

      // Configurar texto
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';

      // Título
      ctx.font = 'bold 48px Arial';
      const titleLines = wrapText(ctx, property.title, 1000);
      titleLines.forEach((line, index) => {
        ctx.fillText(line, 540, property.images?.length ? 720 + (index * 60) : 200 + (index * 60));
      });

      // Preço
      ctx.font = 'bold 60px Arial';
      ctx.fillStyle = '#FFD700';
      const price = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(property.price);
      ctx.fillText(price, 540, property.images?.length ? 850 : 350);

      // Informações adicionais
      ctx.font = '32px Arial';
      ctx.fillStyle = 'white';
      const details = [];
      if (property.bedrooms) details.push(`${property.bedrooms} quartos`);
      if (property.bathrooms) details.push(`${property.bathrooms} banheiros`);
      if (property.area) details.push(`${property.area}m²`);
      
      const detailsText = details.join(' • ');
      ctx.fillText(detailsText, 540, property.images?.length ? 900 : 400);

      // Localização
      ctx.font = '28px Arial';
      ctx.fillStyle = '#E0E0E0';
      ctx.fillText(`${property.location}, ${property.city}`, 540, property.images?.length ? 940 : 440);

      // Logo/Marca no canto inferior
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Maresia Litoral', 540, 1040);

      // Converter canvas para blob
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Gerar caption otimizada para Instagram
      const caption = generateInstagramCaption(property);

      setShareData({
        imageUrl,
        caption
      });

      toast({
        title: "Compartilhamento gerado!",
        description: "Conteúdo pronto para o Instagram",
      });

    } catch (error) {
      console.error('Erro ao gerar compartilhamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o compartilhamento",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const generateInstagramCaption = (property: Property) => {
    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(property.price);

    const details = [];
    if (property.bedrooms) details.push(`🛏️ ${property.bedrooms} quartos`);
    if (property.bathrooms) details.push(`🚿 ${property.bathrooms} banheiros`);
    if (property.area) details.push(`📐 ${property.area}m²`);

    return `🏡 ${property.title}

💰 ${price}

${details.join('\n')}

📍 ${property.location}, ${property.city}

✨ Imóvel incrível esperando por você!

👆 Entre em contato para mais informações e agende sua visita!

#imoveis #${property.city.toLowerCase().replace(/\s+/g, '')} #apartamento #casa #venda #aluguel #corretor #imobiliaria #maresialitoral`;
  };

  const downloadImage = () => {
    if (!shareData) return;

    const link = document.createElement('a');
    link.download = 'imovel-instagram.jpg';
    link.href = shareData.imageUrl;
    link.click();
  };

  const copyCaption = async () => {
    if (!shareData) return;

    try {
      await navigator.clipboard.writeText(shareData.caption);
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto",
        variant: "destructive",
      });
    }
  };

  return {
    generateShareContent,
    downloadImage,
    copyCaption,
    shareData,
    isGenerating,
    setShareData
  };
};
