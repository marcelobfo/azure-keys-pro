import { useTenantContext } from '@/contexts/TenantContext';

export const useTenant = () => {
  return useTenantContext();
};
