import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import SellerGigCreateView from '@/frontend/views/SellerGigCreateView.jsx'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  in_progress: 'bg-sky-50 text-sky-700 border-sky-100',
  delivered: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
}

const formatStatus = (status) => (status || 'pending').replace('_', ' ')
const getOrderId = (order) => order?._id || order?.id || ''

function SellerDashboardView({
  user,
  buyerOrders = [],
  sellerOrders = [],
  newGig,
  gigErrors,
  gigMedia,
  isUploadingMedia,
  userSellerId,
  inputClasses,
  categoryOptions = [],
  myGigs = [],
  formatter,
  onOpenGigFromOrder,
  onOpenChatFromOrder,
  onRequestOrderCancel,
  onRequestOrderComplete,
  onBackToDashboard,
  onOpenProfile,
  onOpenLogin,
  onOpenSignup,
  onStartApplication,
  onOpenSellerProfile,
  onGigChange,
  onAddPackage,
  onPackageChange,
  onRemovePackage,
  onGigFiles,
  onRemoveGigMedia,
  onCreateGig,
}) {
  const [ordersTab, setOrdersTab] = useState('incoming')

  const incomingOrders = useMemo(
    () => sellerOrders.filter((order) => !['complete', 'cancelled'].includes(order.status)),
    [sellerOrders],
  )
  const outgoingOrders = useMemo(
    () => buyerOrders.filter((order) => !['complete', 'cancelled'].includes(order.status)),
    [buyerOrders],
  )
  const historyOrders = useMemo(() => {
    const map = new Map()
    ;[...sellerOrders, ...buyerOrders].forEach((order) => {
      const id = getOrderId(order)
      if (id) map.set(id, order)
    })
    return Array.from(map.values()).filter((order) =>
      ['complete', 'cancelled'].includes(order.status),
    )
  }, [buyerOrders, sellerOrders])

  const visibleOrders = ordersTab === 'incoming'
    ? incomingOrders
    : ordersTab === 'outgoing'
      ? outgoingOrders
      : historyOrders

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

  if (!user.isSeller) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">Become a seller</p>
          <p className="text-sm text-slate-600">
            Complete your seller profile to access gigs and order tracking.
          </p>
          <Button type="button" className="bg-purple-600 text-white hover:bg-purple-500" onClick={onStartApplication}>
            Start seller application
          </Button>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="-mx-4 rounded-[36px] border border-slate-200 bg-white p-10 shadow-lg sm:-mx-8 sm:p-12 lg:-mx-12">
        <div className="rounded-[28px] border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-amber-50 px-6 py-6 shadow-sm sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-500">Seller tools</p>
              <h2 className="mt-2 text-4xl font-semibold text-slate-900 sm:text-5xl">Orders & gigs</h2>
            <p className="mt-2 text-base text-slate-600 sm:text-lg">
              Track orders like Fiverr and keep your gigs updated in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="px-5 text-slate-700" onClick={onBackToDashboard}>
              Dashboard
            </Button>
            <Button variant="outline" className="px-5 text-slate-700" onClick={onOpenProfile}>
              Profile
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold text-slate-500">Incoming</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{incomingOrders.length}</p>
            <p className="text-xs text-slate-500">Active orders</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold text-slate-500">Outgoing</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{outgoingOrders.length}</p>
            <p className="text-xs text-slate-500">In progress</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold text-slate-500">Past</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{historyOrders.length}</p>
            <p className="text-xs text-slate-500">Closed</p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
              ordersTab === 'incoming'
                ? 'border border-purple-300 bg-purple-50 text-purple-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:text-purple-700'
            }`}
            onClick={() => setOrdersTab('incoming')}
          >
            Incoming ({incomingOrders.length})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
              ordersTab === 'outgoing'
                ? 'border border-purple-300 bg-purple-50 text-purple-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:text-purple-700'
            }`}
            onClick={() => setOrdersTab('outgoing')}
          >
            Outgoing ({outgoingOrders.length})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
              ordersTab === 'history'
                ? 'border border-purple-300 bg-purple-50 text-purple-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:text-purple-700'
            }`}
            onClick={() => setOrdersTab('history')}
          >
            Past ({historyOrders.length})
          </button>
        </div>

        <div className="space-y-4">
          {visibleOrders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              No orders in this view yet.
            </div>
          )}
          {visibleOrders.map((order) => {
            const orderId = getOrderId(order)
            const buyerCompleted = Boolean(order.buyerCompletedAt)
            const sellerCompleted = Boolean(order.sellerCompletedAt)
            const userId = user._id || user.id
            const isBuyer = order.buyer?.toString?.() === userId || order.buyer === userId
            const isSeller = order.seller?.toString?.() === userId || order.seller === userId
            const yourCompleted = isBuyer ? buyerCompleted : isSeller ? sellerCompleted : false
            const otherCompleted = isBuyer ? sellerCompleted : buyerCompleted
            const awaitingOther = (buyerCompleted || sellerCompleted) && !otherCompleted
            const canMarkComplete =
              !yourCompleted && order.status !== 'complete' && order.status !== 'cancelled'
            const messageLabel = ordersTab === 'incoming'
              ? 'Message buyer'
              : ordersTab === 'outgoing'
                ? 'Message seller'
                : isSeller
                  ? 'Message buyer'
                  : 'Message seller'
            return (
              <div key={orderId} className="rounded-[28px] border border-slate-100 bg-white px-7 py-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{order.gigTitle}</p>
                    <p className="text-xs text-slate-500">Gig ID: {order.gigId}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusStyles[order.status] || statusStyles.pending}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-lg font-semibold text-slate-900">{formatter.format(order.price || 0)}</span>
                  {order.deliveryDate && (
                    <span className="text-xs text-slate-500">
                      Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {order.notes && <p className="mt-2 text-sm text-slate-700">{order.notes}</p>}
                {order.cancelReason && (
                  <p className="mt-2 text-sm text-rose-700">
                    Cancelled{order.cancelledBy ? ` by ${order.cancelledBy}` : ''}: {order.cancelReason}
                  </p>
                )}

                {order.status !== 'cancelled' && (
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      Your confirmation: {yourCompleted ? 'Done' : 'Pending'}
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      Other party: {otherCompleted ? 'Done' : 'Pending'}
                    </div>
                  </div>
                )}

                {awaitingOther && order.status !== 'complete' && order.status !== 'cancelled' && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    Awaiting other party confirmation.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-200 text-slate-800 hover:bg-slate-50"
                    onClick={() => onOpenGigFromOrder?.({ id: order.gigId })}
                  >
                    View gig
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => onOpenChatFromOrder?.(order)}
                  >
                    {messageLabel}
                  </Button>
                  {order.status !== 'complete' && order.status !== 'cancelled' && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onRequestOrderComplete?.(orderId)}
                        disabled={!canMarkComplete}
                      >
                        {yourCompleted ? 'Completion recorded' : 'Mark complete'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        onClick={() => onRequestOrderCancel?.(orderId)}
                      >
                        Cancel with reason
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      </section>

      <SellerGigCreateView
        user={user}
        userGigCount={myGigs.length}
        userSellerId={userSellerId}
        inputClasses={inputClasses}
        categoryOptions={categoryOptions}
        newGig={newGig}
        gigErrors={gigErrors}
        gigMedia={gigMedia}
        isUploadingMedia={isUploadingMedia}
        myGigs={myGigs}
        formatter={formatter}
        onOpenSellerProfile={onOpenSellerProfile}
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
      />
    </>
  )
}

export default SellerDashboardView
