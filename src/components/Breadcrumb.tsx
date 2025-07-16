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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <nav className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-6 overflow-x-auto">
      <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
            )}
            {item.current ? (
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-[100px] md:max-w-xs" title={item.label}>
                {truncateText(item.label, window.innerWidth < 768 ? 20 : 50)}
              </span>
            ) : (
              <Link 
                to={item.href || '#'}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center min-w-0"
                title={item.label}
              >
                {index === 0 && <Home className="w-3 h-3 md:w-4 md:h-4 mr-1 flex-shrink-0" />}
                <span className="truncate max-w-[80px] md:max-w-none">
                  {truncateText(item.label, window.innerWidth < 768 ? 15 : 30)}
                </span>
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumb;