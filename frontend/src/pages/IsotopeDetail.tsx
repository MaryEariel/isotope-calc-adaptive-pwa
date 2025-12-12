import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { isotopeService } from '../services/api';
import type { Isotope } from '../services/api';

const DEFAULT_ISOTOPE_IMAGE = '/images/default-isotope.jpg';

const IsotopeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isotope, setIsotope] = useState<Isotope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buttonColor, setButtonColor] = useState<string>('#14BF96');

  const isMounted = useRef(false);
  const updateCount = useRef(0);
  const prevValuesRef = useRef({
    prevIsotope: null as Isotope | null,
    prevLoading: true,
    prevError: ''
  });

  useEffect(() => {
    const loadIsotope = async () => {
      if (!id) {
        setError('ID изотопа не указан');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        const data = await isotopeService.getIsotope(parseInt(id));
        setIsotope(data);
      } catch (err) {
        setError('Ошибка при загрузке данных изотопа');
        console.error('Error loading isotope:', err);
      } finally {
        setLoading(false);
      }
    };

    loadIsotope();
  }, [id]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      console.log('Компонент IsotopeDetail монтирован. Цвет:', buttonColor);
    } else {
      const currentValues = { isotope, loading, error };
      const prevValues = prevValuesRef.current;
      
      const hasChanged = 
        JSON.stringify(currentValues.isotope) !== JSON.stringify(prevValues.prevIsotope) ||
        currentValues.loading !== prevValues.prevLoading ||
        currentValues.error !== prevValues.prevError;
      
      if (hasChanged) {
        updateCount.current += 1;
        const newColor = updateCount.current % 2 === 1 ? '#0B2149' : '#14BF96';
        setButtonColor(newColor);
        console.log(`Компонент IsotopeDetail обновлен ${updateCount.current} раз. Новый цвет:`, newColor);
      }
      
      prevValuesRef.current = {
        prevIsotope: isotope ? { ...isotope } : null,
        prevLoading: loading,
        prevError: error
      };
    }
  }, [isotope, loading, error, buttonColor]);

  const getIsotopeImage = (isotope: Isotope) => {
    if (!isotope.image_url) {
      return DEFAULT_ISOTOPE_IMAGE;
    }
    return isotope.image_url;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = DEFAULT_ISOTOPE_IMAGE;
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Загрузка данных изотопа...</p>
        </div>
      </div>
    );
  }

  if (error || !isotope) {
    return (
      <div className="container">
        <div className="alert alert-error">
          {error || 'Изотоп не найден'}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="service-detail">
        <img 
          src={getIsotopeImage(isotope)} 
          alt={isotope.name}
          onError={handleImageError}
        />
        <div className="service-info">
          <h2 style={{ color: buttonColor }}>{isotope.name}</h2>
          <p><strong style={{ color: buttonColor }}>Период полураспада:</strong> {isotope.half_life} лет</p>
          <p><strong style={{ color: buttonColor }}>Атомная масса:</strong> {isotope.atomic_mass}</p>
          <p><strong style={{ color: buttonColor }}>Тип распада:</strong> {isotope.decay_type}</p>
          <p><strong style={{ color: buttonColor }}>Применение:</strong> {isotope.application}</p>
          <p><strong style={{ color: buttonColor }}>Описание:</strong> {isotope.description}</p>
        </div>
      </div>
    </div>
  );
};

export default IsotopeDetail;