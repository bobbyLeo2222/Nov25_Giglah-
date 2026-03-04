import React, { useState } from 'react'
import { Button } from './button'
import logo from '@/images/Logo_Words.png'

const noop = () => {}

function TopBar({
  user,
  unreadMessageCount = 0,
  unreadOrderCount = 0,
  notifications = [],
  notificationUnreadCount = 0,
  onDashboard = noop,
  onMarketplace = noop,
  onBecomeSeller = noop,
  onLogin = noop,
  onSignup = noop,
  onChat = noop,
  onOrders = noop,
  onProfile = noop,
  onSellerCreateGig = noop,
  onSellerDashboard = noop,
  onSellerProfile = noop,
  onSellerOrders = noop,
  onLogout = noop,
  onSwitchMode = noop,
  onOpenNotification = noop,
  onMarkNotificationRead = noop,
  onMarkAllNotificationsRead = noop,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'ME'
  const profileImage = user?.avatarUrl || user?.avatar || ''
  const modeLabel = user?.isSeller ? 'Seller' : 'Buyer'
  const userLabel = `${user?.name || 'Member'} - ${modeLabel}`

  const run = (fn) => {
    fn()
    setIsMenuOpen(false)
    setIsAccountMenuOpen(false)
    setIsNotificationsOpen(false)
  }
  const isSellerAccount = user?.role === 'seller'
  const canSwitchMode = isSellerAccount
  const showBecomeSeller = !isSellerAccount
  const switchLabel = user?.isSeller ? 'Switch to buyer mode' : 'Switch to seller mode'
  const sellerMenuItems = [
    { id: 'create', label: 'Create Gig', action: onSellerCreateGig },
    { id: 'dashboard', label: 'Dashboard', action: onSellerDashboard },
    { id: 'profile', label: 'Profile', action: onSellerProfile },
    {
      id: 'orders',
      label: unreadOrderCount > 0 ? `Orders (${unreadOrderCount})` : 'Orders',
      action: onSellerOrders,
    },
  ]
  const buyerMenuItems = [
    { id: 'profile', label: 'Profile', action: onProfile },
    {
      id: 'buyer-orders',
      label: unreadOrderCount > 0 ? `Orders (${unreadOrderCount})` : 'Orders',
      action: onOrders,
    },
  ]
  const latestNotifications = notifications.slice(0, 8)
  const hasNotifications = latestNotifications.length > 0

  const formatNotificationTime = (value) => {
    const timestamp = new Date(value || 0).getTime()
    if (!timestamp) return ''
    const diffMs = Date.now() - timestamp
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }


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
              <button
                type="button"
                className="transition hover:text-purple-600"
                onClick={() => run(onMarketplace)}
              >
                Marketplace
              </button>
              {showBecomeSeller && (
                <button
                  type="button"
                  className="transition hover:text-purple-600"
                  onClick={() => run(onBecomeSeller)}
                >
                  Become a Seller
                </button>
              )}
              <button
                type="button"
                className="relative transition hover:text-purple-600"
                onClick={() => run(onChat)}
              >
                Messages
                {unreadMessageCount > 0 && (
                  <span className="absolute -right-3 -top-2 min-w-[18px] rounded-full bg-purple-600 px-1.5 py-[1px] text-[10px] font-semibold leading-4 text-white">
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </span>
                )}
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:border-purple-200 hover:text-purple-700"
                  onClick={() => {
                    setIsNotificationsOpen((prev) => !prev)
                    setIsAccountMenuOpen(false)
                  }}
                  aria-haspopup="menu"
                  aria-expanded={isNotificationsOpen}
                  aria-label="Open notifications"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17H9.143m9.238 0H5.619c.617-.592 1.381-1.75 1.381-4.286V10a5 5 0 1 1 10 0v2.714c0 2.536.764 3.694 1.381 4.286ZM13.6 17a1.6 1.6 0 1 1-3.2 0"
                    />
                  </svg>
                  {notificationUnreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-purple-600 px-1.5 py-[1px] text-[10px] font-semibold leading-4 text-white">
                      {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      {notificationUnreadCount > 0 && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-purple-700 transition hover:text-purple-600"
                          onClick={onMarkAllNotificationsRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!hasNotifications && (
                        <p className="px-4 py-4 text-sm text-slate-500">No notifications yet.</p>
                      )}
                      {latestNotifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                            item.unread ? 'bg-purple-50/60' : 'bg-white hover:bg-slate-50'
                          }`}
                          onClick={() => {
                            onMarkNotificationRead(item.id)
                            onOpenNotification(item)
                            setIsNotificationsOpen(false)
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                            <span className="text-[11px] text-slate-400">{formatNotificationTime(item.createdAt)}</span>
                          </div>
                          {item.body && <p className="mt-1 text-xs text-slate-600">{item.body}</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {user.isSeller ? (
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-slate-700 transition hover:border-purple-200 hover:text-purple-700"
                    onClick={() => {
                      setIsAccountMenuOpen((prev) => !prev)
                      setIsNotificationsOpen(false)
                    }}
                    aria-haspopup="menu"
                    aria-expanded={isAccountMenuOpen}
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={`${user.name} profile`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                        {initials}
                      </span>
                    )}
                    <span>{userLabel}</span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold transition ${
                        isAccountMenuOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                          isAccountMenuOpen ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        ▾
                      </span>
                    </span>
                  </button>
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
                      {sellerMenuItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-700"
                          onClick={() => run(item.action)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-slate-700 transition hover:border-purple-200 hover:text-purple-700"
                    onClick={() => {
                      setIsAccountMenuOpen((prev) => !prev)
                      setIsNotificationsOpen(false)
                    }}
                    aria-haspopup="menu"
                    aria-expanded={isAccountMenuOpen}
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={`${user.name} profile`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                        {initials}
                      </span>
                    )}
                    <span>{userLabel}</span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold transition ${
                        isAccountMenuOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                          isAccountMenuOpen ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        ▾
                      </span>
                    </span>
                  </button>
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
                      {buyerMenuItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-700"
                          onClick={() => run(item.action)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {canSwitchMode && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-purple-200 px-4 text-base text-purple-700 hover:bg-purple-50"
                  onClick={() => run(() => onSwitchMode(user.isSeller ? 'buyer' : 'seller'))}
                >
                  {switchLabel}
                </Button>
              )}
              <Button
                variant="ghost"
                className="h-11 px-4 text-base text-slate-600"
                onClick={() => run(onLogout)}
              >
                Sign out
              </Button>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-purple-100 bg-purple-50 text-sm font-semibold text-purple-700 transition hover:border-purple-200 hover:bg-purple-100 sm:hidden"
              onClick={() => run(onProfile)}
              aria-label="Open profile"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={`${user.name} profile`}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-purple-200 hover:text-purple-700 sm:hidden"
              onClick={() => {
                setIsMenuOpen((prev) => !prev)
                setIsAccountMenuOpen(false)
                setIsNotificationsOpen(false)
              }}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            {isMenuOpen && (
              <div className="mt-3 w-full space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm sm:hidden">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={`${user.name} profile`}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                        {initials}
                      </span>
                    )}
                    <div>
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900">{userLabel}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full text-left transition hover:text-purple-600"
                  onClick={() => run(onMarketplace)}
                >
                  Marketplace
                </button>
                {showBecomeSeller && (
                  <button
                    type="button"
                    className="w-full text-left transition hover:text-purple-600"
                    onClick={() => run(onBecomeSeller)}
                  >
                    Become a Seller
                  </button>
                )}
                <button
                  type="button"
                  className="relative w-full text-left transition hover:text-purple-600"
                  onClick={() => run(onChat)}
                >
                  Messages
                  {unreadMessageCount > 0 && (
                    <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-purple-600 px-1.5 py-[1px] text-[10px] font-semibold leading-4 text-white">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </button>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-slate-800"
                    onClick={() => {
                      setIsNotificationsOpen((prev) => !prev)
                      setIsAccountMenuOpen(false)
                    }}
                  >
                    <span>
                      Notifications
                      {notificationUnreadCount > 0 ? ` (${notificationUnreadCount})` : ''}
                    </span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold transition ${
                        isNotificationsOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                          isNotificationsOpen ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        ▾
                      </span>
                    </span>
                  </button>
                  {isNotificationsOpen && (
                    <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                      {notificationUnreadCount > 0 && (
                        <button
                          type="button"
                          className="w-full rounded-lg px-2 py-2 text-left text-xs font-semibold text-purple-700 transition hover:bg-purple-50"
                          onClick={() => run(onMarkAllNotificationsRead)}
                        >
                          Mark all read
                        </button>
                      )}
                      {!hasNotifications && (
                        <p className="rounded-lg px-2 py-2 text-xs font-medium text-slate-500">
                          No notifications yet.
                        </p>
                      )}
                      {latestNotifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`w-full rounded-lg px-2 py-2 text-left text-xs font-medium transition ${
                            item.unread ? 'bg-purple-50 text-slate-700' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                          onClick={() =>
                            run(() => {
                              onMarkNotificationRead(item.id)
                              onOpenNotification(item)
                            })
                          }
                        >
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          {item.body && <p className="mt-1 text-slate-600">{item.body}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {user.isSeller ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left text-slate-800"
                      onClick={() => {
                        setIsAccountMenuOpen((prev) => !prev)
                        setIsNotificationsOpen(false)
                      }}
                    >
                      <span>Seller menu</span>
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold transition ${
                          isAccountMenuOpen ? 'rotate-180' : ''
                        }`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                            isAccountMenuOpen ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          ▾
                        </span>
                      </span>
                    </button>
                    {isAccountMenuOpen && (
                      <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                        {sellerMenuItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => run(item.action)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left text-slate-800"
                      onClick={() => {
                        setIsAccountMenuOpen((prev) => !prev)
                        setIsNotificationsOpen(false)
                      }}
                    >
                      <span>Buyer menu</span>
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold transition ${
                          isAccountMenuOpen ? 'rotate-180' : ''
                        }`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                            isAccountMenuOpen ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          ▾
                        </span>
                      </span>
                    </button>
                    {isAccountMenuOpen && (
                      <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                        {buyerMenuItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => run(item.action)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
