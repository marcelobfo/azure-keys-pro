
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

const ScheduleVisit = () => {
  const { propertyId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<{ id: string; title: string }[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(propertyId || null);

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    visit_date: '',
    visit_time: '',
    notes: '',
  });

  // Buscar propriedades disponíveis para seleção
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        let query = supabase.from('properties').select('id, title');
        // Se usuário for admin, pega todas, senão só as do usuário
        if (user?.role !== 'admin') {
          query = query.eq('user_id', user?.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        setProperties(data || []);
        if (!selectedPropertyId && data && data.length > 0) {
          setSelectedPropertyId(data[0].id);
        }
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar imóveis, tente novamente.',
          variant: 'destructive',
        });
      }
    };
    if (user) fetchProperties();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast({ title: "Selecione um imóvel para agendar a visita.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('visits').insert({
        property_id: selectedPropertyId,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        visit_date: formData.visit_date,
        visit_time: formData.visit_time,
        notes: formData.notes,
      });
      if (error) throw error;
      toast({
        title: "Sucesso!",
        description: "Visita agendada com sucesso.",
      });
      navigate('/visits-management');
    } catch (err: any) {
      toast({
        title: "Erro ao agendar visita",
        description: err?.message || '',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Agendar Visita</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Dropdown de imóveis */}
              <div>
                <Label>Imóvel *</Label>
                <Select
                  value={selectedPropertyId ?? ""}
                  onValueChange={setSelectedPropertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o imóvel" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="client_name">Nome *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={e => handleChange('client_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="client_email">E-mail *</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={e => handleChange('client_email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="client_phone">Telefone *</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={e => handleChange('client_phone', e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="visit_date">Data *</Label>
                  <Input
                    id="visit_date"
                    type="date"
                    value={formData.visit_date}
                    onChange={e => handleChange('visit_date', e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="visit_time">Horário *</Label>
                  <Input
                    id="visit_time"
                    type="time"
                    value={formData.visit_time}
                    onChange={e => handleChange('visit_time', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !selectedPropertyId}>
                {loading ? 'Agendando...' : 'Agendar Visita'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ScheduleVisit;
