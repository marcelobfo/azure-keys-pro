import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  property?: {
    title: string;
    city: string;
    property_type: string;
    slug?: string;
  };
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, property }) => {
  const location = useLocation();
  
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    if (items) return items;
    
    const breadcrumbItems: BreadcrumbItem[] = [
      { label: 'Início', href: '/' }
    ];
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments[0] === 'imoveis' || pathSegments[0] === 'properties') {
      breadcrumbItems.push({ label: 'Imóveis', href: '/imoveis' });
      
      if (pathSegments[1] === 'destaque') {
        breadcrumbItems.push({ label: 'Destaques', href: '/imoveis/destaque' });
      } else if (pathSegments[1] === 'frente-mar') {
        breadcrumbItems.push({ label: 'Frente para o Mar', href: '/imoveis/frente-mar' });
      } else if (pathSegments[1] === 'quadra-mar') {
        breadcrumbItems.push({ label: 'Quadra Mar', href: '/imoveis/quadra-mar' });
      } else if (pathSegments[1] === 'empreendimentos') {
        breadcrumbItems.push({ label: 'Empreendimentos', href: '/imoveis/empreendimentos' });
      }
    } else if (pathSegments[0] === 'imovel' && property) {
      breadcrumbItems.push({ label: 'Imóveis', href: '/imoveis' });
      breadcrumbItems.push({ 
        label: property.city, 
        href: `/imoveis?city=${encodeURIComponent(property.city)}` 
      });
      breadcrumbItems.push({ 
        label: property.property_type, 
        href: `/imoveis?city=${encodeURIComponent(property.city)}&type=${encodeURIComponent(property.property_type)}` 
      });
      breadcrumbItems.push({ 
        label: property.title, 
        current: true 
      });
    }
    
    return breadcrumbItems;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          {item.current ? (
            <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
              {item.label}
            </span>
          ) : (
            <Link 
              to={item.href || '#'}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
            >
              {index === 0 && <Home className="w-4 h-4 mr-1" />}
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;