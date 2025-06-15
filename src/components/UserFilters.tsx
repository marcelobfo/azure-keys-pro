
import React from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm, setSearchTerm, roleFilter, setRoleFilter
}) => (
  <div className="flex items-center space-x-4">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder="Buscar usuários..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="pl-10 w-64"
      />
    </div>
    <Select value={roleFilter} onValueChange={setRoleFilter}>
      <SelectTrigger className="w-40">
        <Filter className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Filtrar por role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="corretor">Corretor</SelectItem>
        <SelectItem value="user">Usuário</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export default UserFilters;
