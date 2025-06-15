
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
  type?: 'text' | 'image' | 'select';
  options?: { label: string; value: string }[];
  help?: string;
};

const SITE_SETTINGS: SiteSetting[] = [
  // Textos Institucionais
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
    key: 'home_banner_image',
    label: 'Imagem do Banner Principal (URL)',
    placeholder: 'URL da imagem do banner',
    type: 'image',
    help: 'Cole a URL de uma imagem hospedada ou peça para ativar upload futuramente 😉',
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
  },
  {
    key: 'about_section_image',
    label: 'Imagem da Seção Sobre (URL)',
    placeholder: 'URL da imagem da seção sobre',
    type: 'image',
    help: 'Cole a URL de uma imagem hospedada',
  },
  {
    key: 'home_layout',
    label: 'Modelo Visual da Home',
    type: 'select',
    options: [
      { label: 'Modelo Clássico', value: 'modelo1' },
      { label: 'Banner Grande', value: 'modelo2' },
      { label: 'Com Destaques Laterais', value: 'modelo3' },
      { label: 'Hero Texto Central', value: 'modelo4' },
    ],
    help: 'Escolha o visual principal da página HOME. Novos modelos podem ser implementados sob demanda.',
  },
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
        ? "As configurações foram atualizadas."
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
            <CardTitle>Editar Configurações Globais do Site</CardTitle>
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
                  {setting.type === 'select' ? (
                    <select
                      id={setting.key}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      value={values[setting.key] || ''}
                      onChange={e => handleChange(setting.key, e.target.value)}
                    >
                      {setting.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={setting.key}
                      type={setting.type === 'image' ? 'url' : 'text'}
                      value={values[setting.key] || ''}
                      onChange={e => handleChange(setting.key, e.target.value)}
                      placeholder={setting.placeholder}
                    />
                  )}
                  {setting.help && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{setting.help}</div>
                  )}
                  {/* Preview da imagem */}
                  {setting.type === 'image' && values[setting.key] && (
                    <img
                      src={values[setting.key]}
                      alt={`Preview ${setting.label}`}
                      className="h-28 rounded shadow mb-2 mt-1 object-cover"
                    />
                  )}
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
