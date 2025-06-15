
export interface VisitFormData {
  client_name: string;
  client_email: string;
  client_phone: string;
  visit_date: string;
  visit_time: string;
  notes: string;
}

export const validateVisitForm = (formData: VisitFormData): string | null => {
  if (!formData.client_name.trim() || !formData.client_email.trim() || !formData.visit_date || !formData.visit_time) {
    return "Nome, email, data e horário são obrigatórios.";
  }
  return null;
};

export const createVisitData = (formData: VisitFormData, propertyId: string) => ({
  property_id: propertyId,
  client_name: formData.client_name.trim(),
  client_email: formData.client_email.trim(),
  client_phone: formData.client_phone.trim(),
  visit_date: formData.visit_date,
  visit_time: formData.visit_time,
  notes: formData.notes.trim() || null,
  status: 'scheduled'
});
