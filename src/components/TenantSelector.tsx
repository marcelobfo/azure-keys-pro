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
  const { isSuperAdmin } = useRoles();
  const { selectedTenant, allTenants, setSelectedTenant, isGlobalView, loading } = useTenant();

  // Only show for super admins
  if (!isSuperAdmin) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md animate-pulse">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const currentValue = isGlobalView ? 'all' : (selectedTenant?.id || 'all');

  return (
    <div className="flex items-center gap-2">
      <Select value={currentValue} onValueChange={setSelectedTenant}>
        <SelectTrigger className="w-[220px] bg-background border-border">
          <div className="flex items-center gap-2">
            {isGlobalView ? (
              <Globe className="w-4 h-4 text-primary" />
            ) : (
              <Building2 className="w-4 h-4 text-primary" />
            )}
            <SelectValue placeholder="Selecionar Tenant">
              {isGlobalView ? 'Todos os Tenants' : selectedTenant?.name}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
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
