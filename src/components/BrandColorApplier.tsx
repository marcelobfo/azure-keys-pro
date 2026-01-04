import { useBrandColors } from '@/hooks/useBrandColors';

/**
 * Componente invisível que aplica as cores da marca do tenant automaticamente.
 * Deve ser colocado no nível raiz da aplicação, dentro do TenantProvider e ThemeProvider.
 */
const BrandColorApplier = () => {
  useBrandColors();
  return null;
};

export default BrandColorApplier;
