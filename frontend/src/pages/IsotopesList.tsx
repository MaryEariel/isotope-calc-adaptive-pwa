import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isotopeService, cartService } from '../services/api';
import type { Isotope } from '../services/api';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setNameFilter } from '../features/filters/filtersSlice';

const DEFAULT_ISOTOPE_IMAGE = '/images/default-isotope.jpg';

const IsotopesList: React.FC = () => {
  const [isotopes, setIsotopes] = useState<Isotope[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [buttonColor, setButtonColor] = useState<string>('#14BF96');
  const [searchQuery, setSearchQuery] = useState<string>('');

  
  const filters = useAppSelector((state) => state.filters);
  const dispatch = useAppDispatch();

  // Ref для отслеживания монтирования
  const isMounted = useRef(false);
  // Ref для отслеживания количества обновлений
  const updateCount = useRef(0);
  // Ref для хранения предыдущих фильтров
  const prevFilterRef = useRef<string>('');

  useEffect(() => {
    loadIsotopes();
  }, [filters.name]);

  // Эффект для изменения цвета кнопок только при реальном поиске
  useEffect(() => {
    if (!isMounted.current) {
      // Компонент монтируется в первый раз
      isMounted.current = true;
      setButtonColor('#14BF96');
    } else if (filters.name !== prevFilterRef.current) {
      // Фильтр изменился (был выполнен поиск)
      prevFilterRef.current = filters.name;
      updateCount.current += 1;
      
      // Чередуем цвета только при выполнении поиска
      const newColor = updateCount.current % 2 === 1 ? '#0B2149' : '#14BF96';
      setButtonColor(newColor);
      
    }
  }, [filters.name]);

  const loadIsotopes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filtersToSend = {
        name: filters.name,
      };
      
      const data = await isotopeService.getIsotopes(filtersToSend);
      setIsotopes(data);
    } catch (err) {
      setError('Ошибка при загрузке данных изотопов');
      console.error('Error loading isotopes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setNameFilter(searchQuery));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    // Если поле очищено - сразу сбрасываем фильтр
    if (newValue === '') {
      dispatch(setNameFilter(''));
    }
  };

  const handleAddToCart = async (isotopeId: number, isotopeName: string) => {
    try {
      await cartService.addToCart(isotopeId);
      alert(`Изотоп ${isotopeName} добавлен в расчет!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

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
          <p>Загрузка изотопов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="cart-container">
        <div 
          className="cart-icon" 
          onClick={() => alert('Расчет (функциональность будет реализована в следующих лабораторных)')}
          style={{cursor: 'pointer'}}
        >
          <i className="fas fa-calculator"></i>
        </div>
      </div>

      {/* Простая поисковая форма как в лр1 */}
      <div className="search-form">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Поиск радиоактивных изотопов..."
          />
          <button 
            type="submit"
            style={{ backgroundColor: buttonColor }}
          >
            Найти изотопы
          </button>
        </form>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <p style={{ marginTop: '10px' }}>Используются демонстрационные данные. Для работы с реальными данными запустите бэкенд.</p>
        </div>
      )}

      <div className="services-container">
        {isotopes.map(isotope => (
          <div key={isotope.id} className="service-card">
            <img 
              src={getIsotopeImage(isotope)} 
              alt={isotope.name}
              onError={handleImageError}
            />
            <h3>{isotope.name}</h3>
            <p className="half-life">Период полураспада: {isotope.half_life} лет</p>
            <p className="decay-type">Тип распада: {isotope.decay_type}</p>
            <p className="application">{isotope.application}</p>
            
            <div className="card-actions">
              <Link 
                to={`/isotopes/${isotope.id}`} 
                className="details-btn"
                style={{ backgroundColor: buttonColor }}
              >
                Подробнее
              </Link>
              
              <button 
                type="button"
                className="add-to-calculation-btn"
                onClick={() => handleAddToCart(isotope.id, isotope.name)}
                style={{ backgroundColor: buttonColor }}
              >
                Добавить в расчет
              </button>
            </div>
          </div>
        ))}
      </div>

      {isotopes.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Изотопы не найдены</p>
        </div>
      )}
    </div>
  );
};

export default IsotopesList;