import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

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

export interface ShareSettings {
  logoUrl?: string;
  siteName?: string;
}

export const useInstagramShare = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareData, setShareData] = useState<{
    imageUrl: string;
    storiesImageUrl: string;
    caption: string;
    propertyUrl: string;
  } | null>(null);
  const { toast } = useToast();

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

    const displayLocation = property.hide_address ? property.city : `${property.location}, ${property.city}`;
    const propertyUrl = `${window.location.origin}/imovel/${property.slug || property.id}`;

    return `🏡 ${property.title}

💰 ${price}

${details.join('\n')}

📍 ${displayLocation}

✨ Imóvel incrível esperando por você!

🔗 Veja mais detalhes:
${propertyUrl}

👆 Entre em contato para mais informações e agende sua visita!

#imoveis #${property.city.toLowerCase().replace(/\s+/g, '')} #apartamento #casa #venda #aluguel #corretor #imobiliaria #maresialitoral`;
  };

  const drawBranding = async (
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    yPosition: number, 
    settings?: ShareSettings
  ) => {
    ctx.textAlign = 'center';
    
    if (settings?.logoUrl) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          logoImg.src = settings.logoUrl!;
        });
        
        const maxLogoWidth = 200;
        const maxLogoHeight = 50;
        const scale = Math.min(maxLogoWidth / logoImg.width, maxLogoHeight / logoImg.height);
        const logoWidth = logoImg.width * scale;
        const logoHeight = logoImg.height * scale;
        
        ctx.drawImage(logoImg, (canvasWidth - logoWidth) / 2, yPosition - logoHeight, logoWidth, logoHeight);
      } catch {
        // Fallback para texto
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(settings?.siteName || '', canvasWidth / 2, yPosition);
      }
    } else if (settings?.siteName) {
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(settings.siteName, canvasWidth / 2, yPosition);
    }
  };

  const generateStoriesImage = async (property: Property, settings?: ShareSettings): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas não suportado');

    // Dimensões Stories (1080x1920 - proporção 9:16)
    canvas.width = 1080;
    canvas.height = 1920;

    // Background gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#4a1a6b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Carregar imagem do imóvel
    if (property.images && property.images.length > 0) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = property.images![0];
        });

        // Imagem ocupando mais espaço (900px altura)
        ctx.drawImage(img, 0, 0, 1080, 900);
        
        // Overlay gradiente
        const overlayGradient = ctx.createLinearGradient(0, 700, 0, 920);
        overlayGradient.addColorStop(0, 'rgba(0,0,0,0)');
        overlayGradient.addColorStop(1, 'rgba(102,126,234,0.95)');
        ctx.fillStyle = overlayGradient;
        ctx.fillRect(0, 700, 1080, 220);
      } catch (error) {
        console.log('Erro ao carregar imagem, usando apenas background');
      }
    }

    // Configurar texto
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    // Título (maior)
    ctx.font = 'bold 56px Arial';
    const titleLines = wrapText(ctx, property.title, 1000);
    const titleStartY = property.images?.length ? 1000 : 300;
    titleLines.forEach((line, index) => {
      ctx.fillText(line, 540, titleStartY + (index * 70));
    });

    // Preço (muito grande)
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = '#FFD700';
    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(property.price);
    const priceY = titleStartY + (titleLines.length * 70) + 80;
    ctx.fillText(price, 540, priceY);

    // Detalhes (linhas separadas)
    ctx.font = '40px Arial';
    ctx.fillStyle = 'white';
    let detailY = priceY + 100;
    
    if (property.bedrooms) {
      ctx.fillText(`🛏️ ${property.bedrooms} quartos`, 540, detailY);
      detailY += 60;
    }
    if (property.bathrooms) {
      ctx.fillText(`🚿 ${property.bathrooms} banheiros`, 540, detailY);
      detailY += 60;
    }
    if (property.area) {
      ctx.fillText(`📐 ${property.area}m²`, 540, detailY);
      detailY += 60;
    }

    // Localização
    ctx.font = '36px Arial';
    ctx.fillStyle = '#E0E0E0';
    const displayLocation = property.hide_address ? property.city : `${property.location}, ${property.city}`;
    ctx.fillText(`📍 ${displayLocation}`, 540, detailY + 30);

    // QR Code MAIOR e CENTRALIZADO
    const propertyLinkForQR = `${window.location.origin}/imovel/${property.slug || property.id}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(propertyLinkForQR, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      const qrImg = new Image();
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });
      
      // Posição centralizada na parte inferior
      const qrSize = 200;
      const qrX = (1080 - qrSize) / 2;
      const qrY = 1920 - qrSize - 180;
      
      // Fundo branco arredondado
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 55, 15);
      ctx.fill();
      
      // Desenhar QR Code
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      
      // Texto abaixo do QR Code
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.fillText('📱 Aponte a câmera', qrX + qrSize / 2, qrY + qrSize + 28);
      
    } catch (qrError) {
      console.log('Erro ao gerar QR Code:', qrError);
    }

    // Logo/Marca na parte inferior
    await drawBranding(ctx, 1080, 1870, settings);

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const generateShareContent = async (property: Property, settings?: ShareSettings) => {
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

      // Localização (ocultar endereço se marcado)
      ctx.font = '28px Arial';
      ctx.fillStyle = '#E0E0E0';
      const displayLocation = property.hide_address ? property.city : `${property.location}, ${property.city}`;
      ctx.fillText(displayLocation, 540, property.images?.length ? 940 : 440);

      // Gerar e desenhar QR Code com link do imóvel
      const propertyLinkForQR = `${window.location.origin}/imovel/${property.slug || property.id}`;
      
      try {
        const qrDataUrl = await QRCode.toDataURL(propertyLinkForQR, {
          width: 120,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        const qrImg = new Image();
        await new Promise((resolve, reject) => {
          qrImg.onload = resolve;
          qrImg.onerror = reject;
          qrImg.src = qrDataUrl;
        });
        
        // Posição do QR Code (canto inferior direito)
        const qrSize = 120;
        const qrX = 1080 - qrSize - 30; // 30px de margem direita
        const qrY = 1080 - qrSize - 60; // 60px de margem inferior
        
        // Fundo branco arredondado para o QR Code
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 35, 10);
        ctx.fill();
        
        // Desenhar QR Code
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        
        // Texto "Escaneie" abaixo do QR Code
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.fillText('📱 Escaneie', qrX + qrSize / 2, qrY + qrSize + 18);
        
      } catch (qrError) {
        console.log('Erro ao gerar QR Code:', qrError);
        // Continua sem o QR Code se houver erro
      }

      // Logo/Marca no canto inferior (centralizado à esquerda do QR)
      await drawBranding(ctx, 800, 1045, settings);

      // Converter canvas para blob
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Gerar imagem Stories
      const storiesImageUrl = await generateStoriesImage(property, settings);

      // Gerar caption otimizada para Instagram
      const caption = generateInstagramCaption(property);

      // Gerar URL de compartilhamento com meta tags dinâmicas (usando domínio fixo)
      const propertyUrl = `https://maresialitoral.com.br/share/${property.slug || property.id}`;

      setShareData({
        imageUrl,
        storiesImageUrl,
        caption,
        propertyUrl
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

  const downloadImage = (format: 'feed' | 'stories' = 'feed') => {

    if (!shareData) return;

    const link = document.createElement('a');
    link.download = format === 'stories' ? 'imovel-stories.jpg' : 'imovel-feed.jpg';
    link.href = format === 'stories' ? shareData.storiesImageUrl : shareData.imageUrl;
    link.click();

    toast({
      title: "Download iniciado!",
      description: `Imagem ${format === 'stories' ? 'Stories' : 'Feed'} salva com sucesso`,
    });
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

  const shareViaWebAPI = async (format: 'feed' | 'stories' = 'feed') => {
    if (!shareData) return;

    // Tentar usar Web Share API se disponível
    if (navigator.share) {
      try {
        // Converter dataURL para blob
        const imageUrl = format === 'stories' ? shareData.storiesImageUrl : shareData.imageUrl;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const fileName = format === 'stories' ? 'imovel-stories.jpg' : 'imovel-feed.jpg';
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        await navigator.share({
          title: 'Imóvel para Compartilhar',
          text: shareData.caption,
          files: [file]
        });

        toast({
          title: "Compartilhado!",
          description: "Conteúdo compartilhado com sucesso",
        });
      } catch (error) {
        console.log('Erro no compartilhamento nativo, usando fallback');
        downloadImage(format);
      }
    } else {
      // Fallback: download da imagem
      downloadImage(format);
    }
  };

  const copyPropertyLink = async () => {
    if (!shareData) return;

    try {
      await navigator.clipboard.writeText(shareData.propertyUrl);
      toast({
        title: "Link copiado!",
        description: "Link do imóvel copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  return {
    generateShareContent,
    downloadImage,
    copyCaption,
    copyPropertyLink,
    shareViaWebAPI,
    shareData,
    isGenerating,
    setShareData
  };
};
