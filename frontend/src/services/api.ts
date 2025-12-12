// src/services/api.ts
export interface Isotope {
  id: number;
  name: string;
  description: string;
  half_life: number;
  atomic_mass: number;
  decay_type: string;
  application: string;
  image_url: string | null;
  is_active: boolean;
}

export interface IsotopeFilters {
  name?: string;
  // ТОЛЬКО ПОИСК ПО ИМЕНИ, КАК В ПЕРВОЙ ЛАБОРАТОРНОЙ
}

const API_BASE = 'http://10.193.129.164:8000/api';

// Константа для изображения по умолчанию
const DEFAULT_ISOTOPE_IMAGE = '/images/default-isotope.jpg';

// Mock данные для изотопов
const mockIsotopes: Isotope[] = [
  {
    id: 1,
    name: 'Углерод-14',
    description: 'Радиоактивный изотоп углерода с периодом полураспада около 5730 лет. Широко используется в радиоуглеродном датировании.',
    half_life: 5730.0,
    atomic_mass: 14.003241,
    decay_type: 'β-',
    application: 'Археологическое датирование, геологические исследования',
    image_url: '/minio/isotopes/carbon-14.jpg',
    is_active: true,
  },
  {
    id: 2,
    name: 'Кобальт-60',
    description: 'Искусственный радиоактивный изотоп кобальта. Используется в медицине и промышленности.',
    half_life: 5.27,
    atomic_mass: 59.933822,
    decay_type: 'β-',
    application: 'Медицинская стерилизация, лучевая терапия, дефектоскопия',
    image_url: '/minio/isotopes/cobalt-60.jpg',
    is_active: true,
  },
  {
    id: 3,
    name: 'Йод-131',
    description: 'Радиоактивный изотоп йода, важный в ядерной медицине.',
    half_life: 8.02,
    atomic_mass: 130.9061246,
    decay_type: 'β-',
    application: 'Диагностика и лечение заболеваний щитовидной железы',
    image_url: '/minio/isotopes/iodine-131.jpg',
    is_active: true,
  },
  {
    id: 4,
    name: 'Торий-232',
    description: 'Природный радиоактивный изотоп тория с очень длительным периодом полураспада.',
    half_life: 14050000000.0,
    atomic_mass: 232.038055,
    decay_type: 'α',
    application: 'Ядерное топливо, радиационная терапия',
    image_url: '/minio/isotopes/thorium-232.jpg',
    is_active: true,
  },
  {
    id: 5,
    name: 'Уран-235',
    description: 'Делящийся изотоп урана, используемый в ядерных реакторах и оружии.',
    half_life: 703800000.0,
    atomic_mass: 235.0439299,
    decay_type: 'α',
    application: 'Ядерное топливо, атомное оружие',
    image_url: '/minio/isotopes/uranium-235.jpg',
    is_active: true,
  }
];

export const isotopeService = {
  async getIsotopes(filters: IsotopeFilters = {}): Promise<Isotope[]> {
    try {
      const queryParams = new URLSearchParams();
      
      // ТОЛЬКО поиск по имени
      if (filters.name) queryParams.append('search', filters.name);

      console.log('Fetching isotopes from:', `${API_BASE}/isotopes/?${queryParams}`);
      
      const response = await fetch(`${API_BASE}/isotopes/?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const isotopes = data.results || data;
      
      const isotopesWithProxyImages = isotopes.map((isotope: Isotope) => ({
        ...isotope,
        image_url: this.processImageUrl(isotope.image_url)
      }));
      
      return isotopesWithProxyImages;
      
    } catch (error) {
      console.warn('API недоступен, используем mock данные:', error);
      return this.getMockIsotopesWithFilters(filters);
    }
  },

  async getIsotope(id: number): Promise<Isotope> {
    try {
      console.log('Fetching isotope from:', `${API_BASE}/isotopes/${id}/`);
      
      const response = await fetch(`${API_BASE}/isotopes/${id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const isotope = await response.json();
      
      return {
        ...isotope,
        image_url: this.processImageUrl(isotope.image_url)
      };
      
    } catch (error) {
      console.warn('API недоступен, используем mock данные:', error);
      const mockIsotope = mockIsotopes.find(iso => iso.id === id);
      if (mockIsotope) {
        return {
          ...mockIsotope,
          image_url: this.processImageUrl(mockIsotope.image_url)
        };
      }
      throw new Error('Изотоп не найден');
    }
  },

  processImageUrl(image_url: string | null): string {
    if (!image_url || image_url.trim() === '') {
      return DEFAULT_ISOTOPE_IMAGE;
    }
    
    if (image_url.includes('localhost:9000') || image_url.includes('/minio/')) {
      return image_url.replace('http://localhost:9000', '/minio')
                     .replace('/minio/isotopes/', '/minio/isotopes/');
    }
    
    return image_url;
  },

  getMockIsotopesWithFilters(filters: IsotopeFilters): Isotope[] {
    let filtered = [...mockIsotopes];
    
    // Фильтрация только по названию
    if (filters.name) {
      filtered = filtered.filter(iso => 
        iso.name.toLowerCase().includes(filters.name!.toLowerCase()) ||
        iso.application.toLowerCase().includes(filters.name!.toLowerCase()) ||
        iso.description.toLowerCase().includes(filters.name!.toLowerCase())
      );
    }
    
    return filtered.map(iso => ({
      ...iso,
      image_url: this.processImageUrl(iso.image_url)
    }));
  }
};

export const cartService = {
  async getCartCount(): Promise<number> {
    return 0;
  },

  async addToCart(isotopeId: number): Promise<void> {
    console.log(`Изотоп ${isotopeId} добавлен в корзину (заглушка)`);
  },

  async getCartData(): Promise<any> {
    return { items: [] };
  },

  async clearCart(): Promise<void> {
    // Заглушка
  }
};

export { DEFAULT_ISOTOPE_IMAGE };