import { createSlice } from '@reduxjs/toolkit';

interface AppState {
  isBootstrapped: boolean;
}

const initialState: AppState = {
  isBootstrapped: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    markBootstrapped(state) {
      state.isBootstrapped = true;
    },
  },
});

export const { markBootstrapped } = appSlice.actions;
export default appSlice.reducer;
