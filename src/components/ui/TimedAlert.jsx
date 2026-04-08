import { useEffect, useRef, useState } from 'react'

const toneClasses = {
  info: 'border-purple-100 bg-purple-50/60 text-purple-800',
  error: 'border-rose-100 bg-rose-50 text-rose-700',
  warning: 'border-amber-200 bg-amber-50/70 text-amber-900',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
}

function TimedAlert({
  message = '',
  tone = 'info',
  durationSeconds = 5,
  onClose,
  className = '',
}) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const closeNotifiedRef = useRef(false)

  useEffect(() => {
    if (!message || remaining <= 0) return undefined
    const timeoutId = window.setTimeout(() => {
      setRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearTimeout(timeoutId)
  }, [message, remaining])

  useEffect(() => {
    if (!message) {
      closeNotifiedRef.current = false
      return
    }
    if (remaining > 0 || closeNotifiedRef.current) return
    closeNotifiedRef.current = true
    onClose?.()
  }, [message, onClose, remaining])

  if (!message || remaining <= 0) return null

  const toneClass = toneClasses[tone] || toneClasses.info
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${toneClass} ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{message}</span>
        <span className="text-xs opacity-80">Closes in {remaining}s</span>
      </div>
    </div>
  )
}

export default TimedAlert
