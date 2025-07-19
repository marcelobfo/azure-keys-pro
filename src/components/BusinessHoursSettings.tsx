
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const BusinessHoursSettings = () => {
  const { toast } = useToast();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
  ];

  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const hour = i.toString().padStart(2, '0');
      const minute = j.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_of_week');

      if (error) throw error;

      // Criar array completo com todos os dias da semana
      const fullWeek = days.map(day => {
        const existing = data?.find(h => h.day_of_week === day.value);
        return existing || {
          day_of_week: day.value,
          start_time: '08:00',
          end_time: '18:00',
          is_active: day.value >= 1 && day.value <= 5 // Segunda a sexta ativo por padrão
        };
      });

      setBusinessHours(fullWeek);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar horários comerciais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessHour = (dayOfWeek: number, field: string, value: any) => {
    setBusinessHours(prev => 
      prev.map(hour => 
        hour.day_of_week === dayOfWeek 
          ? { ...hour, [field]: value }
          : hour
      )
    );
  };

  const saveBusinessHours = async () => {
    setSaving(true);
    try {
      // Primeiro, deletar horários existentes
      await supabase
        .from('business_hours')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Inserir novos horários
      const hoursToInsert = businessHours.map(({ id, ...hour }) => hour);
      
      const { error } = await supabase
        .from('business_hours')
        .insert(hoursToInsert);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Horários comerciais salvos com sucesso",
      });

      await fetchBusinessHours(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar horários comerciais",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários Comerciais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {days.map(day => {
          const hour = businessHours.find(h => h.day_of_week === day.value);
          if (!hour) return null;

          return (
            <div key={day.value} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-32">
                <Label className="font-medium">{day.label}</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={hour.is_active}
                  onCheckedChange={(checked) => updateBusinessHour(day.value, 'is_active', checked)}
                />
                <Label className="text-sm">Ativo</Label>
              </div>

              {hour.is_active && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Das:</Label>
                    <Select
                      value={hour.start_time}
                      onValueChange={(value) => updateBusinessHour(day.value, 'start_time', value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Às:</Label>
                    <Select
                      value={hour.end_time}
                      onValueChange={(value) => updateBusinessHour(day.value, 'end_time', value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <Button onClick={saveBusinessHours} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Horários Comerciais'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BusinessHoursSettings;
