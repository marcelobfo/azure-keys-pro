import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SEOUtils: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateSlugsForExistingProperties = async () => {
    setIsGenerating(true);
    
    try {
      // Buscar propriedades sem slug
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, property_type, city, title, property_code')
        .or('slug.is.null,slug.eq.""');

      if (error) {
        throw error;
      }

      let updated = 0;
      const total = properties?.length || 0;

      for (const property of properties || []) {
        try {
          // Gerar slug usando a função do banco
          const { data: slugData, error: slugError } = await supabase
            .rpc('generate_property_slug', {
              property_type_input: property.property_type,
              city_input: property.city,
              title_input: property.title,
              property_code_input: property.property_code
            });

          if (slugError) {
            console.error('Erro ao gerar slug:', slugError);
            continue;
          }

          // Atualizar propriedade com o slug gerado
          const { error: updateError } = await supabase
            .from('properties')
            .update({ slug: slugData })
            .eq('id', property.id);

          if (updateError) {
            console.error('Erro ao atualizar propriedade:', updateError);
            continue;
          }

          updated++;
        } catch (error) {
          console.error('Erro ao processar propriedade:', error);
        }
      }

      toast({
        title: "Sucesso!",
        description: `${updated} de ${total} propriedades foram atualizadas com slugs SEO.`,
      });

    } catch (error) {
      console.error('Erro ao gerar slugs:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar slugs para as propriedades",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const validateAllSlugs = async () => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, slug')
        .not('slug', 'is', null);

      if (error) {
        throw error;
      }

      const duplicates = properties?.filter((property, index, arr) => 
        arr.findIndex(p => p.slug === property.slug) !== index
      );

      if (duplicates && duplicates.length > 0) {
        toast({
          title: "Atenção!",
          description: `Encontrados ${duplicates.length} slugs duplicados.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Todos os slugs estão únicos.",
        });
      }

    } catch (error) {
      console.error('Erro ao validar slugs:', error);
      toast({
        title: "Erro",
        description: "Erro ao validar slugs",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Utilitários de SEO</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Gerar Slugs para Propriedades Existentes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Gera slugs amigáveis para todas as propriedades que ainda não possuem.
          </p>
          <Button 
            onClick={generateSlugsForExistingProperties}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Gerando...' : 'Gerar Slugs'}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Validar Slugs</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Verifica se existem slugs duplicados no sistema.
          </p>
          <Button 
            onClick={validateAllSlugs}
            variant="outline"
            className="w-full"
          >
            Validar Slugs
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
            URLs Amigáveis Implementadas:
          </h4>
          <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• /imovel/[slug] - Páginas de propriedades</li>
            <li>• /imoveis/destaque - Propriedades em destaque</li>
            <li>• /imoveis/frente-mar - Propriedades frente mar</li>
            <li>• /imoveis/quadra-mar - Propriedades quadra mar</li>
            <li>• /imoveis/empreendimentos - Empreendimentos</li>
            <li>• /sitemap.xml - Sitemap dinâmico</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SEOUtils;