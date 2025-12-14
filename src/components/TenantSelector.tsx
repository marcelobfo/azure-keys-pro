import React from 'react';
import { Building2, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRoles } from '@/hooks/useRoles';
import { useTenant } from '@/hooks/useTenant';

const TenantSelector: React.FC = () => {
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const { selectedTenant, allTenants, setSelectedTenant, isGlobalView, loading: tenantLoading } = useTenant();

  // Determine visibility - don't return null to avoid Portal issues
  const shouldShow = !rolesLoading && isSuperAdmin;
  const isLoading = tenantLoading;
  const currentValue = isGlobalView ? 'all' : (selectedTenant?.id || 'all');

  // Always render a container, but hide it when not needed
  if (!shouldShow) {
    return <div className="hidden" aria-hidden="true" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md animate-pulse">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={currentValue} 
        onValueChange={(value) => setSelectedTenant(value)}
      >
        <SelectTrigger className="w-[220px] bg-background border-border">
          <div className="flex items-center gap-2">
            {isGlobalView ? (
              <Globe className="w-4 h-4 text-primary" />
            ) : (
              <Building2 className="w-4 h-4 text-primary" />
            )}
            <SelectValue placeholder="Selecionar Tenant">
              {isGlobalView ? 'Todos os Tenants' : (selectedTenant?.name || 'Selecionar')}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent 
          className="bg-popover border border-border shadow-lg"
          position="popper"
          sideOffset={4}
        >
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Todos os Tenants</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {allTenants.length}
              </Badge>
            </div>
          </SelectItem>
          
          {allTenants.length > 0 && <Separator className="my-1" />}
          
          {allTenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{tenant.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TenantSelector;
