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

// Visual preview for templates
const TEMPLATE_PREVIEWS = [
  {
    value: 'modelo1',
    name: 'Modelo Clássico',
    img: 'https://img.lovable-cdn.dev/template-home1.png', // fictitious, swap for a real preview later
    desc: 'Banner + busca central',
  },
  {
    value: 'modelo2',
    name: 'Banner Grande',
    img: 'https://img.lovable-cdn.dev/template-home2.png',
    desc: 'Imagem full e chamada centralizadas',
  },
  {
    value: 'modelo3',
    name: 'Com Destaques Laterais',
    img: 'https://img.lovable-cdn.dev/template-home3.png',
    desc: 'Destaques de imóveis com visual lateral',
  },
  {
    value: 'modelo4',
    name: 'Hero Texto Central',
    img: 'https://img.lovable-cdn.dev/template-home4.png',
    desc: 'Conteúdo com texto centralizado',
  },
];

type SiteSetting = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'image' | 'select' | 'custom';
  options?: { label: string; value: string }[];
  help?: string;
};

// Deixa home_layout como type: 'custom' (será tratado fora)
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
    label: 'Modelo Visual da Home (clique para escolher)',
    type: 'custom',
    help: 'Escolha visualmente o layout principal da página HOME. Novos modelos podem ser implementados sob demanda.',
  },
];

const FOOTER_FIELDS = [
  {
    key: 'footer_logo',
    label: 'Logo do Rodapé (URL)',
    placeholder: 'URL da logo para o rodapé',
    type: 'image',
  },
  {
    key: 'footer_description',
    label: 'Descrição ou texto do rodapé',
    placeholder: 'Breve texto sobre a imobiliária ou site',
  },
  {
    key: 'footer_email',
    label: 'E-mail',
    placeholder: 'contato@exemplo.com',
  },
  {
    key: 'footer_phone',
    label: 'Telefone',
    placeholder: '+55 (00) 99999-9999',
  },
  {
    key: 'footer_address',
    label: 'Endereço',
    placeholder: 'Rua Exemplo, 123 - Cidade/UF',
  },
  {
    key: 'footer_instagram',
    label: 'Instagram (link)',
    placeholder: 'https://instagram.com/suaempresa',
  },
  {
    key: 'footer_whatsapp',
    label: 'WhatsApp (link)',
    placeholder: 'https://wa.me/11999999999',
  },
  {
    key: 'footer_facebook',
    label: 'Facebook (link)',
    placeholder: 'https://facebook.com/suaempresa',
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
              {/* Render all settings exceto home_layout */}
              {SITE_SETTINGS.filter(s => s.key !== 'home_layout').map(setting => (
                <div key={setting.key} className="space-y-2">
                  <Label htmlFor={setting.key}>{setting.label}</Label>
                  <Input
                    id={setting.key}
                    type={setting.type === 'image' ? 'url' : 'text'}
                    value={values[setting.key] || ''}
                    onChange={e => handleChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                  />
                  {setting.help && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{setting.help}</div>
                  )}
                  {/* Preview da imagem */}
                  {setting.type === 'image' && values[setting.key] && (
                    <img
                      src={values[setting.key]}
                      alt={`Preview ${setting.label}`}
                      className="h-28 rounded shadow mb-2 mt-1 object-cover"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                      }}
                    />
                  )}
                </div>
              ))}

              {/* Campos para o rodapé */}
              <div className="border-t pt-6 mt-6">
                <div className="font-bold mb-2">Rodapé</div>
                <div className="space-y-4">
                  {FOOTER_FIELDS.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type={field.type === 'image' ? 'url' : 'text'}
                        value={values[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                      {/* Preview de imagem da logo footer */}
                      {field.type === 'image' && values[field.key] && (
                        <img
                          src={values[field.key]}
                          alt="Logo Rodapé"
                          className="h-16 rounded mb-1 object-contain bg-white"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Seleção visual do template */}
              <div className="space-y-2 mt-8">
                <Label>Modelo Visual da Home</Label>
                <div className="grid grid-cols-2 gap-4">
                  {TEMPLATE_PREVIEWS.map(tmpl => (
                    <div
                      key={tmpl.value}
                      onClick={() => handleChange('home_layout', tmpl.value)}
                      className={`cursor-pointer group rounded-lg border-2 transition-all flex flex-col items-center p-3 ${
                        values['home_layout'] === tmpl.value
                          ? 'border-blue-600 ring-2 ring-blue-400'
                          : 'border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      <img
                        src={tmpl.img}
                        alt={tmpl.name}
                        className="w-full h-24 object-cover rounded-md mb-2 group-hover:scale-105 transition-transform bg-white"
                        draggable={false}
                        style={{ pointerEvents: 'none' }}
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                      <div className="font-semibold text-sm mb-1 text-center">{tmpl.name}</div>
                      <div className="text-xs text-gray-500 mb-1 text-center">{tmpl.desc}</div>
                      {values['home_layout'] === tmpl.value && (
                        <div className="text-xs text-blue-700 font-bold mt-1">Selecionado</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Escolha visualmente como a Home será apresentada no site.
                </div>
              </div>

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
