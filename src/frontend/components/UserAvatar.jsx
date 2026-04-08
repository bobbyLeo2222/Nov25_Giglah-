import { useMemo, useState } from 'react'

const GOOGLE_DEFAULT_AVATAR_PATTERN = /googleusercontent\.com\/a\/default-user/i

const getInitials = (name = '', fallback = 'ME') => {
  const trimmed = String(name || '').trim()
  if (!trimmed) return fallback
  const initials = trimmed
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase()
  return initials || fallback
}

const normalizeAvatarUrl = (value) => {
  const raw = (value || '').toString().trim()
  if (!raw) return ''
  if (GOOGLE_DEFAULT_AVATAR_PATTERN.test(raw)) return ''
  if (/googleusercontent\.com/i.test(raw)) {
    const stripped = raw.replace(/=s\d+(-c)?$/i, '')
    return `${stripped}=s256-c`
  }
  return raw
}

function UserAvatar({
  name = '',
  src = '',
  alt = '',
  className = 'h-10 w-10 rounded-full object-cover',
  fallbackClassName = 'h-10 w-10 rounded-full bg-slate-100 text-slate-600',
  fallbackTextClassName = 'text-sm font-semibold',
  fallback = 'ME',
}) {
  const resolvedSrc = useMemo(() => normalizeAvatarUrl(src), [src])
  const [failedSrc, setFailedSrc] = useState('')
  const label = alt || `${name || 'User'} profile`
  const canRenderImage = Boolean(resolvedSrc) && failedSrc !== resolvedSrc

  if (!canRenderImage) {
    return (
      <span
        className={`flex items-center justify-center ${fallbackClassName}`}
        aria-label={label}
      >
        <span className={fallbackTextClassName}>{getInitials(name, fallback)}</span>
      </span>
    )
  }

  return (
    <img
      src={resolvedSrc}
      alt={label}
      className={className}
      onError={() => setFailedSrc(resolvedSrc)}
      referrerPolicy="no-referrer"
    />
  )
}

export default UserAvatar
