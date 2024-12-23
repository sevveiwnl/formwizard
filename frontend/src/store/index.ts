import { configureStore } from '@reduxjs/toolkit';
import analyticsReducer from './analyticsSlice';

const store = configureStore({
  reducer: {
    analytics: analyticsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;


