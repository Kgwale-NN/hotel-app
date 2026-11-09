import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import toastReducer from './toastSlice'

export const store = configureStore({ reducer: { auth: authReducer, toasts: toastReducer } })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
