import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantContext } from '@/contexts/TenantContext';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Check, Loader2, MapPin, RefreshCw } from 'lucide-react';

interface CityGroup {
  normalizedKey: string;
  variations: {
    value: string;
    count: number;
  }[];
  totalCount: number;
}

// Função para normalizar texto para comparação
const normalizeForComparison = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' '); // Normaliza espaços múltiplos
};

const LocationNormalizer: React.FC = () => {
  const { selectedTenantId } = useTenantContext();
  const { currentTenant } = useTenant();
  const { toast } = useToast();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;

  const [loading, setLoading] = useState(true);
  const [cityGroups, setCityGroups] = useState<CityGroup[]>([]);
  const [neighborhoodGroups, setNeighborhoodGroups] = useState<CityGroup[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [merging, setMerging] = useState<string | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('city, neighborhood');

      if (effectiveTenantId) {
        query = query.eq('tenant_id', effectiveTenantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar cidades
      const cityMap = new Map<string, Map<string, number>>();
      const neighborhoodMap = new Map<string, Map<string, number>>();

      data?.forEach((property) => {
        // Processar cidade
        if (property.city) {
          const normalizedCity = normalizeForComparison(property.city);
          if (!cityMap.has(normalizedCity)) {
            cityMap.set(normalizedCity, new Map());
          }
          const variations = cityMap.get(normalizedCity)!;
          variations.set(property.city, (variations.get(property.city) || 0) + 1);
        }

        // Processar bairro
        if (property.neighborhood) {
          const normalizedNeighborhood = normalizeForComparison(property.neighborhood);
          if (!neighborhoodMap.has(normalizedNeighborhood)) {
            neighborhoodMap.set(normalizedNeighborhood, new Map());
          }
          const variations = neighborhoodMap.get(normalizedNeighborhood)!;
          variations.set(property.neighborhood, (variations.get(property.neighborhood) || 0) + 1);
        }
      });

      // Converter para array e filtrar grupos com mais de 1 variação
      const cityGroupsArray: CityGroup[] = [];
      cityMap.forEach((variations, normalizedKey) => {
        if (variations.size > 1) {
          const variationsArray = Array.from(variations.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);
          
          cityGroupsArray.push({
            normalizedKey,
            variations: variationsArray,
            totalCount: variationsArray.reduce((sum, v) => sum + v.count, 0),
          });
        }
      });

      const neighborhoodGroupsArray: CityGroup[] = [];
      neighborhoodMap.forEach((variations, normalizedKey) => {
        if (variations.size > 1) {
          const variationsArray = Array.from(variations.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);
          
          neighborhoodGroupsArray.push({
            normalizedKey,
            variations: variationsArray,
            totalCount: variationsArray.reduce((sum, v) => sum + v.count, 0),
          });
        }
      });

      setCityGroups(cityGroupsArray.sort((a, b) => b.totalCount - a.totalCount));
      setNeighborhoodGroups(neighborhoodGroupsArray.sort((a, b) => b.totalCount - a.totalCount));

      // Pré-selecionar a variação mais comum
      const initialSelected: Record<string, string> = {};
      cityGroupsArray.forEach(group => {
        initialSelected[`city_${group.normalizedKey}`] = group.variations[0].value;
      });
      neighborhoodGroupsArray.forEach(group => {
        initialSelected[`neighborhood_${group.normalizedKey}`] = group.variations[0].value;
      });
      setSelectedValues(initialSelected);

    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as localizações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [effectiveTenantId]);

  const handleMerge = async (type: 'city' | 'neighborhood', group: CityGroup) => {
    const key = `${type}_${group.normalizedKey}`;
    const selectedValue = customValues[key] || selectedValues[key];
    
    if (!selectedValue) {
      toast({
        title: 'Selecione um valor',
        description: 'Escolha qual nome será usado para todos os imóveis.',
        variant: 'destructive',
      });
      return;
    }

    setMerging(key);
    
    try {
      // Atualizar todos os imóveis com variações para o valor selecionado
      const valuesToUpdate = group.variations
        .map(v => v.value)
        .filter(v => v !== selectedValue);

      for (const oldValue of valuesToUpdate) {
        let query = supabase
          .from('properties')
          .update({ [type]: selectedValue })
          .eq(type, oldValue);

        if (effectiveTenantId) {
          query = query.eq('tenant_id', effectiveTenantId);
        }

        const { error } = await query;
        if (error) throw error;
      }

      toast({
        title: 'Sucesso!',
        description: `${group.totalCount - (group.variations.find(v => v.value === selectedValue)?.count || 0)} imóveis atualizados para "${selectedValue}".`,
      });

      // Recarregar dados
      await fetchLocations();

    } catch (error) {
      console.error('Erro ao mesclar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os imóveis.',
        variant: 'destructive',
      });
    } finally {
      setMerging(null);
    }
  };

  const renderGroup = (type: 'city' | 'neighborhood', group: CityGroup) => {
    const key = `${type}_${group.normalizedKey}`;
    const isCustom = !!customValues[key];
    
    return (
      <Card key={key} className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base">
                "{group.variations[0].value}"
              </CardTitle>
            </div>
            <Badge variant="secondary">
              {group.variations.length} variações • {group.totalCount} imóveis
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={isCustom ? 'custom' : selectedValues[key]}
            onValueChange={(value) => {
              if (value !== 'custom') {
                setSelectedValues(prev => ({ ...prev, [key]: value }));
                setCustomValues(prev => {
                  const next = { ...prev };
                  delete next[key];
                  return next;
                });
              }
            }}
          >
            {group.variations.map((variation) => (
              <div key={variation.value} className="flex items-center space-x-3">
                <RadioGroupItem value={variation.value} id={`${key}_${variation.value}`} />
                <Label 
                  htmlFor={`${key}_${variation.value}`}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span className={variation.value === group.variations[0].value ? 'font-semibold' : ''}>
                    {variation.value}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {variation.count} {variation.count === 1 ? 'imóvel' : 'imóveis'}
                  </Badge>
                  {variation.value === group.variations[0].value && (
                    <Badge className="bg-green-600 text-xs">Sugerido</Badge>
                  )}
                </Label>
              </div>
            ))}
            
            {/* Opção personalizada */}
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="custom" id={`${key}_custom`} />
              <Label htmlFor={`${key}_custom`} className="cursor-pointer">
                Outro nome:
              </Label>
              <Input
                className="flex-1 max-w-xs"
                placeholder="Digite o nome correto"
                value={customValues[key] || ''}
                onChange={(e) => {
                  setCustomValues(prev => ({ ...prev, [key]: e.target.value }));
                  setSelectedValues(prev => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                }}
                onFocus={() => {
                  setSelectedValues(prev => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                }}
              />
            </div>
          </RadioGroup>

          <Button
            onClick={() => handleMerge(type, group)}
            disabled={merging === key || (!selectedValues[key] && !customValues[key])}
            className="w-full"
          >
            {merging === key ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mesclando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Mesclar para "{customValues[key] || selectedValues[key] || '...'}"
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasIssues = cityGroups.length > 0 || neighborhoodGroups.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Normalização de Localizações
          </h3>
          <p className="text-sm text-muted-foreground">
            Identifique e corrija cidades e bairros escritos de formas diferentes
          </p>
        </div>
        <Button variant="outline" onClick={fetchLocations} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {!hasIssues ? (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="py-8 text-center">
            <Check className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Tudo certo!
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              Não foram encontradas cidades ou bairros duplicados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cidades duplicadas */}
          {cityGroups.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-amber-700 dark:text-amber-300">
                🏙️ Cidades com Variações ({cityGroups.length})
              </h4>
              <div className="grid gap-4">
                {cityGroups.map(group => renderGroup('city', group))}
              </div>
            </div>
          )}

          {/* Bairros duplicados */}
          {neighborhoodGroups.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-amber-700 dark:text-amber-300">
                🏘️ Bairros com Variações ({neighborhoodGroups.length})
              </h4>
              <div className="grid gap-4">
                {neighborhoodGroups.map(group => renderGroup('neighborhood', group))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocationNormalizer;
