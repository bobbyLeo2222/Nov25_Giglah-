import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  filterOrdersByStatus,
  isOngoingOrderStatus,
  mergeSellerAndBuyerOrders,
  normalizeOrderStatus,
  sortOrdersByUpdatedAtDesc,
  summarizeOrders,
} from '@/frontend/orderUtils'
import { timeAgo } from '@/frontend/helpers'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  in_progress: 'bg-sky-50 text-sky-700 border-sky-100',
  awaiting_completion: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
}

const formatStatus = (status) => {
  const normalized = status || 'pending'
  if (normalized === 'pending') return 'awaiting confirmation'
  return normalized.replace(/_/g, ' ')
}

const formatOrderReference = (order) => {
  const rawId = String(getOrderId(order) || '').replace(/[^a-z0-9]/gi, '').toUpperCase()
  return rawId ? `#FO${rawId.slice(-10)}` : '#FO00000000'
}

const formatOrderDate = (value) => {
  const timestamp = new Date(value || 0).getTime()
  if (!timestamp) return 'Not set'
  return new Intl.DateTimeFormat('en-SG', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp)
}

const getDurationLabel = (order) => {
  if (!order?.deliveryDate) return 'Custom timeline'
  const start = new Date(order.acceptedAt || order.createdAt || Date.now()).getTime()
  const end = new Date(order.deliveryDate).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 'Custom timeline'
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
  return `${days} day${days === 1 ? '' : 's'}`
}
const getOrderId = (order) => order?._id || order?.id || ''
const getComparableId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value._id?.toString?.() || value.id?.toString?.() || ''
  return String(value)
}

const getCompletionRequesterRole = (order) => {
  const explicit = String(order?.completionRequestedBy || '').toLowerCase()
  if (explicit) return explicit
  const buyerCompleted = Boolean(order?.buyerCompletedAt)
  const sellerCompleted = Boolean(order?.sellerCompletedAt)
  if (buyerCompleted && !sellerCompleted) return 'buyer'
  if (sellerCompleted && !buyerCompleted) return 'seller'
  return ''
}

function SellerOrdersView({
  user,
  mode = 'seller',
  buyerOrders = [],
  sellerOrders = [],
  sellerNameById = {},
  preselectedOrderId = '',
  formatter,
  onOpenGigFromOrder,
  onOpenChatFromOrder,
  onOpenOrderHistory,
  onRequestOrderAccept,
  onRequestOrderCancel,
  onRequestOrderComplete,
  onRequestOrderRejectCompletion,
  onOpenLogin,
  onOpenSignup,
  onStartApplication,
  onOpenProfile,
}) {
  const isBuyerMode = mode === 'buyer'
  const [statusFilter, setStatusFilter] = useState(() => (isBuyerMode ? 'ongoing' : 'all'))
  const [manualSelectedOrderId, setManualSelectedOrderId] = useState('')
  const [cancelCardOrder, setCancelCardOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

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
  const liveOrders = useMemo(
    () => sortOrdersByUpdatedAtDesc(allOrders.filter((order) => isOngoingOrderStatus(order?.status))),
    [allOrders],
  )
  const selectedLiveOrderId = useMemo(() => {
    const hasPreselectedOrder = liveOrders.some(
      (order) => String(order?._id || order?.id || '') === String(preselectedOrderId || ''),
    )
    if (hasPreselectedOrder) return String(preselectedOrderId || '')

    const hasManualSelection = liveOrders.some(
      (order) => String(order?._id || order?.id || '') === String(manualSelectedOrderId || ''),
    )
    if (hasManualSelection) return String(manualSelectedOrderId || '')

    return String(liveOrders[0]?._id || liveOrders[0]?.id || '')
  }, [liveOrders, manualSelectedOrderId, preselectedOrderId])
  const selectedLiveOrder = useMemo(
    () =>
      liveOrders.find((order) => String(order?._id || order?.id || '') === String(selectedLiveOrderId || '')) ||
      liveOrders[0] ||
      null,
    [liveOrders, selectedLiveOrderId],
  )

  const visibleOrders = useMemo(() => filterOrdersByStatus(allOrders, statusFilter), [allOrders, statusFilter])

  const closeCancelCard = () => {
    setCancelCardOrder(null)
    setCancelReason('')
  }

  const openCancelCard = (order) => {
    const userId = String(user?._id || user?.id || '')
    const isBuyer = getComparableId(order?.buyer) === userId
    const isSeller = getComparableId(order?.seller) === userId
    const otherPartyRequestedCancellation =
      (isBuyer && order?.sellerCancellationRequestedAt) ||
      (isSeller && order?.buyerCancellationRequestedAt)

    if (otherPartyRequestedCancellation) {
      onRequestOrderCancel?.(order, '')
      return
    }

    setCancelCardOrder(order)
    setCancelReason('')
  }

  const submitCancellation = () => {
    if (!cancelCardOrder) return
    onRequestOrderCancel?.(cancelCardOrder, cancelReason.trim())
    closeCancelCard()
  }

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">Sign in to access orders</p>
          <p className="text-sm text-slate-600">
            {isBuyerMode
              ? 'Track your order progress, completion requests, and final confirmations.'
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
              ? 'Track progress, request completion, and respond to seller confirmations.'
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

        {liveOrders.length > 0 && selectedLiveOrder ? (
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-3">
              <div className="mb-3 flex items-center justify-between px-2">
                <p className="text-sm font-semibold text-slate-900">Live workspace</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-purple-700">
                  {liveOrders.length}
                </span>
              </div>
              <div className="space-y-2">
                {liveOrders.map((order) => {
                  const orderId = getOrderId(order)
                  const orderStatus = normalizeOrderStatus(order.status)
                  const counterpart = isBuyerMode
                    ? order.sellerName || sellerNameById[order.sellerId] || order.sellerId || 'Seller'
                    : order.buyerName || 'Buyer'
                  const isSelected = orderId === getOrderId(selectedLiveOrder)

                  return (
                    <button
                      key={orderId}
                      type="button"
                      onClick={() => setManualSelectedOrderId(orderId)}
                      className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                        isSelected
                          ? 'border-purple-200 bg-white shadow-sm'
                          : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{order.gigTitle}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{counterpart}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyles[orderStatus] || statusStyles.pending}`}>
                          {formatStatus(orderStatus)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>{formatter.format(order.price || 0)}</span>
                        <span>{timeAgo(order.updatedAt || order.createdAt)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </aside>

            <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-6">
              {(() => {
                const order = selectedLiveOrder
                const orderStatus = normalizeOrderStatus(order.status)
                const userId = String(user._id || user.id || '')
                const isBuyer = getComparableId(order.buyer) === userId
                const isSeller = getComparableId(order.seller) === userId
                const requesterRole = getCompletionRequesterRole(order)
                const userRole = isBuyer ? 'buyer' : isSeller ? 'seller' : ''
                const isResponder =
                  orderStatus === 'awaiting_completion' &&
                  Boolean(userRole && requesterRole && requesterRole !== userRole)
                const canRequestCompletion = (isBuyer || isSeller) && orderStatus === 'in_progress'
                const canConfirmCompletion = isResponder
                const canRejectCompletion = isResponder
                const canAcceptOrder = !isBuyerMode && order.flow === 'incoming' && orderStatus === 'pending' && isSeller
                const canCancelOrder = (isBuyer || isSeller) && orderStatus !== 'complete' && orderStatus !== 'cancelled'
                const buyerCancelRequested = Boolean(order.buyerCancellationRequestedAt)
                const sellerCancelRequested = Boolean(order.sellerCancellationRequestedAt)
                const otherPartyRequestedCancellation =
                  (isBuyer && sellerCancelRequested) || (isSeller && buyerCancelRequested)
                const counterpartLabel = isBuyerMode
                  ? order.sellerName || sellerNameById[order.sellerId] || order.sellerId || 'Seller'
                  : order.buyerName || 'Buyer'

	                return (
	                  <div className="space-y-5">
	                    <div className="rounded-[28px] border border-slate-200 bg-white">
	                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
	                        <div>
	                          <div className="flex flex-wrap items-center gap-2">
	                            <p className="text-2xl font-semibold text-slate-900">
	                              Order {formatOrderReference(order)}
	                            </p>
	                            <button
	                              type="button"
	                              className="text-xs font-semibold text-purple-700 transition hover:text-purple-600"
	                              onClick={() => onOpenGigFromOrder?.({
	                                id: order.gigId,
	                                title: order.gigTitle,
	                                sellerId: order.sellerId || '',
	                              })}
	                            >
	                              View Gig
	                            </button>
	                          </div>
	                          <p className="mt-2 text-sm text-slate-600">
	                            {isBuyerMode ? 'Seller' : 'Buyer'}:{' '}
	                            <span className="font-semibold text-slate-800">{counterpartLabel}</span>
	                            <span className="mx-2 text-slate-300">|</span>
	                            {formatOrderDate(order.createdAt)}
	                          </p>
	                        </div>
	                        <div className="text-right">
	                          <p className="text-4xl font-semibold text-slate-900">{formatter.format(order.price || 0)}</p>
	                          <span className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
	                            Custom Order
	                          </span>
	                        </div>
	                      </div>

	                      <div className="border-b border-slate-200 px-5 py-4 text-sm text-slate-700">
	                        {order.notes || order.gigTitle}
	                      </div>

	                      <div className="overflow-hidden px-5 py-4">
	                        <div className="grid grid-cols-[minmax(0,1fr)_80px_110px_110px] items-center gap-3 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
	                          <span>Item</span>
	                          <span className="text-right">Quantity</span>
	                          <span className="text-right">Duration</span>
	                          <span className="text-right">Amount</span>
	                        </div>
	                        <div className="grid grid-cols-[minmax(0,1fr)_80px_110px_110px] items-center gap-3 border-b border-slate-100 py-3 text-sm text-slate-700">
	                          <span className="truncate font-medium text-slate-900">{order.gigTitle}</span>
	                          <span className="text-right">1</span>
	                          <span className="text-right">{getDurationLabel(order)}</span>
	                          <span className="text-right font-medium text-slate-900">{formatter.format(order.price || 0)}</span>
	                        </div>
	                        <div className="flex justify-end pt-3 text-sm">
	                          <div className="w-full max-w-[240px] space-y-2">
	                            <div className="flex items-center justify-between text-slate-600">
	                              <span>Total</span>
	                              <span className="font-semibold text-slate-900">{formatter.format(order.price || 0)}</span>
	                            </div>
	                          </div>
	                        </div>
	                      </div>
	                    </div>

	                    {order.notes ? (
	                      <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 text-center shadow-sm">
	                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
	                          Order Requirements
	                        </p>
	                        <p className="mt-3 text-sm text-slate-600">
	                          {isBuyerMode
	                            ? 'Your submitted order requirements are attached to this order.'
	                            : 'Your buyer has filled out the order requirements for this gig.'}
	                        </p>
	                        <p className="mt-3 text-sm leading-7 text-slate-800">{order.notes}</p>
	                      </div>
	                    ) : null}

                    {(buyerCancelRequested || sellerCancelRequested) && orderStatus !== 'cancelled' ? (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4">
                        <p className="text-sm font-semibold text-rose-800">Cancellation pending</p>
                        <p className="mt-2 text-sm text-rose-700">
                          {otherPartyRequestedCancellation
                            ? 'The other party already requested cancellation. Add your own reason to confirm it.'
                            : 'Your cancellation request is waiting for the other party to confirm.'}
                        </p>
                      </div>
                    ) : null}

                    {orderStatus === 'awaiting_completion' && requesterRole ? (
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-700">
                        {requesterRole === 'buyer' ? 'Buyer' : 'Seller'} requested completion confirmation.
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
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
                        Open chat
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={() => onOpenOrderHistory?.(order)}
                      >
                        Full history
                      </Button>
                      {canAcceptOrder && (
                        <Button
                          type="button"
                          className="bg-purple-600 text-white hover:bg-purple-500"
                          onClick={() => onRequestOrderAccept?.(order)}
                        >
                          Accept gig
                        </Button>
                      )}
                      {canRequestCompletion && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => onRequestOrderComplete?.(order)}
                        >
                          Request completion
                        </Button>
                      )}
                      {canConfirmCompletion && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => onRequestOrderComplete?.(order)}
                        >
                          Confirm completion
                        </Button>
                      )}
                      {canRejectCompletion && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={() => onRequestOrderRejectCompletion?.(order)}
                        >
                          Reject completion
                        </Button>
                      )}
                      {canCancelOrder && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => openCancelCard(order)}
                        >
                          {otherPartyRequestedCancellation ? 'Confirm cancellation' : 'Request cancellation'}
                        </Button>
                      )}
                    </div>

	                    <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 text-center shadow-sm">
	                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
	                        Order Started
	                      </p>
	                      <p className="mt-3 text-sm font-semibold text-slate-900">
	                        {orderStatus === 'pending'
	                          ? 'Waiting for the seller to accept this order.'
	                          : orderStatus === 'in_progress'
	                            ? 'The order countdown is now ticking.'
	                            : 'One party requested completion and the other party needs to respond.'}
	                      </p>
	                      <p className="mt-2 text-sm text-slate-600">
	                        {orderStatus === 'pending'
	                          ? 'Review the requirements and accept the order when you are ready to begin.'
	                          : orderStatus === 'in_progress'
	                            ? "Don't waste your time reading this message, go straight to the chat and continue the gig."
	                            : 'Use the actions below to confirm or reject the completion request.'}
	                      </p>
	                      {buyerCancelRequested ? (
	                        <p className="mt-2 text-sm text-rose-700">
	                          Buyer reason: <span className="font-semibold">{order.buyerCancellationReason}</span>
                        </p>
                      ) : null}
                      {sellerCancelRequested ? (
                        <p className="mt-2 text-sm text-rose-700">
                          Seller reason: <span className="font-semibold">{order.sellerCancellationReason}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        ) : null}

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
            const userId = String(user._id || user.id || '')
            const isBuyer = getComparableId(order.buyer) === userId
            const isSeller = getComparableId(order.seller) === userId
            const requesterRole = getCompletionRequesterRole(order)
            const userRole = isBuyer ? 'buyer' : isSeller ? 'seller' : ''
            const otherRole = userRole === 'buyer' ? 'seller' : userRole === 'seller' ? 'buyer' : ''
            const isRequester = Boolean(userRole && requesterRole === userRole)
            const isResponder = orderStatus === 'awaiting_completion' && Boolean(userRole && requesterRole && requesterRole !== userRole)
            const canRequestCompletion = (isBuyer || isSeller) && orderStatus === 'in_progress'
            const canConfirmCompletion = isResponder
            const canRejectCompletion = isResponder
            const canAcceptOrder = !isBuyerMode && order.flow === 'incoming' && orderStatus === 'pending' && isSeller
            const canCancelOrder = (isBuyer || isSeller) && orderStatus !== 'complete' && orderStatus !== 'cancelled'
            const buyerCancelRequested = Boolean(order.buyerCancellationRequestedAt)
            const sellerCancelRequested = Boolean(order.sellerCancellationRequestedAt)
            const hasPendingCancellation =
              orderStatus !== 'cancelled' && (buyerCancelRequested || sellerCancelRequested)
            const otherPartyRequestedCancellation =
              (isBuyer && sellerCancelRequested) || (isSeller && buyerCancelRequested)
            const messageLabel = isBuyerMode
              ? 'Message seller'
              : order.flow === 'incoming'
                ? 'Message buyer'
                : 'Message seller'
            const orderFlowLabel = isBuyerMode ? 'Purchase' : order.flow === 'incoming' ? 'Incoming' : 'Outgoing'
            const sellerName = order.sellerName || sellerNameById[order.sellerId] || order.sellerId || 'Seller'
            const completionActionLabel = orderStatus === 'awaiting_completion' ? 'Confirm completion' : 'Request completion'
            const cancellationActionLabel = otherPartyRequestedCancellation
              ? 'Confirm cancellation'
              : 'Request cancellation'
            const completionStatusLabel =
              orderStatus === 'pending'
                ? 'Awaiting seller confirmation'
                : orderStatus === 'awaiting_completion'
                ? requesterRole
                  ? `Awaiting ${requesterRole === 'buyer' ? 'seller' : 'buyer'} confirmation`
                  : 'Awaiting confirmation'
                : orderStatus === 'complete'
                  ? 'Order completed'
                  : orderStatus === 'cancelled'
                    ? 'Order cancelled'
                    : 'Work in progress'

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

                {hasPendingCancellation && (
                  <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {otherPartyRequestedCancellation
                      ? 'The other party requested cancellation. Confirm with your own reason to cancel this order.'
                      : 'Your cancellation request is waiting for the other party to confirm.'}
                    {order.buyerCancellationReason ? (
                      <p className="mt-1">
                        Buyer reason: <span className="font-semibold">{order.buyerCancellationReason}</span>
                      </p>
                    ) : null}
                    {order.sellerCancellationReason ? (
                      <p className="mt-1">
                        Seller reason: <span className="font-semibold">{order.sellerCancellationReason}</span>
                      </p>
                    ) : null}
                  </div>
                )}

                {orderStatus !== 'cancelled' && (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {completionStatusLabel}
                    </div>
                    {orderStatus === 'awaiting_completion' && requesterRole && (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                        Completion was requested by the {requesterRole}. {isRequester ? 'Waiting for the other party to respond.' : `You can confirm or reject and return the order to ${otherRole ? otherRole.replace('_', ' ') : 'progress'}.`}
                      </div>
                    )}
                    {orderStatus === 'in_progress' && order.completionRejectedAt && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        The last completion request was rejected{order.completionRejectedBy ? ` by the ${order.completionRejectedBy}` : ''}. The order is back in progress.
                      </div>
                    )}
                  </div>
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
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => onOpenOrderHistory?.(order)}
                  >
                    Open history
                  </Button>
                  {canAcceptOrder && (
                    <Button
                      type="button"
                      className="bg-purple-600 text-white hover:bg-purple-500"
                      onClick={() => onRequestOrderAccept?.(order)}
                    >
                      Accept order
                    </Button>
                  )}
                  {canRequestCompletion && (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => onRequestOrderComplete?.(order)}
                    >
                      {completionActionLabel}
                    </Button>
                  )}
                  {canConfirmCompletion && (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => onRequestOrderComplete?.(order)}
                    >
                      Confirm completion
                    </Button>
                  )}
                  {canRejectCompletion && (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => onRequestOrderRejectCompletion?.(order)}
                    >
                      Reject completion
                    </Button>
                  )}
                  {canCancelOrder && (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50"
                      onClick={() => openCancelCard(order)}
                    >
                      {cancellationActionLabel}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {cancelCardOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={closeCancelCard}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const userId = String(user?._id || user?.id || '')
              const isBuyer = getComparableId(cancelCardOrder.buyer) === userId
              const isSeller = getComparableId(cancelCardOrder.seller) === userId
              const otherPartyRequestedCancellation =
                (isBuyer && cancelCardOrder.sellerCancellationRequestedAt) ||
                (isSeller && cancelCardOrder.buyerCancellationRequestedAt)

              return (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                        {otherPartyRequestedCancellation ? 'Confirm cancellation' : 'Request cancellation'}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">
                        {cancelCardOrder.gigTitle}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {otherPartyRequestedCancellation
                          ? 'The other party already requested cancellation. Add your reason to confirm it.'
                          : 'Share a short reason before sending the cancellation request.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700 hover:bg-slate-200"
                      onClick={closeCancelCard}
                      aria-label="Close cancellation card"
                    >
                      x
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {cancelCardOrder.buyerCancellationReason ? (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                        Buyer reason: <span className="font-semibold">{cancelCardOrder.buyerCancellationReason}</span>
                      </div>
                    ) : null}
                    {cancelCardOrder.sellerCancellationReason ? (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                        Seller reason: <span className="font-semibold">{cancelCardOrder.sellerCancellationReason}</span>
                      </div>
                    ) : null}
                    <textarea
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-100"
                      placeholder="Add your cancellation reason..."
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="outline" onClick={closeCancelCard}>
                        Keep order
                      </Button>
                      <Button
                        type="button"
                        className="bg-rose-600 text-white hover:bg-rose-500"
                        onClick={submitCancellation}
                        disabled={!cancelReason.trim()}
                      >
                        {otherPartyRequestedCancellation ? 'Confirm cancellation' : 'Send request'}
                      </Button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default SellerOrdersView
