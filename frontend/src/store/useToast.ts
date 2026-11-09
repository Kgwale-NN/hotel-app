import { useCallback } from 'react'
import { useAppDispatch } from './hooks'
import { addToast, type ToastTone } from './toastSlice'

export function useToast() {
  const dispatch = useAppDispatch()
  return useCallback((message: string, tone: ToastTone = 'success') => {
    dispatch(addToast(message, tone))
  }, [dispatch])
}
