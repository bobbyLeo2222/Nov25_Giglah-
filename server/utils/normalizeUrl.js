const normalizeUrl = (value) => {
  if (!value) return ''

  const trimmed = String(value).trim()
  if (!trimmed) return ''

  // Allow mailto/tel and already well-formed URLs
  if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed

  // Prepend https:// when protocol is missing (e.g., www.example.com)
  const sanitized = trimmed.replace(/^\/+/, '')
  return `https://${sanitized}`
}

export default normalizeUrl
