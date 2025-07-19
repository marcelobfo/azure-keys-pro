import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AttendantDashboard from '@/components/AttendantDashboard';

const AttendantChat = () => {
  return (
    <DashboardLayout title="Chat - Atendimento" userRole="admin">
      <AttendantDashboard />
    </DashboardLayout>
  );
};

export default AttendantChat;