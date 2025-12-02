
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import UserDashboard from './UserDashboard';
import CorretorDashboard from './CorretorDashboard';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" userRole="user">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render dashboard based on user role
  switch (profile?.role) {
    case 'admin':
    case 'master':
      return <AdminDashboard />;
    case 'corretor':
      return <CorretorDashboard />;
    default:
      return <UserDashboard />;
  }
};

export default Dashboard;
