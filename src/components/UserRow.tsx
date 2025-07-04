
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserActions } from "@/components/UserManagementActions";

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
}

interface UserRowProps {
  user: User;
  updatingUserId: string | null;
  onRoleChange: (user: User, value: "user" | "corretor" | "admin") => void;
  onUserUpdated: () => void;
  onUserDeleted: (userId: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user, updatingUserId, onRoleChange, onUserUpdated, onUserDeleted
}) => (
  <tr className="border-b hover:bg-gray-50 dark:hover:bg-slate-700">
    <td className="p-4">
      <div>
        <div className="font-medium">{user.full_name}</div>
      </div>
    </td>
    <td className="p-4">{user.email}</td>
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
