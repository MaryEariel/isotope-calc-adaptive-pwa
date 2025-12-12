import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SimpleNavbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Верхний заголовок как в бэкенде */}
      <div className="header">
        <h1>Расчет периода полураспада радиоактивного изотопа</h1>
        <Link to="/" className="home-link">
          <i className="fas fa-home"></i>
        </Link>
      </div>

      {/* Навигация для десктопа */}
      <div className="desktop-nav">
        <nav>
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            <i className="fas fa-home"></i> Главная
          </Link>
          <Link 
            to="/isotopes" 
            className={location.pathname === '/isotopes' ? 'nav-link active' : 'nav-link'}
          >
            <i className="fas fa-vial"></i> Изотопы
          </Link>
        </nav>
      </div>

      {/* Бургер-меню для мобильных */}
      <div className="mobile-nav">
        <button 
          className="menu-toggle" 
          onClick={toggleMenu}
          aria-label="Открыть меню"
        >
          <i className="fas fa-bars"></i>
        </button>
        
        {isMenuOpen && (
          <div className="mobile-menu">
            <button 
              className="menu-close" 
              onClick={toggleMenu}
              aria-label="Закрыть меню"
            >
              <i className="fas fa-times"></i>
            </button>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-home"></i> Главная
            </Link>
            <Link 
              to="/isotopes" 
              className={location.pathname === '/isotopes' ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-vial"></i> Изотопы
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default SimpleNavbar;