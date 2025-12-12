import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FiltersState {
  name: string;
}

const initialState: FiltersState = {
  name: '',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setNameFilter: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    clearFilters: () => initialState,
  },
});

export const {
  setNameFilter,
  clearFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;