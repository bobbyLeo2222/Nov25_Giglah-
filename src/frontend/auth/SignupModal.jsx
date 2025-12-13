function SignupModal({
  forms,
  modalInputClasses,
  onChange,
  onSubmit,
  isAuthLoading,
  formError,
  onOpenLogin,
  onClose,
  showPassword,
  onTogglePassword,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[32px] border border-slate-100 bg-white px-8 py-10 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close signup modal"
        >
          A-
        </button>
        <div className="space-y-6">
          <div>
            <p className="text-2xl font-semibold text-slate-900">Register</p>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <input
                className={modalInputClasses}
                placeholder="Your full name"
                value={forms.signup.fullName}
                onChange={onChange('signup', 'fullName')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                className={modalInputClasses}
                placeholder="you@example.com"
                value={forms.signup.email}
                onChange={onChange('signup', 'email')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="flex items-center rounded-full border border-slate-200 bg-white px-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border-none bg-transparent py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="At least 8 characters"
                  value={forms.signup.password}
                  onChange={onChange('signup', 'password')}
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500"
                  onClick={onTogglePassword}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Use at least 8 characters with uppercase, lowercase, and a number.
              </p>
            </div>
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full rounded-full bg-purple-600 px-4 py-3 text-base font-semibold text-white shadow transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Continue
            </button>
          </form>
          {formError && <p className="text-sm font-medium text-rose-500">{formError}</p>}
          <div className="text-center text-sm text-slate-500">
            <button type="button" className="font-semibold text-slate-700" onClick={onOpenLogin}>
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupModal
