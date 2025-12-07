import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserActions } from "@/components/UserManagementActions";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "corretor" | "admin";
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
  created_at: string;
  status: string;
  tenant_id?: string;
  tenant_name?: string;
}

interface UserRowProps {
  user: User;
  updatingUserId: string | null;
  onRoleChange: (user: User, value: "user" | "corretor" | "admin") => void;
  onUserUpdated: () => void;
  onUserDeleted: (userId: string) => void;
  showTenantColumn?: boolean;
}

const UserRow: React.FC<UserRowProps> = ({
  user, updatingUserId, onRoleChange, onUserUpdated, onUserDeleted, showTenantColumn = false
}) => (
  <tr className="border-b hover:bg-muted/50">
    <td className="p-4">
      <div>
        <div className="font-medium">{user.full_name}</div>
      </div>
    </td>
    <td className="p-4">{user.email}</td>
    {showTenantColumn && (
      <td className="p-4">
        <Badge variant="outline" className="font-normal">
          {user.tenant_name || 'Sem tenant'}
        </Badge>
      </td>
    )}
    <td className="p-4">
      <Select
        value={user.role}
        onValueChange={value => onRoleChange(user, value as "user" | "corretor" | "admin")}
        disabled={updatingUserId === user.id}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Administrador</SelectItem>
          <SelectItem value="corretor">Corretor</SelectItem>
          <SelectItem value="user">Usuário</SelectItem>
        </SelectContent>
      </Select>
    </td>
    <td className="p-4">{user.phone || '-'}</td>
    <td className="p-4">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
    <td className="p-4">
      <UserActions 
        user={user}
        onUserUpdated={onUserUpdated}
        onUserDeleted={onUserDeleted}
      />
    </td>
  </tr>
);

export default UserRow;