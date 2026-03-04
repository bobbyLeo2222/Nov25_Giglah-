const envApiBase =
  import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || ''

const isLocalHostname =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

let API_BASE = envApiBase
if (!API_BASE) {
  API_BASE =
    typeof window === 'undefined'
      ? 'http://localhost:5001'
      : import.meta.env.DEV
        ? 'http://localhost:5001'
        : window.location.origin
}

// Prevent accidental production builds hardcoding localhost API URLs.
if (
  typeof window !== 'undefined' &&
  !import.meta.env.DEV &&
  !isLocalHostname &&
  (API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1'))
) {
  API_BASE = window.location.origin
}

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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchJSON = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const token = options.token ?? getStoredToken()
  const body = normalizeBody(options.body)
  const isFormData = body instanceof FormData
  const method = (options.method || 'GET').toUpperCase()
  const headers = {
    ...(options.headers || {}),
    ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const maxAttempts = method === 'GET' ? 3 : 1
  let response
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      response = await fetch(url, { ...options, headers, body })
      break
    } catch (error) {
      const isFinalAttempt = attempt === maxAttempts
      if (!isFinalAttempt) {
        await delay(300 * attempt)
        continue
      }
      throw new Error(
        `Unable to reach API at ${API_BASE}. Ensure the server is running on port 5001.`,
      )
    }
  }

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
