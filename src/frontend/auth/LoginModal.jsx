import TimedAlert from '@/components/ui/TimedAlert'
import GoogleSignInButton from '@/frontend/auth/GoogleSignInButton'

function LoginModal({
  forms,
  modalInputClasses,
  onChange,
  onSubmit,
  isAuthLoading,
  formError,
  onOpenSignup,
  onClose,
  showPassword,
  onTogglePassword,
  onForgotPassword,
  googleClientId,
  onGoogleSignIn,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[32px] border border-slate-100 bg-white px-5 py-8 shadow-2xl sm:px-8 sm:py-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close login modal"
        >
          x
        </button>
        <div className="space-y-6">
          <div>
            <p className="text-2xl font-semibold text-slate-900">Login</p>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                className={modalInputClasses}
                placeholder="you@example.com"
                value={forms.login.email}
                onChange={onChange('login', 'email')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="flex items-center rounded-full border border-slate-200 bg-white px-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border-none bg-transparent py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="Enter your password"
                  value={forms.login.password}
                  onChange={onChange('login', 'password')}
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500"
                  onClick={onTogglePassword}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full rounded-full bg-purple-600 px-4 py-3 text-base font-semibold text-white shadow transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Continue
            </button>
          </form>
          {googleClientId && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <GoogleSignInButton
                clientId={googleClientId}
                onCredential={onGoogleSignIn}
                isLoading={isAuthLoading}
                text="signin_with"
              />
            </div>
          )}
          <TimedAlert key={`login-error-${formError || 'empty'}`} message={formError} tone="error" />
          <div className="flex items-center justify-between text-sm text-slate-500">
            <button type="button" className="font-semibold text-slate-700" onClick={onOpenSignup}>
              Create account
            </button>
            <button type="button" className="font-semibold text-slate-700" onClick={onForgotPassword}>
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
