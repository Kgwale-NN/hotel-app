import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export type ToastTone = 'success' | 'error' | 'info'
export type Toast = { id: string; message: string; tone: ToastTone }
const toastSlice = createSlice({
  name: 'toasts',
  initialState: [] as Toast[],
  reducers: {
    addToast: {
      prepare(message: string, tone: ToastTone = 'success') {
        return { payload: { id: nanoid(), message, tone } }
      },
      reducer(state, action: PayloadAction<Toast>) {
        state.push(action.payload)
        if (state.length > 3) state.shift()
      },
    },
    removeToast(state, action: PayloadAction<string>) {
      return state.filter(toast => toast.id !== action.payload)
    },
  },
})
export const { addToast, removeToast } = toastSlice.actions
export default toastSlice.reducer
