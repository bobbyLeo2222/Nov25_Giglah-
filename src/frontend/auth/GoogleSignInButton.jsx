import { useEffect, useRef, useState } from 'react'

const GOOGLE_ID_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
let googleScriptPromise = null

const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Sign-In is only available in the browser'))
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }
  if (googleScriptPromise) {
    return googleScriptPromise
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const handleLoad = () => resolve()
    const handleError = () => {
      googleScriptPromise = null
      reject(new Error('Unable to load Google Sign-In script'))
    }

    const existing = document.querySelector(`script[src="${GOOGLE_ID_SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', handleLoad, { once: true })
      existing.addEventListener('error', handleError, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_ID_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = handleLoad
    script.onerror = handleError
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

function GoogleSignInButton({ clientId, onCredential, isLoading = false, text = 'signin_with' }) {
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let isCancelled = false

    if (!clientId) return undefined

    loadGoogleIdentityScript()
      .then(() => {
        if (isCancelled || !buttonRef.current || !wrapperRef.current) return
        if (!window.google?.accounts?.id) {
          setLoadError('Google Sign-In is currently unavailable.')
          return
        }

        setLoadError('')

        const width = Math.max(
          220,
          Math.min(360, Math.floor(wrapperRef.current.getBoundingClientRect().width || 320)),
        )

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = response?.credential || ''
            if (!credential) {
              setLoadError('Google Sign-In did not return a credential.')
              return
            }
            setLoadError('')
            onCredentialRef.current(credential)
          },
          ux_mode: 'popup',
          context: 'signin',
          cancel_on_tap_outside: true,
        })

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text,
          shape: 'pill',
          width,
        })
      })
      .catch((error) => {
        if (isCancelled) return
        setLoadError(error.message || 'Unable to initialize Google Sign-In.')
      })

    return () => {
      isCancelled = true
    }
  }, [clientId, text])

  const displayError = !clientId ? 'Google Sign-In is not configured.' : loadError

  return (
    <div ref={wrapperRef} className="w-full space-y-2">
      <div className="relative min-h-[44px]">
        <div
          ref={buttonRef}
          className={isLoading ? 'pointer-events-none opacity-70' : ''}
          aria-label="Sign in with Google"
        />
        {isLoading && <div className="absolute inset-0 cursor-not-allowed" aria-hidden="true" />}
      </div>
      {displayError && <p className="text-xs text-rose-500">{displayError}</p>}
    </div>
  )
}

export default GoogleSignInButton
