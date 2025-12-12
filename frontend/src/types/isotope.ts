// src/services/isotope.ts
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