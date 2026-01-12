import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
  created_at?: string
  messageQuota?: number
}

export interface AuthState {
  isLoggedIn: boolean
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  token: null,
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
      if (action.payload) {
        state.error = null
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.loading = false
    },
    loginSuccess: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.isLoggedIn = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.loading = false
      state.error = null
    },
    logout: (state) => {
      state.isLoggedIn = false
      state.user = null
      state.token = null
      state.loading = false
      state.error = null
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setMessageQuota: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.messageQuota = action.payload
      }
    },
    decrementQuota: (state) => {
      if (state.user && state.user.messageQuota !== undefined && state.user.messageQuota > 0) {
        state.user.messageQuota -= 1
      }
    }
  }
})

export const { setLoading, setError, loginSuccess, logout, updateUser, setMessageQuota, decrementQuota } = authSlice.actions
export default authSlice.reducer
