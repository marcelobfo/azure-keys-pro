
import { useState } from 'react';
import { VisitFormData } from '@/utils/visitFormValidation';

export const useVisitForm = () => {
  const [formData, setFormData] = useState<VisitFormData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    visit_date: '',
    visit_time: '',
    notes: ''
  });

  const handleChange = (field: keyof VisitFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_email: '',
      client_phone: '',
      visit_date: '',
      visit_time: '',
      notes: ''
    });
  };

  return {
    formData,
    handleChange,
    resetForm
  };
};
