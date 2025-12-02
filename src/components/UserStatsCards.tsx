
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface UserStatsCardsProps {
  users: {
    role: "user" | "corretor" | "admin" | "master";
  }[];
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({ users }) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
    <Card>
      <CardContent className="p-6">
        <div className="text-2xl font-bold">{users.length}</div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Total de Usuários</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-6">
        <div className="text-2xl font-bold">{users.filter(u => u.role === 'master').length}</div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Masters</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-6">
        <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Administradores</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-6">
        <div className="text-2xl font-bold">{users.filter(u => u.role === 'corretor').length}</div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Corretores</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-6">
        <div className="text-2xl font-bold">{users.filter(u => u.role === 'user').length}</div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Usuários</p>
      </CardContent>
    </Card>
  </div>
);

export default UserStatsCards;
