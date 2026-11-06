import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UserProfile } from '../api/profile'

type AuthState = {
  user: UserProfile | null
  status: 'idle' | 'loading' | 'ready' | 'failed'
  error: string
  requestId?: string
}
const initialState: AuthState = { user: null, status: 'idle', error: '' }

export const loadSession = createAsyncThunk<UserProfile | null, void, { state: { auth: AuthState } }>(
  'auth/loadSession',
  async () => {
    const response = await fetch('/api/auth/me')
    if (response.status === 401) return null
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'Could not check your sign-in status.')
    return result.data as UserProfile
  },
  { condition: (_, { getState }) => getState().auth.status !== 'loading' },
)

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    profileUpdated(state, action: PayloadAction<Partial<UserProfile>>) {
      if (state.user) Object.assign(state.user, action.payload)
    },
    sessionCleared(state) {
      state.user = null; state.status = 'ready'; state.error = ''; state.requestId = undefined
    },
  },
  extraReducers: builder => {
    builder.addCase(loadSession.pending, (state, action) => {
      state.status = 'loading'; state.error = ''; state.requestId = action.meta.requestId
    }).addCase(loadSession.fulfilled, (state, action) => {
      if (state.requestId !== action.meta.requestId) return
      state.user = action.payload; state.status = 'ready'; state.requestId = undefined
    }).addCase(loadSession.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) return
      state.status = 'failed'; state.error = action.error.message || 'Could not check your session.'; state.requestId = undefined
    })
  },
})
export const { profileUpdated, sessionCleared } = authSlice.actions
export default authSlice.reducer
