
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import UserDashboard from './UserDashboard';
import CorretorDashboard from './CorretorDashboard';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Render dashboard based on user role
  switch (profile?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'corretor':
      return <CorretorDashboard />;
    default:
      return <UserDashboard />;
  }
};

export default Dashboard;
