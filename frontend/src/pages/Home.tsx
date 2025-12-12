// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Carousel, Spinner } from 'react-bootstrap';
import { isotopeService } from '../services/api';

const Home: React.FC = () => {
  const [statistics, setStatistics] = useState<{
    total: number;
    longestLiving: { name: string; half_life: number };
    shortestLiving: { name: string; half_life: number };
    decayTypes: { [key: string]: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [buttonColor, setButtonColor] = useState<string>('#14BF96');
  
  const isMounted = useRef(false);
  const updateCount = useRef(0);

  // Загрузка статистики
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        console.log('Загрузка статистики изотопов...');
        const isotopes = await isotopeService.getIsotopes();
        console.log('Изотопы загружены:', isotopes);
        
        if (isotopes.length === 0) {
          console.log('Изотопы не найдены');
          setStatistics(null);
          setLoading(false);
          return;
        }

        let longestLiving = isotopes[0];
        let shortestLiving = isotopes[0];
        const decayTypes: { [key: string]: number } = {};

        isotopes.forEach(iso => {
          if (iso.half_life > longestLiving.half_life) {
            longestLiving = iso;
          }
          if (iso.half_life < shortestLiving.half_life) {
            shortestLiving = iso;
          }
          decayTypes[iso.decay_type] = (decayTypes[iso.decay_type] || 0) + 1;
        });

        const topDecayTypes = Object.entries(decayTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        console.log('Рассчитанная статистика:', {
          total: isotopes.length,
          longestLiving: longestLiving.name,
          shortestLiving: shortestLiving.name,
          decayTypes: Object.fromEntries(topDecayTypes)
        });

        setStatistics({
          total: isotopes.length,
          longestLiving: { 
            name: longestLiving.name, 
            half_life: longestLiving.half_life 
          },
          shortestLiving: { 
            name: shortestLiving.name, 
            half_life: shortestLiving.half_life 
          },
          decayTypes: Object.fromEntries(topDecayTypes)
        });
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  // Простой эффект для изменения цвета - без сложной логики
  useEffect(() => {
    if (!isMounted.current) {
      // При монтировании
      isMounted.current = true;
      console.log('Компонент Home монтирован. Цвет кнопок карусели:', buttonColor);
    } else {
      // При обновлении
      updateCount.current += 1;
      const newColor = updateCount.current % 2 === 1 ? '#0B2149' : '#14BF96';
      setButtonColor(newColor);
      console.log(`Компонент Home обновлен. Новый цвет кнопок:`, newColor);
    }
  }, [statistics, loading]);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)} млрд`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)} млн`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(2)} тыс`;
    }
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spinner animation="border" variant="primary" />
          <p style={{ marginTop: '20px' }}>Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>
          Это приложение позволяет рассчитывать остаточную активность радиоактивных изотопов 
          и изучать их свойства.
        </p>

        {statistics ? (
          <div style={{ maxWidth: '800px', margin: '0 auto 40px auto' }}>
            <Carousel 
              indicators={true} 
              controls={true}
              prevIcon={
                <span 
                  aria-hidden="true" 
                  style={{
                    color: 'white',
                    fontSize: '24px',
                    backgroundColor: buttonColor,
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ‹
                </span>
              }
              nextIcon={
                <span 
                  aria-hidden="true" 
                  style={{
                    color: 'white',
                    fontSize: '24px',
                    backgroundColor: buttonColor,
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ›
                </span>
              }
            >
              <Carousel.Item>
                <div style={{ 
                  height: '180px', 
                  backgroundColor: '#0B2149',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'white' }}>
                      Изотопы в базе
                    </h3>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#14BF96' }}>
                      {statistics.total}
                    </p>
                  </div>
                </div>
              </Carousel.Item>

              <Carousel.Item>
                <div style={{ 
                  height: '180px', 
                  backgroundColor: '#0B2149',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '10px', color: 'white' }}>
                      Самый долгоживущий изотоп
                    </h3>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '8px 0', color: '#14BF96' }}>
                      {statistics.longestLiving.name}
                    </p>
                    <p style={{ fontSize: '14px', margin: 0, color: '#ccc' }}>
                      Период полураспада: {formatNumber(statistics.longestLiving.half_life)} лет
                    </p>
                  </div>
                </div>
              </Carousel.Item>

              <Carousel.Item>
                <div style={{ 
                  height: '180px', 
                  backgroundColor: '#0B2149',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '10px', color: 'white' }}>
                      Самый короткоживущий изотоп
                    </h3>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '8px 0', color: '#14BF96' }}>
                      {statistics.shortestLiving.name}
                    </p>
                    <p style={{ fontSize: '14px', margin: 0, color: '#ccc' }}>
                      Период полураспада: {statistics.shortestLiving.half_life.toFixed(2)} лет
                    </p>
                  </div>
                </div>
              </Carousel.Item>

              <Carousel.Item>
                <div style={{ 
                  height: '180px', 
                  backgroundColor: '#0B2149',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'white' }}>
                      Типы распада
                    </h3>
                    <div style={{ display: 'flex', gap: '25px', justifyContent: 'center' }}>
                      {Object.entries(statistics.decayTypes).map(([type, count]) => (
                        <div key={type} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#14BF96' }}>
                            {count}
                          </div>
                          <div style={{ fontSize: '12px', color: '#ccc' }}>
                            {type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Carousel.Item>
            </Carousel>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Не удалось загрузить статистику изотопов</p>
          </div>
        )}

        <div style={{ marginTop: '40px', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ color: '#0B2149', marginBottom: '20px' }}>О проекте</h3>
          <p style={{ fontSize: '16px', lineHeight: '1.6', textAlign: 'left' }}>
            Наш калькулятор предназначен для научных и образовательных целей. 
            Он помогает исследователям и студентам работать с радиоактивными 
            изотопами и понимать процессы радиоактивного распада.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;