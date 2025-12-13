import React from 'react';
import { useParams } from 'react-router-dom';
import Home from '@/pages/Home';

// Wrapper component for tenant-specific home page
const TenantIndex: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  
  // The TenantContext will automatically detect the tenant from the URL
  // and filter all data accordingly
  return <Home />;
};

export default TenantIndex;
