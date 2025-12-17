import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Building2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useTenantContext } from '@/contexts/TenantContext';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string;
  company: string;
  role: string;
}

const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTenant, selectedTenantId } = useTenantContext();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;

  useEffect(() => {
    fetchTeamMembers();
  }, [effectiveTenantId]);

  const fetchTeamMembers = async () => {
    if (!effectiveTenantId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, bio, avatar_url, company, role')
        .eq('tenant_id', effectiveTenantId)
        .in('role', ['admin', 'corretor'])
        .order('full_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'corretor': 'Corretor',
      'master': 'Diretor'
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'corretor': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'master': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Nossa Equipe</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Conheça os profissionais dedicados a encontrar o imóvel ideal para você
          </p>
        </div>

        {/* Team Grid */}
        {teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Nenhum membro da equipe encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {member.full_name || 'Nome não informado'}
                  </h3>
                  <Badge className={`mb-4 ${getRoleBadgeColor(member.role)}`}>
                    {getRoleLabel(member.role)}
                  </Badge>
                  
                  {member.bio && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {member.bio}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    {member.company && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{member.company}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${member.phone}`} className="hover:text-blue-600 transition-colors">
                          {member.phone}
                        </a>
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${member.email}`} className="hover:text-blue-600 transition-colors truncate">
                          {member.email}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Team;