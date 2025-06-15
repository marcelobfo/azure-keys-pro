
import React from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { VisitFormData } from '@/utils/visitFormValidation';

interface VisitFormProps {
  formData: VisitFormData;
  onFieldChange: (field: keyof VisitFormData, value: string) => void;
  loading: boolean;
}

const VisitForm: React.FC<VisitFormProps> = ({ formData, onFieldChange, loading }) => {
  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="client_name">Nome Completo *</Label>
        <Input
          id="client_name"
          value={formData.client_name}
          onChange={(e) => onFieldChange('client_name', e.target.value)}
          placeholder="Seu nome completo"
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="client_email">E-mail *</Label>
        <Input
          id="client_email"
          type="email"
          value={formData.client_email}
          onChange={(e) => onFieldChange('client_email', e.target.value)}
          placeholder="seu@email.com"
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="client_phone">Telefone *</Label>
        <Input
          id="client_phone"
          value={formData.client_phone}
          onChange={(e) => onFieldChange('client_phone', e.target.value)}
          placeholder="(11) 99999-9999"
          required
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="visit_date">Data da Visita *</Label>
          <Input
            id="visit_date"
            type="date"
            value={formData.visit_date}
            onChange={(e) => onFieldChange('visit_date', e.target.value)}
            min={today}
            required
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="visit_time">Horário *</Label>
          <Input
            id="visit_time"
            type="time"
            value={formData.visit_time}
            onChange={(e) => onFieldChange('visit_time', e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Alguma preferência de horário ou observação..."
          rows={3}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default VisitForm;
