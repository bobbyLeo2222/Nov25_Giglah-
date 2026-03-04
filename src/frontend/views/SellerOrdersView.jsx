import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  filterOrdersByStatus,
  mergeSellerAndBuyerOrders,
  normalizeOrderStatus,
  sortOrdersByUpdatedAtDesc,
  summarizeOrders,
} from '@/frontend/orderUtils'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  in_progress: 'bg-sky-50 text-sky-700 border-sky-100',
  delivered: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
}

const formatStatus = (status) => (status || 'pending').replace(/_/g, ' ')
const getOrderId = (order) => order?._id || order?.id || ''
const getComparableId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value._id?.toString?.() || value.id?.toString?.() || ''
  return String(value)
}

function SellerOrdersView({
  user,
  mode = 'seller',
  buyerOrders = [],
  sellerOrders = [],
  sellerNameById = {},
  formatter,
  onOpenGigFromOrder,
  onOpenChatFromOrder,
  onRequestOrderAccept,
  onRequestOrderCancel,
  onRequestOrderComplete,
  onOpenLogin,
  onOpenSignup,
  onStartApplication,
  onOpenProfile,
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const isBuyerMode = mode === 'buyer'

  const allOrders = useMemo(() => {
    if (isBuyerMode) {
      return sortOrdersByUpdatedAtDesc(buyerOrders)
    }
    return mergeSellerAndBuyerOrders(sellerOrders, buyerOrders)
  }, [buyerOrders, isBuyerMode, sellerOrders])

  const orderSummary = useMemo(() => summarizeOrders(allOrders), [allOrders])
  const ongoingCount = orderSummary.active
  const completeCount = orderSummary.completed
  const cancelledCount = orderSummary.cancelled

  const visibleOrders = useMemo(() => filterOrdersByStatus(allOrders, statusFilter), [allOrders, statusFilter])

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">Sign in to access orders</p>
          <p className="text-sm text-slate-600">
            {isBuyerMode
              ? 'Track your order progress, delivery updates, and completion confirmations.'
              : 'Track incoming and outgoing seller orders once you are signed in.'}
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

  if (isBuyerMode && user?.isSeller) {
    const isSellerAccount = user?.role === 'seller'
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">
            {isSellerAccount ? 'Buyer mode is off' : 'Buyer mode unavailable'}
          </p>
          <p className="text-sm text-slate-600">
            {isSellerAccount
              ? 'Switch to buyer mode from the top bar to view your buyer orders.'
              : 'This area is available when your account is in buyer mode.'}
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={onOpenProfile}
          >
            Open profile
          </Button>
        </div>
      </section>
    )
  }

  if (!isBuyerMode && !user?.isSeller) {
    const isSellerAccount = user?.role === 'seller'
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">
            {isSellerAccount ? 'Seller mode is off' : 'Become a seller'}
          </p>
          <p className="text-sm text-slate-600">
            {isSellerAccount
              ? 'Switch to seller mode from the top bar to manage your orders.'
              : 'Complete your seller profile before managing incoming orders.'}
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
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-amber-50 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
            {isBuyerMode ? 'Buyer orders' : 'Seller orders'}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
            {isBuyerMode ? 'My Orders' : 'Orders'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isBuyerMode
              ? 'Track order progress, confirm completion, and message sellers quickly.'
              : 'Track status across all incoming and outgoing orders.'}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <p className="text-xs font-semibold text-slate-500">All</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{allOrders.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <p className="text-xs font-semibold text-slate-500">Ongoing</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{ongoingCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <p className="text-xs font-semibold text-slate-500">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{completeCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <p className="text-xs font-semibold text-slate-500">Cancelled</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{cancelledCount}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'border border-purple-300 bg-purple-50 text-purple-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:text-purple-700'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            All ({allOrders.length})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
              statusFilter === 'ongoing'
                ? 'border border-purple-300 bg-purple-50 text-purple-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:text-purple-700'
            }`}
            onClick={() => setStatusFilter('ongoing')}
          >
            Ongoing ({ongoingCount})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
              statusFilter === 'complete'
                ? 'border border-purple-300 bg-purple-50 text-purple-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:text-purple-700'
            }`}
            onClick={() => setStatusFilter('complete')}
          >
            Completed ({completeCount})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
              statusFilter === 'cancelled'
                ? 'border border-purple-300 bg-purple-50 text-purple-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:text-purple-700'
            }`}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        <div className="space-y-4">
          {visibleOrders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {isBuyerMode
                ? 'No buyer orders in this status yet. Start from a gig to place your first order.'
                : 'No orders in this status yet.'}
            </div>
          )}
          {visibleOrders.map((order) => {
            const orderId = getOrderId(order)
            const orderStatus = normalizeOrderStatus(order.status)
            const buyerCompleted = Boolean(order.buyerCompletedAt)
            const sellerCompleted = Boolean(order.sellerCompletedAt)
            const userId = String(user._id || user.id || '')
            const isBuyer = getComparableId(order.buyer) === userId
            const isSeller = getComparableId(order.seller) === userId
            const yourCompleted = isBuyer ? buyerCompleted : isSeller ? sellerCompleted : false
            const otherCompleted = isBuyer ? sellerCompleted : buyerCompleted
            const awaitingOther = (isBuyer || isSeller) && (buyerCompleted || sellerCompleted) && !otherCompleted
            const canMarkComplete = (isBuyer || isSeller) && !yourCompleted && orderStatus !== 'complete' && orderStatus !== 'cancelled'
            const canAcceptOrder = !isBuyerMode && order.flow === 'incoming' && orderStatus === 'pending' && isSeller
            const messageLabel = isBuyerMode
              ? 'Message seller'
              : order.flow === 'incoming'
                ? 'Message buyer'
                : 'Message seller'
            const orderFlowLabel = isBuyerMode ? 'Purchase' : order.flow === 'incoming' ? 'Incoming' : 'Outgoing'
            const sellerName = order.sellerName || sellerNameById[order.sellerId] || order.sellerId || 'Seller'
            const completionActionLabel = yourCompleted
              ? 'Completion recorded'
              : isBuyerMode
                ? 'Confirm completion'
                : 'Mark complete'
            const canCancelOrder =
              (isBuyer || isSeller) && orderStatus !== 'complete' && orderStatus !== 'cancelled'

            return (
              <div key={orderId} className="rounded-[28px] border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-7 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{order.gigTitle}</p>
                    <p className="text-xs text-slate-500">Gig ID: {order.gigId}</p>
                    {isBuyerMode && (
                      <p className="mt-1 text-xs text-slate-500">
                        Seller: <span className="font-semibold text-slate-700">{sellerName}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700">
                      {orderFlowLabel}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusStyles[orderStatus] || statusStyles.pending}`}>
                      {formatStatus(orderStatus)}
                    </span>
                  </div>
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

                {orderStatus !== 'cancelled' && (
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      Your confirmation: {yourCompleted ? 'Done' : 'Pending'}
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      Other party: {otherCompleted ? 'Done' : 'Pending'}
                    </div>
                  </div>
                )}

                {awaitingOther && orderStatus !== 'complete' && orderStatus !== 'cancelled' && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    Awaiting other party confirmation.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-200 text-slate-800 hover:bg-slate-50"
                    onClick={() =>
                      onOpenGigFromOrder?.({
                        id: order.gigId,
                        title: order.gigTitle,
                        sellerId: order.sellerId || '',
                      })
                    }
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
                  {canAcceptOrder && (
                    <Button
                      type="button"
                      className="bg-purple-600 text-white hover:bg-purple-500"
                      onClick={() => onRequestOrderAccept?.(orderId)}
                    >
                      Accept order
                    </Button>
                  )}
                  {orderStatus !== 'complete' && orderStatus !== 'cancelled' && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onRequestOrderComplete?.(orderId)}
                        disabled={!canMarkComplete}
                      >
                        {completionActionLabel}
                      </Button>
                      {canCancelOrder && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => onRequestOrderCancel?.(orderId)}
                        >
                          {isBuyerMode ? 'Cancel order' : 'Cancel with reason'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SellerOrdersView
