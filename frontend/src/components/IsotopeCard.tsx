// src/components/IsotopeCard.tsx
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import type { Isotope } from '../services/api';

interface IsotopeCardProps {
  isotope: Isotope;
}

const IsotopeCard: React.FC<IsotopeCardProps> = ({ isotope }) => {
  const defaultImage = 'https://via.placeholder.com/300x200/0B2149/FFFFFF?text=No+Image';

  const getDecayTypeBadge = (decayType: string) => {
    const variants: { [key: string]: string } = {
      'α': 'danger',
      'beta': 'warning',
      'β': 'warning', 
      'γ': 'info',
      'gamma': 'info',
      'β-': 'warning',
      'β+': 'success',
      'electron': 'secondary'
    };
    return variants[decayType.toLowerCase()] || 'secondary';
  };

  const formatHalfLife = (halfLife: number): string => {
    if (halfLife >= 1e9) {
      return `${(halfLife / 1e9).toFixed(2)} млрд лет`;
    } else if (halfLife >= 1e6) {
      return `${(halfLife / 1e6).toFixed(2)} млн лет`;
    } else if (halfLife >= 1e3) {
      return `${(halfLife / 1e3).toFixed(2)} тыс. лет`;
    } else {
      return `${halfLife} лет`;
    }
  };

  return (
    <Card className="h-100 shadow-sm service-card-custom">
      <Card.Img 
        variant="top" 
        src={isotope.image_url || defaultImage}
        style={{ height: '200px', objectFit: 'cover' }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = defaultImage;
        }}
      />
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="text-primary" style={{ fontSize: '1.1rem' }}>
            {isotope.name}
          </Card.Title>
          <Badge bg={getDecayTypeBadge(isotope.decay_type)}>
            {isotope.decay_type}
          </Badge>
        </div>
        
        <Card.Text className="flex-grow-1">
          <small className="text-muted d-block mb-2">
            <i className="fas fa-clock me-1"></i>
            Период полураспада: <strong>{formatHalfLife(isotope.half_life)}</strong>
          </small>
          <small className="text-muted d-block mb-2">
            <i className="fas fa-weight-hanging me-1"></i>
            Атомная масса: <strong>{isotope.atomic_mass}</strong>
          </small>
          <span className="text-muted small">
            {isotope.application}
          </span>
        </Card.Text>
        
        <div className="mt-auto">
          <div className="d-grid gap-2">
            <Link to={`/isotopes/${isotope.id}`}>
              <Button variant="outline-primary" className="w-100">
                <i className="fas fa-info-circle me-2"></i>
                Подробнее
              </Button>
            </Link>
            <Button variant="outline-dark" className="w-100" disabled>
              <i className="fas fa-calculator me-2"></i>
              Добавить в расчет
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default IsotopeCard;