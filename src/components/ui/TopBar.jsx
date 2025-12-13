import React from 'react'
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
  onLogout = noop,
}) {
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
          <Button
            variant="ghost"
            className="h-11 px-5 text-base font-semibold text-slate-800 hover:bg-slate-100"
            onClick={onSellerTools}
          >
            {user?.isSeller ? 'Create Gig' : 'Become a Seller'}
          </Button>
        </div>
        {user ? (
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-slate-800 sm:flex-nowrap sm:gap-4 sm:text-base">
            <button
              type="button"
              className="transition hover:text-purple-600"
              onClick={onChat}
            >
              Messages
            </button>
            <button
              type="button"
              className="transition hover:text-purple-600"
              onClick={onSellerTools}
            >
              Seller tools
            </button>
            <span className="hidden text-slate-500 sm:inline">
              {user.name} · {user.isSeller ? 'Seller' : 'Buyer'}
            </span>
            <Button
              variant="ghost"
              className="h-10 px-4 text-sm text-slate-600 sm:h-11 sm:text-base"
              onClick={onLogout}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-slate-800 sm:flex-nowrap sm:gap-4 sm:text-base">
            <button
              type="button"
              className="transition hover:text-purple-600"
              onClick={onLogin}
            >
              Log in
            </button>
            <Button
              className="h-10 rounded-full bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500 sm:h-11 sm:px-6"
              onClick={onSignup}
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}

export default TopBar
