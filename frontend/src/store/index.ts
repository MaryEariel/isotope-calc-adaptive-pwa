import { configureStore } from '@reduxjs/toolkit';
import filtersReducer from '../features/filters/filtersSlice';

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
  },
  devTools: true, // Всегда включено для демонстрации
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;