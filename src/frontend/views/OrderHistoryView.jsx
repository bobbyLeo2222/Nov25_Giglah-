import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { normalizeOrderStatus } from '@/frontend/orderUtils'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  in_progress: 'bg-sky-50 text-sky-700 border-sky-100',
  awaiting_completion: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
}

const getComparableId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value._id?.toString?.() || value.id?.toString?.() || ''
  return String(value)
}

const formatStatus = (status) => {
  const normalized = normalizeOrderStatus(status)
  if (normalized === 'pending') return 'awaiting confirmation'
  return normalized.replace(/_/g, ' ')
}

const formatDateTime = (value) => {
  if (!value) return ''
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return ''
  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
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

function OrderHistoryView({
  user,
  order = null,
  isLoading = false,
  formatter,
  onBack,
  onOpenGig,
  onOpenChat,
  onAccept,
  onCancel,
  onComplete,
  onRejectCompletion,
}) {
  const currentUserId = String(user?._id || user?.id || '')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelCard, setShowCancelCard] = useState(false)

  const orderMeta = useMemo(() => {
    if (!order) return null
    const orderStatus = normalizeOrderStatus(order.status)
    const buyerId = getComparableId(order.buyer)
    const sellerId = getComparableId(order.seller)
    const isBuyer = buyerId === currentUserId
    const isSeller = sellerId === currentUserId
    const userRole = isBuyer ? 'buyer' : isSeller ? 'seller' : ''
    const requesterRole = getCompletionRequesterRole(order)
    const isResponder =
      orderStatus === 'awaiting_completion' &&
      Boolean(userRole && requesterRole && requesterRole !== userRole)
    const buyerCancelRequested = Boolean(order.buyerCancellationRequestedAt)
    const sellerCancelRequested = Boolean(order.sellerCancellationRequestedAt)
    const hasPendingMutualCancellation =
      orderStatus !== 'cancelled' && (buyerCancelRequested || sellerCancelRequested)
    const otherPartyRequestedCancellation =
      (userRole === 'buyer' && sellerCancelRequested) || (userRole === 'seller' && buyerCancelRequested)

    return {
      orderStatus,
      isBuyer,
      isSeller,
      userRole,
      requesterRole,
      canAccept: isSeller && orderStatus === 'pending',
      canRequestCompletion: (isBuyer || isSeller) && orderStatus === 'in_progress',
      canConfirmCompletion: isResponder,
      canRejectCompletion: isResponder,
      canCancel:
        (isBuyer || isSeller) && orderStatus !== 'complete' && orderStatus !== 'cancelled',
      cancelActionLabel: otherPartyRequestedCancellation ? 'Confirm cancellation' : 'Request cancellation',
      hasPendingMutualCancellation,
      otherPartyRequestedCancellation,
    }
  }, [currentUserId, order])

  const historyItems = useMemo(() => {
    if (!order) return []
    const items = [
      {
        id: 'created',
        title: 'Gig initiated',
        description: order.notes ? `Buyer brief: ${order.notes}` : 'Order request created from the gig.',
        at: order.createdAt,
        tone: 'purple',
      },
    ]

    if (order.acceptedAt) {
      items.push({
        id: 'accepted',
        title: 'Gig accepted',
        description: 'The seller accepted the order and work officially started.',
        at: order.acceptedAt,
        tone: 'sky',
      })
    }

    if (order.buyerCancellationRequestedAt) {
      items.push({
        id: 'buyer-cancel-request',
        title: 'Buyer requested cancellation',
        description: order.buyerCancellationReason || 'A cancellation reason was provided.',
        at: order.buyerCancellationRequestedAt,
        tone: 'rose',
      })
    }

    if (order.sellerCancellationRequestedAt) {
      items.push({
        id: 'seller-cancel-request',
        title: 'Seller requested cancellation',
        description: order.sellerCancellationReason || 'A cancellation reason was provided.',
        at: order.sellerCancellationRequestedAt,
        tone: 'rose',
      })
    }

    if (order.completionRequestedAt) {
      items.push({
        id: 'completion-requested',
        title: 'Completion requested',
        description: `${
          order.completionRequestedBy === 'seller' ? 'Seller' : 'Buyer'
        } requested final confirmation.`,
        at: order.completionRequestedAt,
        tone: 'indigo',
      })
    }

    if (order.completionRejectedAt) {
      items.push({
        id: 'completion-rejected',
        title: 'Completion rejected',
        description:
          order.completionRejectedReason ||
          `The ${order.completionRejectedBy || 'other party'} moved the order back to in progress.`,
        at: order.completionRejectedAt,
        tone: 'amber',
      })
    }

    if (normalizeOrderStatus(order.status) === 'complete') {
      items.push({
        id: 'completed',
        title: 'Gig completed',
        description: 'Both parties confirmed completion.',
        at: order.updatedAt || order.buyerCompletedAt || order.sellerCompletedAt,
        tone: 'emerald',
      })
    }

    if (normalizeOrderStatus(order.status) === 'cancelled') {
      items.push({
        id: 'cancelled',
        title: 'Gig cancelled',
        description: order.cancelReason || 'Both sides agreed to cancel this order.',
        at: order.cancelledAt || order.updatedAt,
        tone: 'rose',
      })
    }

    return items
      .filter((item) => item.at)
      .sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime())
  }, [order])

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Sign in to view gig history</p>
      </section>
    )
  }

  if (!order || !orderMeta) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">
            {isLoading ? 'Loading gig history' : 'Order not found'}
          </p>
          <p className="text-sm text-slate-600">
            {isLoading
              ? 'Fetching the latest order timeline and actions.'
              : 'This order could not be loaded. It may have been removed or is unavailable to your account.'}
          </p>
          <Button type="button" variant="outline" onClick={onBack}>
            Back to orders
          </Button>
        </div>
      </section>
    )
  }

  const buyerLabel = order.buyerName || 'Buyer'
  const sellerLabel = order.sellerName || order.sellerId || 'Seller'
  const closeCancelCard = () => {
    setShowCancelCard(false)
    setCancelReason('')
  }

  const submitCancellation = () => {
    onCancel?.(order, cancelReason.trim())
    closeCancelCard()
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Gig history</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{order.gigTitle}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Buyer: <span className="font-semibold text-slate-800">{buyerLabel}</span> · Seller:{' '}
              <span className="font-semibold text-slate-800">{sellerLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={onBack}>
              Back to orders
            </Button>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                statusStyles[orderMeta.orderStatus] || statusStyles.pending
              }`}
            >
              {formatStatus(orderMeta.orderStatus)}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold text-slate-500">Order value</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatter.format(order.price || 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold text-slate-500">Created</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold text-slate-500">Accepted</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {order.acceptedAt ? formatDateTime(order.acceptedAt) : 'Pending'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold text-slate-500">Delivery date</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {order.deliveryDate ? formatDateTime(order.deliveryDate) : 'Not set'}
            </p>
          </div>
        </div>

        {order.notes ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order brief</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{order.notes}</p>
          </div>
        ) : null}

        {orderMeta.hasPendingMutualCancellation ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4">
            <p className="text-sm font-semibold text-rose-800">Cancellation flow in progress</p>
            <p className="mt-2 text-sm text-rose-700">
              {orderMeta.otherPartyRequestedCancellation
                ? 'The other party has requested cancellation. You can confirm it with your own reason.'
                : 'Your cancellation request is waiting for the other party to confirm with their own reason.'}
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {order.buyerCancellationReason ? (
                <div className="rounded-xl border border-rose-100 bg-white px-3 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Buyer reason</p>
                  <p className="mt-1">{order.buyerCancellationReason}</p>
                </div>
              ) : null}
              {order.sellerCancellationReason ? (
                <div className="rounded-xl border border-rose-100 bg-white px-3 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Seller reason</p>
                  <p className="mt-1">{order.sellerCancellationReason}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {order.cancelReason && orderMeta.orderStatus === 'cancelled' ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4">
            <p className="text-sm font-semibold text-rose-800">Cancellation reason</p>
            <p className="mt-2 text-sm text-rose-700">{order.cancelReason}</p>
          </div>
        ) : null}

        {order.completionRejectedReason ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-800">Completion rejection reason</p>
            <p className="mt-2 text-sm text-amber-700">{order.completionRejectedReason}</p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-800 hover:bg-slate-50"
              onClick={() => onOpenGig?.({ id: order.gigId, title: order.gigTitle, sellerId: order.sellerId || '' })}
            >
              View gig
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => onOpenChat?.(order)}
            >
              Open chat
            </Button>
            {orderMeta.canAccept ? (
              <Button type="button" className="bg-purple-600 text-white hover:bg-purple-500" onClick={() => onAccept?.(order)}>
                Accept order
              </Button>
            ) : null}
            {orderMeta.canRequestCompletion ? (
              <Button
                type="button"
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onComplete?.(order)}
              >
                Request completion
              </Button>
            ) : null}
            {orderMeta.canConfirmCompletion ? (
              <Button
                type="button"
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onComplete?.(order)}
              >
                Confirm completion
              </Button>
            ) : null}
            {orderMeta.canRejectCompletion ? (
              <Button
                type="button"
                variant="outline"
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => onRejectCompletion?.(order)}
              >
                Reject completion
              </Button>
            ) : null}
            {orderMeta.canCancel ? (
              <Button
                type="button"
                variant="outline"
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  if (orderMeta.otherPartyRequestedCancellation) {
                    onCancel?.(order, '')
                    return
                  }
                  setShowCancelCard(true)
                }}
              >
                {orderMeta.cancelActionLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">Timeline</p>
          <div className="mt-4 space-y-4">
            {historyItems.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="mt-1 h-3 w-3 rounded-full bg-purple-500" />
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <span className="text-xs font-medium text-slate-500">{formatDateTime(item.at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCancelCard ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={closeCancelCard}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                  {orderMeta.otherPartyRequestedCancellation ? 'Confirm cancellation' : 'Request cancellation'}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{order.gigTitle}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {orderMeta.otherPartyRequestedCancellation
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
              {order.buyerCancellationReason ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                  Buyer reason: <span className="font-semibold">{order.buyerCancellationReason}</span>
                </div>
              ) : null}
              {order.sellerCancellationReason ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                  Seller reason: <span className="font-semibold">{order.sellerCancellationReason}</span>
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
                  {orderMeta.otherPartyRequestedCancellation ? 'Confirm cancellation' : 'Send request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default OrderHistoryView
