
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Novo: Tabs para organizaçao das configurações por página/setor
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const TEMPLATE_PREVIEWS = [
  {
    value: 'modelo1',
    name: 'Modelo Clássico',
    img: 'https://img.lovable-cdn.dev/template-home1.png',
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

// Definição dos campos por aba/página
const HOMEPAGE_SETTINGS = [
  {
    key: 'home_banner_title',
    label: 'Título de Destaque do Banner Principal',
    placeholder: 'Ex: Encontre seu imóvel dos sonhos',
  },
  {
    key: 'home_banner_subtitle',
    label: 'Subtítulo do Banner',
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
    placeholder: 'Cole a URL da imagem',
    type: 'image',
    help: 'Cole a URL de uma imagem hospedada. Upload de imagem em breve!',
  },
  {
    key: 'home_layout',
    label: 'Modelo Visual da Home',
    type: 'custom',
    help: 'Escolha visualmente o layout principal da página HOME.'
  }
];

const FOOTER_FIELDS = [
  {
    key: 'footer_logo',
    label: 'Logo do Site (também aparecerá no cabeçalho)',
    placeholder: 'URL da logo',
    type: 'image',
  },
  {
    key: 'footer_description',
    label: 'Descrição/Texto do rodapé',
    placeholder: 'Breve texto sobre a imobiliária',
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
    label: 'Instagram',
    placeholder: 'https://instagram.com/suaempresa',
  },
  {
    key: 'footer_whatsapp',
    label: 'WhatsApp',
    placeholder: 'https://wa.me/11999999999',
  },
  {
    key: 'footer_facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/suaempresa',
  },
];

const CONTACT_FIELDS = [
  {
    key: 'contact_address',
    label: 'Endereço de Exibição',
    placeholder: 'Rua das Flores, 123, Centro, Cidade - UF, CEP 00000-000',
  },
  {
    key: 'contact_phone',
    label: 'Telefone(s) de Exibição',
    placeholder: '(11) 3456-7890 | (11) 99999-9999',
  },
  {
    key: 'contact_email',
    label: 'E-mail(s) de Exibição',
    placeholder: 'contato@imobiliaria.com | vendas@imobiliaria.com',
  },
  {
    key: 'contact_hours',
    label: 'Horário de Atendimento',
    placeholder: 'Seg a Sex: 8h-18h / Sáb: 8h-12h',
  },
  {
    key: 'contact_map_url',
    label: 'Embed/URL do Mapa (iframe)',
    placeholder: 'Cole o embed do Google Maps (opcional)',
  }
];

const FAVICON_FIELDS = [
  {
    key: 'site_favicon_url',
    label: 'URL do favicon (.png ou .jpg)',
    placeholder: 'https://exemplo.com/favicon.png',
    type: 'image',
    help: 'Indique a URL da imagem PNG/JPG para ser usada como favicon do site. Não suporte .ico no momento.',
  },
];

const ALL_FIELDS = [
  ...HOMEPAGE_SETTINGS.filter(f => f.key !== 'home_layout'),
  ...FOOTER_FIELDS,
  ...CONTACT_FIELDS,
  ...FAVICON_FIELDS,
  // O layout é tratado separadamente (com cards/imagem)
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
      const keys = ALL_FIELDS.map(s => s.key).concat(['home_layout']);
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

    for (const setting of ALL_FIELDS) {
      const { key } = setting;
      const value = values[key] || '';
      const { error } = await supabase
        .from('site_settings')
        .upsert([{ key, value, updated_at: new Date().toISOString() }], { onConflict: 'key' });
      if (error) isOk = false;
    }
    // Salva home_layout também
    if (values['home_layout']) {
      const { error } = await supabase
        .from('site_settings')
        .upsert([{ key: 'home_layout', value: values['home_layout'], updated_at: new Date().toISOString() }], { onConflict: 'key' });
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

    // Se favicon for atualizado e for URL válida, salvar no localStorage e pedir refresh
    if (values['site_favicon_url']) {
      localStorage.setItem('site-favicon', values['site_favicon_url']);
      setTimeout(() => {
        window.location.reload(); // Força update do favicon globalmente
      }, 1000);
    }
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
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Configurações Globais Organizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="home">
              <TabsList className="mb-4 grid grid-cols-4 w-full">
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="footer">Rodapé</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="favicon">Logo e Favicon</TabsTrigger>
              </TabsList>

              {/* HOME TAB */}
              <TabsContent value="home">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}>
                  {HOMEPAGE_SETTINGS.filter(f => f.key !== 'home_layout').map(setting => (
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
                  </div>
                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </TabsContent>

              {/* FOOTER TAB */}
              <TabsContent value="footer">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}
                >
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
                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </TabsContent>

              {/* CONTACT TAB */}
              <TabsContent value="contact">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}
                >
                  {CONTACT_FIELDS.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type="text"
                        value={values[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </TabsContent>

              {/* FAVICON/LOGO TAB */}
              <TabsContent value="favicon">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}
                >
                  {FAVICON_FIELDS.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type="url"
                        value={values[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                      {field.help && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{field.help}</div>
                      )}
                      {values[field.key] && (
                        <img
                          src={values[field.key]}
                          alt="Favicon Preview"
                          className="h-10 w-10 mt-2 rounded-lg bg-white border"
                          style={{ imageRendering: 'pixelated' }}
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
};

export default AdminSiteSettings;

// O arquivo está grande, recomendo fortemente refatorar src/pages/AdminSiteSettings.tsx em arquivos menores após esses ajustes!
