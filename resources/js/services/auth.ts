import type { Data } from '@generated/data'
import xior from 'xior'

import i18n from '../i18n'
import { getErrorMessage } from './errors'

export type AuthUser = Data.Profile

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  name: string
  passwordConfirmation: string
}

export type ProfilePayload = {
  name: string
  email: string
  distroId: number | null
  avatarId: number | null
}

export type PasswordPayload = {
  currentPassword: string
  password: string
  passwordConfirmation: string
}

type AuthResponse = {
  user: AuthUser
  token: string
}

const tokenKey = 'auth-token'
const api = xior.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  config.headers = {
    ...config.headers,
    'Accept-Language': i18n.language,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  return config
})

export function getAuthToken() {
  return localStorage.getItem(tokenKey)
}

export function clearAuthToken() {
  localStorage.removeItem(tokenKey)
}

function setAuthToken(token: string) {
  localStorage.setItem(tokenKey, token)
}

export async function login(payload: LoginPayload) {
  try {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/login', payload)
    setAuthToken(data.data.token)
    return data.data.user
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export async function register(payload: RegisterPayload) {
  try {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/register', payload)
    setAuthToken(data.data.token)
    return data.data.user
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export async function getCurrentUser() {
  try {
    const { data } = await api.get<{ data: AuthUser }>('/auth/user')
    return data.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

/** The name and email of the authenticated account, which the API answers with the same shape. */
export async function updateProfile(payload: ProfilePayload) {
  try {
    const { data } = await api.patch<{ data: AuthUser }>('/auth/user', payload)
    return data.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

/** The password of the authenticated account, which the current one has to prove. */
export async function updatePassword(payload: PasswordPayload) {
  try {
    await api.patch('/auth/password', payload)
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  } finally {
    clearAuthToken()
  }
}
