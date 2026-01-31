const viteEnv = import.meta.env || {}
const envApiBase = viteEnv.VITE_API_BASE ?? viteEnv.REACT_APP_API_BASE

const fallbackApiBase =
  typeof window === 'undefined'
    ? 'http://localhost:5001'
    : viteEnv.DEV
      ? 'http://localhost:5001'
      : window.location.origin

const API_BASE = envApiBase ?? fallbackApiBase

const TOKEN_STORAGE_KEY = 'giglah_token'
const REFRESH_STORAGE_KEY = 'giglah_refresh_token'

export const apiBase = API_BASE

export const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
}

export const getStoredRefreshToken = () => {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(REFRESH_STORAGE_KEY) || ''
}

export const setStoredToken = (token) => {
  if (typeof localStorage === 'undefined') return
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export const setStoredRefreshToken = (token) => {
  if (typeof localStorage === 'undefined') return
  if (token) {
    localStorage.setItem(REFRESH_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_STORAGE_KEY)
  }
}

const normalizeBody = (body) => {
  if (!body) return body
  if (typeof body === 'string' || body instanceof FormData) return body
  return JSON.stringify(body)
}

export const fetchJSON = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const token = options.token ?? getStoredToken()
  const body = normalizeBody(options.body)
  const isFormData = body instanceof FormData
  const headers = {
    ...(options.headers || {}),
    ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const response = await fetch(url, { ...options, headers, body })
  if (!response.ok) {
    const text = await response.text()
    let message = text
    try {
      const parsed = JSON.parse(text)
      message = parsed.message || message
    } catch (error) {
      // Ignore JSON parse errors and fall back to raw text
    }
    throw new Error(message || `Request failed with status ${response.status}`)
  }
  if (response.status === 204) return null
  return response.json()
}

export const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available')
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) throw new Error('Unable to refresh session')
  const data = await response.json()
  if (data?.token) {
    setStoredToken(data.token)
    return data.token
  }
  throw new Error('No token returned from refresh')
}
