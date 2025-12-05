const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.REACT_APP_API_BASE ||
  'http://localhost:5001'

const TOKEN_STORAGE_KEY = 'giglah_token'

export const apiBase = API_BASE

export const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
}

export const setStoredToken = (token) => {
  if (typeof localStorage === 'undefined') return
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
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
