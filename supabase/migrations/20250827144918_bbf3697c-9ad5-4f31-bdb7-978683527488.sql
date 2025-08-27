-- Create trigger for auto-generating protocol numbers on support_tickets
CREATE TRIGGER support_tickets_auto_protocol_trigger
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_protocol();