import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Contact = () => {
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação frontend
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast({
        title: "Erro de validação",
        description: "Nome deve ter pelo menos 2 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      toast({
        title: "Erro de validação",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Erro de validação",
        description: "A mensagem é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Usar edge function para bypasser RLS
      const { data, error } = await supabase.functions.invoke('insert-lead', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          message: formData.message.trim(),
          status: 'new'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      let errorMessage = "Erro interno do servidor. Tente novamente.";
      if (error.message.includes('Email inválido')) {
        errorMessage = "Por favor, verifique o formato do seu email.";
      } else if (error.message.includes('Nome deve ter pelo menos')) {
        errorMessage = "Nome deve ter pelo menos 2 caracteres.";
      }
      
      toast({
        title: "Erro ao enviar mensagem",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Entre em Contato
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Estamos aqui para ajudar você a encontrar o imóvel perfeito
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Envie uma Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      placeholder="Como podemos ajudar você?"
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.contact_address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium">Endereço</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                        {settings.contact_address}
                      </p>
                    </div>
                  </div>
                )}

                {settings.contact_phone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium">Telefone</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {settings.contact_phone.split('|').map((phone, idx) => (
                          <p key={idx}>{phone.trim()}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {settings.contact_email && (
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium">E-mail</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {settings.contact_email.split('|').map((email, idx) => (
                          <p key={idx}>{email.trim()}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {settings.contact_hours && (
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium">Horário de Funcionamento</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                        {settings.contact_hours}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {settings.contact_map_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Localização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="aspect-video rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: settings.contact_map_url }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
