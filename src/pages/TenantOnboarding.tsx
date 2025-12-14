import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ChevronLeft, ChevronRight, Building2, Palette, Phone, Layout, Settings } from 'lucide-react';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { StepBasicInfo } from '@/components/onboarding/StepBasicInfo';
import { StepBranding } from '@/components/onboarding/StepBranding';
import { StepContact } from '@/components/onboarding/StepContact';
import { StepHomepage } from '@/components/onboarding/StepHomepage';
import { StepFeatures } from '@/components/onboarding/StepFeatures';
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete';

interface OnboardingState {
  basicInfo: {
    site_name: string;
    site_title: string;
    site_description: string;
    site_favicon_url: string;
  };
  branding: {
    header_logo_light: string;
    header_logo_dark: string;
    footer_logo: string;
    logo_size_header: number;
    logo_size_footer: number;
  };
  contact: {
    footer_email: string;
    footer_phone: string;
    footer_address: string;
    footer_whatsapp: string;
    footer_instagram: string;
    footer_facebook: string;
    contact_hours: string;
  };
  homepage: {
    home_layout: string;
    home_banner_title: string;
    home_banner_subtitle: string;
    home_banner_button: string;
    home_banner_image: string;
  };
  features: {
    chat_enabled: boolean;
    leads_enabled: boolean;
    olx_enabled: boolean;
    commissions_enabled: boolean;
    whatsapp_enabled: boolean;
    max_users: number;
    max_properties: number;
  };
}

const STEPS = [
  { title: 'Básico', icon: <Building2 className="w-4 h-4" /> },
  { title: 'Branding', icon: <Palette className="w-4 h-4" /> },
  { title: 'Contato', icon: <Phone className="w-4 h-4" /> },
  { title: 'Página', icon: <Layout className="w-4 h-4" /> },
  { title: 'Recursos', icon: <Settings className="w-4 h-4" /> },
];

const TenantOnboarding = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');

  const [state, setState] = useState<OnboardingState>({
    basicInfo: {
      site_name: '',
      site_title: '',
      site_description: '',
      site_favicon_url: '',
    },
    branding: {
      header_logo_light: '',
      header_logo_dark: '',
      footer_logo: '',
      logo_size_header: 40,
      logo_size_footer: 80,
    },
    contact: {
      footer_email: '',
      footer_phone: '',
      footer_address: '',
      footer_whatsapp: '',
      footer_instagram: '',
      footer_facebook: '',
      contact_hours: '',
    },
    homepage: {
      home_layout: 'classic',
      home_banner_title: '',
      home_banner_subtitle: '',
      home_banner_button: 'Ver Imóveis',
      home_banner_image: '',
    },
    features: {
      chat_enabled: true,
      leads_enabled: true,
      olx_enabled: false,
      commissions_enabled: true,
      whatsapp_enabled: false,
      max_users: 10,
      max_properties: 100,
    },
  });

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!isSuperAdmin) {
        toast({
          title: 'Acesso negado',
          description: 'Apenas super admins podem configurar tenants',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      if (tenantId) {
        loadTenantData();
      }
    }
  }, [authLoading, rolesLoading, user, isSuperAdmin, tenantId]);

  const loadTenantData = async () => {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('name, slug')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      setTenantName(tenant.name);
      setTenantSlug(tenant.slug);
      setState((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          site_name: tenant.name,
          site_title: `${tenant.name} - Imóveis`,
        },
        homepage: {
          ...prev.homepage,
          home_banner_title: `Bem-vindo à ${tenant.name}`,
          home_banner_subtitle: 'Encontre o imóvel dos seus sonhos',
        },
      }));
    } catch (error) {
      console.error('Error loading tenant:', error);
      toast({
        title: 'Erro ao carregar tenant',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStep = async () => {
    setSaving(true);
    try {
      // Prepare site_settings based on current step
      let settingsToSave: { key: string; value: string; tenant_id: string }[] = [];

      if (currentStep === 1) {
        settingsToSave = Object.entries(state.basicInfo).map(([key, value]) => ({
          key,
          value: String(value),
          tenant_id: tenantId!,
        }));
      } else if (currentStep === 2) {
        settingsToSave = Object.entries(state.branding).map(([key, value]) => ({
          key,
          value: String(value),
          tenant_id: tenantId!,
        }));
      } else if (currentStep === 3) {
        settingsToSave = Object.entries(state.contact).map(([key, value]) => ({
          key,
          value: String(value),
          tenant_id: tenantId!,
        }));
      } else if (currentStep === 4) {
        settingsToSave = Object.entries(state.homepage).map(([key, value]) => ({
          key,
          value: String(value),
          tenant_id: tenantId!,
        }));
      } else if (currentStep === 5) {
        // Save features to tenant_features table
        const { error: featuresError } = await supabase
          .from('tenant_features')
          .upsert({
            tenant_id: tenantId!,
            chat_enabled: state.features.chat_enabled,
            leads_enabled: state.features.leads_enabled,
            olx_enabled: state.features.olx_enabled,
            commissions_enabled: state.features.commissions_enabled,
            whatsapp_enabled: state.features.whatsapp_enabled,
            max_users: state.features.max_users,
            max_properties: state.features.max_properties,
          }, { onConflict: 'tenant_id' });

        if (featuresError) throw featuresError;
      }

      // Save site_settings
      if (settingsToSave.length > 0) {
        for (const setting of settingsToSave) {
          const { error } = await supabase
            .from('site_settings')
            .upsert(setting, { onConflict: 'tenant_id,key', ignoreDuplicates: false });
          
          if (error) {
            // Try update if upsert fails
            await supabase
              .from('site_settings')
              .update({ value: setting.value })
              .eq('tenant_id', setting.tenant_id)
              .eq('key', setting.key);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const saved = await saveStep();
    if (saved) {
      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setIsComplete(true);
        toast({
          title: 'Configuração salva!',
          description: 'O tenant foi configurado com sucesso.',
        });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (authLoading || rolesLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <OnboardingComplete tenantName={tenantName} tenantSlug={tenantSlug} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Configurar {tenantName}</h1>
          <p className="text-muted-foreground mt-2">
            Passo {currentStep} de 5
          </p>
        </div>

        <OnboardingProgress currentStep={currentStep} totalSteps={5} steps={STEPS} />

        <Card className="mt-8">
          <CardContent className="pt-6">
            {currentStep === 1 && (
              <StepBasicInfo
                data={state.basicInfo}
                onChange={(data) => setState((prev) => ({ ...prev, basicInfo: data }))}
              />
            )}
            {currentStep === 2 && (
              <StepBranding
                data={state.branding}
                onChange={(data) => setState((prev) => ({ ...prev, branding: data }))}
              />
            )}
            {currentStep === 3 && (
              <StepContact
                data={state.contact}
                onChange={(data) => setState((prev) => ({ ...prev, contact: data }))}
              />
            )}
            {currentStep === 4 && (
              <StepHomepage
                data={state.homepage}
                onChange={(data) => setState((prev) => ({ ...prev, homepage: data }))}
              />
            )}
            {currentStep === 5 && (
              <StepFeatures
                data={state.features}
                onChange={(data) => setState((prev) => ({ ...prev, features: data }))}
              />
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || saving}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <Button onClick={handleNext} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : currentStep === 5 ? (
                  'Concluir'
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantOnboarding;
