import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle, Clock } from 'lucide-react';

interface ContactData {
  footer_email: string;
  footer_phone: string;
  footer_address: string;
  footer_whatsapp: string;
  footer_instagram: string;
  footer_facebook: string;
  contact_hours: string;
}

interface StepContactProps {
  data: ContactData;
  onChange: (data: ContactData) => void;
}

export const StepContact = ({ data, onChange }: StepContactProps) => {
  const handleChange = (field: keyof ContactData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Informações de Contato</h2>
        <p className="text-muted-foreground mt-2">
          Como seus clientes podem entrar em contato
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="footer_email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Email
          </Label>
          <Input
            id="footer_email"
            type="email"
            value={data.footer_email}
            onChange={(e) => handleChange('footer_email', e.target.value)}
            placeholder="contato@suaimobiliaria.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer_phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> Telefone
          </Label>
          <Input
            id="footer_phone"
            value={data.footer_phone}
            onChange={(e) => handleChange('footer_phone', e.target.value)}
            placeholder="(00) 0000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer_whatsapp" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </Label>
          <Input
            id="footer_whatsapp"
            value={data.footer_whatsapp}
            onChange={(e) => handleChange('footer_whatsapp', e.target.value)}
            placeholder="5500000000000"
          />
          <p className="text-xs text-muted-foreground">
            Formato: código do país + DDD + número (sem espaços)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> Horário de Atendimento
          </Label>
          <Input
            id="contact_hours"
            value={data.contact_hours}
            onChange={(e) => handleChange('contact_hours', e.target.value)}
            placeholder="Seg-Sex: 9h às 18h"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="footer_address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Endereço
          </Label>
          <Textarea
            id="footer_address"
            value={data.footer_address}
            onChange={(e) => handleChange('footer_address', e.target.value)}
            placeholder="Rua Exemplo, 123 - Centro, Cidade - Estado"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer_instagram" className="flex items-center gap-2">
            <Instagram className="w-4 h-4" /> Instagram
          </Label>
          <Input
            id="footer_instagram"
            value={data.footer_instagram}
            onChange={(e) => handleChange('footer_instagram', e.target.value)}
            placeholder="https://instagram.com/suaimobiliaria"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer_facebook" className="flex items-center gap-2">
            <Facebook className="w-4 h-4" /> Facebook
          </Label>
          <Input
            id="footer_facebook"
            value={data.footer_facebook}
            onChange={(e) => handleChange('footer_facebook', e.target.value)}
            placeholder="https://facebook.com/suaimobiliaria"
          />
        </div>
      </div>
    </div>
  );
};
