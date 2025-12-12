// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimpleNavbar from './components/SimpleNavbar'; // Изменено!
import Breadcrumbs from './components/Breadcrumbs';
import Home from './pages/Home';
import IsotopesList from './pages/IsotopesList';
import IsotopeDetail from './pages/IsotopeDetail';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/backend-styles.css';
import './styles/App.css';
import './styles/adaptive.css';

function App() {
  return (
    <Router>
      <div className="App">
        <SimpleNavbar /> {/* Изменено! */}
        <Breadcrumbs />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/isotopes" element={<IsotopesList />} />
            <Route path="/isotopes/:id" element={<IsotopeDetail />} />
            <Route path="*" element={<div className="container mt-4"><h2>Страница не найдена</h2></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;