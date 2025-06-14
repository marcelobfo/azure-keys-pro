
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SiteSetting = {
  key: string;
  label: string;
  placeholder?: string;
};

const SITE_SETTINGS: SiteSetting[] = [
  {
    key: 'home_banner_title',
    label: 'Título do Banner Principal da Home',
    placeholder: 'Ex: Encontre seu imóvel dos sonhos',
  },
  {
    key: 'home_banner_subtitle',
    label: 'Subtítulo do Banner (Primeira Dobra)',
    placeholder: 'Ex: As melhores oportunidades do litoral esperam por você',
  },
  {
    key: 'home_banner_button',
    label: 'Texto do Botão do Banner',
    placeholder: 'Ex: Ver Imóveis',
  },
  {
    key: 'about_section_title',
    label: 'Título da Seção Sobre',
    placeholder: 'Ex: Sobre a Maresia Litoral',
  },
  {
    key: 'about_section_text',
    label: 'Texto da Seção Sobre',
    placeholder: 'Conte sobre a imobiliária',
  }
];

const AdminSiteSettings = () => {
  const { profile, loading } = useProfile();
  const { toast } = useToast();

  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;

    async function fetchSettings() {
      const keys = SITE_SETTINGS.map(s => s.key);
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações.',
          variant: 'destructive'
        });
        return;
      }
      const existing: Record<string, string> = {};
      data?.forEach((item: { key: string; value: string }) => {
        existing[item.key] = item.value || '';
      });
      setValues(existing);
      setIsLoaded(true);
    }

    fetchSettings();
    // eslint-disable-next-line
  }, [profile]);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    let isOk = true;

    for (const setting of SITE_SETTINGS) {
      const { key } = setting;
      const value = values[key] || '';
      // UPSERT o valor
      const { error } = await supabase
        .from('site_settings')
        .upsert([{ key, value, updated_at: new Date().toISOString() }], { onConflict: 'key' });
      if (error) isOk = false;
    }

    setIsSaving(false);
    toast({
      title: isOk ? "Configurações salvas!" : "Erro",
      description: isOk
        ? "Os textos globais foram atualizados."
        : "Alguns campos não foram salvos corretamente.",
      variant: isOk ? "default" : "destructive"
    });
  };

  if (loading || !isLoaded)
    return (
      <DashboardLayout title="Configurações do Sistema" userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );

  if (!profile || profile.role !== 'admin') {
    return (
      <DashboardLayout title="Configurações do Sistema" userRole="user">
        <div className="flex items-center justify-center h-64">
          <Badge variant="destructive">Acesso restrito</Badge>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Configurações do Sistema" userRole="admin">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Editar Textos Globais do Site</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              onSubmit={e => {
                e.preventDefault();
                saveSettings();
              }}>
              {SITE_SETTINGS.map(setting => (
                <div key={setting.key} className="space-y-2">
                  <Label htmlFor={setting.key}>{setting.label}</Label>
                  <Input
                    id={setting.key}
                    value={values[setting.key] || ''}
                    onChange={e => handleChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                  />
                </div>
              ))}
              <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
};

export default AdminSiteSettings;
