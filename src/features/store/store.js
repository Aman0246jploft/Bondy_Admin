// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../slices/userSlice'
import logger from 'redux-logger';
import CategoryReducer from '../slices/categorySlice';


export const store = configureStore({
  reducer: {
    user: userReducer,
    category:CategoryReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logger),
});
