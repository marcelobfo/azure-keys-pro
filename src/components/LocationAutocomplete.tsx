import React, { useState, useEffect, useRef } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface LocationAutocompleteProps {
  type: 'city' | 'neighborhood';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tenantId?: string | null;
  cityFilter?: string; // Para filtrar bairros por cidade
  disabled?: boolean;
}

// Função para normalizar nomes de localização
const normalizeLocationName = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim()
    .split(' ')
    .map(word => {
      // Palavras que devem permanecer minúsculas
      const lowerWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'em'];
      const lowerWord = word.toLowerCase();
      if (lowerWords.includes(lowerWord)) {
        return lowerWord;
      }
      // Capitalizar primeira letra
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  type,
  value,
  onChange,
  placeholder,
  tenantId,
  cityFilter,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = type === 'city' ? 'Digite ou selecione a cidade' : 'Digite ou selecione o bairro';

  // Buscar sugestões do banco
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const column = type === 'city' ? 'city' : 'neighborhood';
        
        let query = supabase
          .from('properties')
          .select(column)
          .eq('status', 'active')
          .not(column, 'is', null);

        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
        }

        // Para bairros, filtrar pela cidade selecionada
        if (type === 'neighborhood' && cityFilter) {
          query = query.ilike('city', cityFilter);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Erro ao buscar sugestões:', error);
          return;
        }

        if (data) {
          // Extrair valores únicos e normalizar
          const uniqueValues = [...new Set(
            data
              .map(item => (item as any)[column])
              .filter(Boolean)
              .map((val: string) => normalizeLocationName(val))
          )].sort();
          
          setSuggestions(uniqueValues);
        }
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [type, tenantId, cityFilter]);

  // Sincronizar valor externo
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    const normalized = normalizeLocationName(selectedValue);
    setInputValue(normalized);
    onChange(normalized);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  const handleAddNew = () => {
    if (inputValue.trim()) {
      const normalized = normalizeLocationName(inputValue.trim());
      onChange(normalized);
      setOpen(false);
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showAddOption = inputValue.trim() && 
    !filteredSuggestions.some(s => s.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal bg-background hover:bg-background"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || placeholder || defaultPlaceholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover border shadow-lg z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            ref={inputRef}
            placeholder={`Buscar ${type === 'city' ? 'cidade' : 'bairro'}...`}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <>
                {filteredSuggestions.length === 0 && !showAddOption && (
                  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                )}
                
                {showAddOption && (
                  <CommandGroup heading="Adicionar novo">
                    <CommandItem
                      value={`add-${inputValue}`}
                      onSelect={handleAddNew}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar "{normalizeLocationName(inputValue.trim())}"
                    </CommandItem>
                  </CommandGroup>
                )}
                
                {filteredSuggestions.length > 0 && (
                  <CommandGroup heading={type === 'city' ? 'Cidades' : 'Bairros'}>
                    {filteredSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        value={suggestion}
                        onSelect={() => handleSelect(suggestion)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === suggestion ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {suggestion}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default LocationAutocomplete;
