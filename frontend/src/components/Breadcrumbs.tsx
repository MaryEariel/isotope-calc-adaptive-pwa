// src/components/Breadcrumbs.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumb } from 'react-bootstrap';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbNameMap: { [key: string]: string } = {
    'isotopes': 'Изотопы',
  };

  // Форматирование для длинных названий
  const formatBreadcrumbName = (name: string): string => {
    const displayName = breadcrumbNameMap[name] || name;
    
    // На мобильных сокращаем длинные имена
    if (window.innerWidth <= 768 && displayName.length > 15) {
      return displayName.substring(0, 12) + '...';
    }
    
    return displayName;
  };

  // Пропускаем хлебные крошки для главной страницы
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <div className="breadcrumbs-container" style={{ padding: '0 20px', margin: '20px 0' }}>
      <Breadcrumb className="breadcrumb-custom">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          <i className="fas fa-home me-1"></i>
          <span className="breadcrumb-text">Главная</span>
        </Breadcrumb.Item>
        
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const breadcrumbName = formatBreadcrumbName(name);
          
          return isLast ? (
            <Breadcrumb.Item active key={name}>
              <span className="breadcrumb-text">{breadcrumbName}</span>
            </Breadcrumb.Item>
          ) : (
            <Breadcrumb.Item 
              linkAs={Link} 
              linkProps={{ to: routeTo }}
              key={name}
            >
              <span className="breadcrumb-text">{breadcrumbName}</span>
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>
    </div>
  );
};

export default Breadcrumbs;