import React, { useState } from 'react'
import { Button } from './button'
import logo from '@/images/Logo_Words.png'

const noop = () => {}

function TopBar({
  user,
  onDashboard = noop,
  onLogin = noop,
  onSignup = noop,
  onChat = noop,
  onSellerTools = noop,
  onProfile = noop,
  onLogout = noop,
  onSwitchMode = noop,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'ME'

  const run = (fn) => {
    fn()
    setIsMenuOpen(false)
  }
  const canSwitchMode = user?.role === 'seller'
  const switchLabel = user?.isSeller ? 'Switch to buyer mode' : 'Switch to seller mode'

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-4 py-3 sm:flex-nowrap sm:gap-6 sm:px-6 md:px-10">
        <div className="flex items-center gap-4 sm:gap-5">
          <button
            type="button"
            onClick={onDashboard}
            className="flex items-center rounded-xl transition hover:opacity-90"
          >
            <img src={logo} alt="GigLah! logo" className="h-16 w-auto sm:h-20 md:h-24" />
          </button>
        </div>
        {user ? (
          <>
            <div className="hidden sm:flex sm:flex-nowrap sm:items-center sm:justify-end sm:gap-4 sm:text-base sm:font-semibold sm:text-slate-800">
              <button type="button" className="transition hover:text-purple-600" onClick={onChat}>
                Messages
              </button>
              {user.role === 'seller' && (
                <button type="button" className="transition hover:text-purple-600" onClick={onSellerTools}>
                  Seller tools
                </button>
              )}
              <button
                type="button"
                className="text-left text-slate-500 transition hover:text-purple-600"
                onClick={onProfile}
              >
                {user.name} · {user.isSeller ? 'Seller' : 'Buyer'}
              </button>
              {canSwitchMode && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-purple-200 px-4 text-base text-purple-700 hover:bg-purple-50"
                  onClick={() => onSwitchMode(user.isSeller ? 'buyer' : 'seller')}
                >
                  {switchLabel}
                </Button>
              )}
              <Button variant="ghost" className="h-11 px-4 text-base text-slate-600" onClick={onLogout}>
                Sign out
              </Button>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-purple-100 bg-purple-50 text-sm font-semibold text-purple-700 transition hover:border-purple-200 hover:bg-purple-100 sm:hidden"
              onClick={() => run(onProfile)}
              aria-label="Open profile"
            >
              {initials}
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-purple-200 hover:text-purple-700 sm:hidden"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            {isMenuOpen && (
              <div className="mt-3 w-full space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm sm:hidden">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {user.name} · {user.isSeller ? 'Seller' : 'Buyer'}
                    </p>
                  </div>
                  <button className="text-xs text-purple-700" type="button" onClick={() => run(onProfile)}>
                    Profile
                  </button>
                </div>
                <button type="button" className="w-full text-left transition hover:text-purple-600" onClick={() => run(onChat)}>
                  Messages
                </button>
                {user.role === 'seller' && (
                  <button
                    type="button"
                    className="w-full text-left transition hover:text-purple-600"
                    onClick={() => run(onSellerTools)}
                  >
                    Seller tools
                  </button>
                )}
                <button type="button" className="w-full text-left transition hover:text-purple-600" onClick={() => run(onProfile)}>
                  View profile
                </button>
                {canSwitchMode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => run(() => onSwitchMode(user.isSeller ? 'buyer' : 'seller'))}
                  >
                    {switchLabel}
                  </Button>
                )}
                <Button variant="ghost" className="w-full justify-start text-left text-slate-700" onClick={() => run(onLogout)}>
                  Sign out
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="hidden sm:flex sm:items-center sm:justify-end sm:gap-4">
              <Button
                type="button"
                className="h-11 px-5 bg-purple-600 text-white hover:bg-purple-500"
                onClick={onLogin}
              >
                Log in
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 px-5 border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={onSignup}
              >
                Sign up
              </Button>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-purple-200 hover:text-purple-700 sm:hidden"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            {isMenuOpen && (
              <div className="mt-3 w-full space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm sm:hidden">
                <Button
                  type="button"
                  className="w-full justify-start bg-purple-600 text-white hover:bg-purple-500"
                  onClick={() => run(onLogin)}
                >
                  Log in
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => run(onSignup)}
                >
                  Sign up
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  )
}

export default TopBar
