import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import SellerGigCreateView from '@/frontend/views/SellerGigCreateView.jsx'

const ongoingStatuses = new Set(['pending', 'in_progress', 'delivered'])
const getOrderId = (order) => order?._id || order?.id || ''
const normalizeStatus = (status) => (status || 'pending').toLowerCase()

function SellerDashboardView({
  user,
  sellerOrders = [],
  newGig,
  gigErrors,
  gigMedia,
  isUploadingMedia,
  inputClasses,
  categoryOptions = [],
  myGigs = [],
  formatter,
  onOpenProfile,
  onOpenLogin,
  onOpenSignup,
  onStartApplication,
  onGigChange,
  onAddPackage,
  onPackageChange,
  onRemovePackage,
  onGigFiles,
  onRemoveGigMedia,
  onCreateGig,
  isEditingGig = false,
  onCancelEditGig,
  showCreateGigPanel = true,
  showDashboardPanel = true,
}) {
  const incomingOrders = useMemo(() => {
    const merged = new Map()
    sellerOrders.forEach((order) => {
      const id = getOrderId(order)
      if (!id) return
      merged.set(id, order)
    })
    return Array.from(merged.values())
  }, [sellerOrders])

  const ongoingOrders = useMemo(
    () => incomingOrders.filter((order) => ongoingStatuses.has(normalizeStatus(order.status))),
    [incomingOrders],
  )
  const completedOrders = useMemo(
    () => incomingOrders.filter((order) => normalizeStatus(order.status) === 'complete'),
    [incomingOrders],
  )
  const cancelledOrders = useMemo(
    () => incomingOrders.filter((order) => normalizeStatus(order.status) === 'cancelled'),
    [incomingOrders],
  )
  const averageOrderValue = useMemo(() => {
    const billableOrders = incomingOrders.filter((order) => normalizeStatus(order.status) !== 'cancelled')
    if (!billableOrders.length) return 0
    const total = billableOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0)
    return total / billableOrders.length
  }, [incomingOrders])

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">Sign in to access seller tools</p>
          <p className="text-sm text-slate-600">
            Create gigs and manage orders once you are signed in.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="bg-purple-600 text-white hover:bg-purple-500" onClick={onOpenLogin}>
              Log in
            </Button>
            <Button type="button" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={onOpenSignup}>
              Sign up
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (!user?.isSeller) {
    const isSellerAccount = user?.role === 'seller'
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">
            {isSellerAccount ? 'Seller mode is off' : 'Become a seller'}
          </p>
          <p className="text-sm text-slate-600">
            {isSellerAccount
              ? 'Switch to seller mode from the top bar to access gigs and order tracking.'
              : 'Complete your seller profile to access gigs and order tracking.'}
          </p>
          {isSellerAccount ? (
            <Button
              type="button"
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={onOpenProfile}
            >
              Open profile
            </Button>
          ) : (
            <Button type="button" className="bg-purple-600 text-white hover:bg-purple-500" onClick={onStartApplication}>
              Start seller application
            </Button>
          )}
        </div>
      </section>
    )
  }

  return (
    <>
      {showCreateGigPanel && (
        <SellerGigCreateView
          user={user}
          userGigCount={myGigs.length}
          inputClasses={inputClasses}
          categoryOptions={categoryOptions}
          newGig={newGig}
          gigErrors={gigErrors}
          gigMedia={gigMedia}
          isUploadingMedia={isUploadingMedia}
          myGigs={myGigs}
          formatter={formatter}
          onOpenLogin={onOpenLogin}
          onOpenSignup={onOpenSignup}
          onStartApplication={onStartApplication}
          onGigChange={onGigChange}
          onAddPackage={onAddPackage}
          onPackageChange={onPackageChange}
          onRemovePackage={onRemovePackage}
          onGigFiles={onGigFiles}
          onRemoveGigMedia={onRemoveGigMedia}
          onCreateGig={onCreateGig}
          isEditingGig={isEditingGig}
          onCancelEditGig={onCancelEditGig}
        />
      )}

      {showDashboardPanel && (
        <div className="space-y-8">
          <section
            id="seller-dashboard"
            className="-mx-4 rounded-[36px] border border-slate-200 bg-white p-10 shadow-lg sm:-mx-8 sm:p-12 lg:-mx-12"
          >
            <div className="rounded-[28px] border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-amber-50 px-6 py-6 shadow-sm sm:px-8 sm:py-7">
              <div>
                <div>
                  <h2 className="mt-2 text-4xl font-semibold text-slate-900 sm:text-5xl">Dashboard</h2>
                  <p className="mt-2 text-base text-slate-600 sm:text-lg">
                    Seller summary at a glance.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                  <p className="text-xs font-semibold text-slate-500">Live gigs</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{myGigs.length}</p>
                  <p className="text-xs text-slate-500">Currently published</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                  <p className="text-xs font-semibold text-slate-500">Ongoing orders</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{ongoingOrders.length}</p>
                  <p className="text-xs text-slate-500">Pending, in progress, or delivered</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                  <p className="text-xs font-semibold text-slate-500">Completed</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{completedOrders.length}</p>
                  <p className="text-xs text-slate-500">Delivered successfully</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                  <p className="text-xs font-semibold text-slate-500">Avg order value</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {incomingOrders.length ? formatter.format(averageOrderValue) : '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {cancelledOrders.length} cancelled incoming order{cancelledOrders.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

    </>
  )
}

export default SellerDashboardView
