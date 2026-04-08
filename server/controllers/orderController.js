import Order from '../models/Order.js'
import SellerProfile from '../models/SellerProfile.js'
import asyncHandler from '../utils/asyncHandler.js'

const normalizeOrderStatus = (status = '') =>
  String(status || 'pending').toLowerCase() === 'delivered'
    ? 'awaiting_completion'
    : String(status || 'pending').toLowerCase()

const getActorRole = ({ isSeller, isBuyer, isAdmin }) => {
  if (isSeller) return 'seller'
  if (isBuyer) return 'buyer'
  if (isAdmin) return 'admin'
  return ''
}

const clearCancellationRequests = (order) => {
  order.buyerCancellationRequestedAt = undefined
  order.buyerCancellationReason = ''
  order.sellerCancellationRequestedAt = undefined
  order.sellerCancellationReason = ''
}

export const createOrder = asyncHandler(async (req, res) => {
  const { gigId, gigTitle, sellerId, price, notes, deliveryDate } = req.body
  if (!gigId || !gigTitle || !sellerId || !price) {
    return res.status(400).json({ message: 'gigId, gigTitle, sellerId, and price are required' })
  }

  const sellerProfile = await SellerProfile.findOne({ sellerId })
  if (!sellerProfile) {
    return res.status(400).json({ message: 'Seller not found' })
  }

  const existingActiveOrder = await Order.findOne({
    buyer: req.user.id,
    seller: sellerProfile.user,
    gigId,
    status: { $in: ['pending', 'in_progress', 'awaiting_completion'] },
  }).sort({ updatedAt: -1, createdAt: -1 })

  if (existingActiveOrder) {
    return res.status(200).json({
      order: existingActiveOrder,
      reused: true,
      message: 'An active order for this gig already exists.',
    })
  }

  const order = await Order.create({
    buyer: req.user.id,
    seller: sellerProfile.user,
    sellerId,
    gigId,
    gigTitle,
    price,
    notes,
    deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
  })

  res.status(201).json({ order })
})

export const listOrders = asyncHandler(async (req, res) => {
  const role = req.query.role === 'seller' ? 'seller' : 'buyer'
  const query = role === 'seller' ? { seller: req.user.id } : { buyer: req.user.id }
  const orders = await Order.find(query).sort({ createdAt: -1 })
  res.json({ orders })
})

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  const isSeller = order.seller.toString() === req.user.id
  const isBuyer = order.buyer.toString() === req.user.id
  const isAdmin = req.user.role === 'admin'
  if (!isSeller && !isBuyer && !isAdmin) {
    return res.status(403).json({ message: 'Not allowed to view this order' })
  }

  res.json({ order })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  const isSeller = order.seller.toString() === req.user.id
  const isBuyer = order.buyer.toString() === req.user.id
  const isAdmin = req.user.role === 'admin'
  if (!isSeller && !isAdmin && !isBuyer) {
    return res.status(403).json({ message: 'Not allowed to update this order' })
  }

  const allowedStatuses = ['pending', 'in_progress', 'awaiting_completion', 'complete', 'cancelled']
  const { status, cancelReason } = req.body
  const actorRole = getActorRole({ isSeller, isBuyer, isAdmin })
  const currentStatus = normalizeOrderStatus(order.status)

  if (currentStatus === 'cancelled' && status && status !== 'cancelled') {
    return res.status(400).json({ message: 'Cancelled orders cannot be updated' })
  }

  let event = ''
  if (status && allowedStatuses.includes(status)) {
    if (status === 'cancelled') {
      if (currentStatus === 'complete') {
        return res.status(400).json({ message: 'Completed orders cannot be cancelled' })
      }
      const reason = (cancelReason || '').trim()
      const otherPartyRequestedCancellation =
        (actorRole === 'buyer' && Boolean(order.sellerCancellationRequestedAt)) ||
        (actorRole === 'seller' && Boolean(order.buyerCancellationRequestedAt))

      if (!reason && !otherPartyRequestedCancellation && !isAdmin) {
        return res.status(400).json({ message: 'Cancellation reason is required' })
      }
      if (actorRole === 'buyer') {
        order.buyerCancellationRequestedAt = order.buyerCancellationRequestedAt || new Date()
        if (reason) {
          order.buyerCancellationReason = reason
        }
      } else if (actorRole === 'seller') {
        order.sellerCancellationRequestedAt = order.sellerCancellationRequestedAt || new Date()
        if (reason) {
          order.sellerCancellationReason = reason
        }
      } else {
        order.status = 'cancelled'
        order.cancelReason = reason
        order.cancelledAt = new Date()
        order.cancelledBy = actorRole
        clearCancellationRequests(order)
        event = 'cancelled'
      }

      const hasBuyerCancellation = Boolean(order.buyerCancellationRequestedAt)
      const hasSellerCancellation = Boolean(order.sellerCancellationRequestedAt)

      if (!event && hasBuyerCancellation && hasSellerCancellation) {
        order.status = 'cancelled'
        order.cancelReason = [
          order.buyerCancellationReason ? `Buyer: ${order.buyerCancellationReason}` : '',
          order.sellerCancellationReason ? `Seller: ${order.sellerCancellationReason}` : '',
        ]
          .filter(Boolean)
          .join(' | ')
        order.cancelledAt = new Date()
        order.cancelledBy = 'buyer_and_seller'
        event = 'cancelled'
      } else if (!event) {
        event = 'cancellation_requested'
      }
    } else if (status === 'complete') {
      if (currentStatus === 'pending') {
        return res.status(400).json({ message: 'Order must be accepted before completion can be confirmed' })
      }
      if (currentStatus === 'cancelled' || currentStatus === 'complete') {
        return res.status(400).json({ message: 'Order cannot be updated from its current status' })
      }
      if (currentStatus === 'in_progress') {
        clearCancellationRequests(order)
        if (isSeller) {
          order.sellerCompletedAt = new Date()
        }
        if (isBuyer) {
          order.buyerCompletedAt = new Date()
        }
        order.status = 'awaiting_completion'
        order.completionRequestedAt = new Date()
        order.completionRequestedBy = actorRole
        order.completionRejectedAt = undefined
        order.completionRejectedBy = undefined
        order.completionRejectedReason = ''
        event = 'completion_requested'
      } else if (currentStatus === 'awaiting_completion') {
        const requestedBy = String(order.completionRequestedBy || '').toLowerCase()
        if (!isAdmin && requestedBy && requestedBy === actorRole) {
          return res.status(400).json({ message: 'Awaiting the other party to confirm completion' })
        }
        if (requestedBy === 'seller' && !order.sellerCompletedAt) {
          order.sellerCompletedAt = order.completionRequestedAt || new Date()
        }
        if (requestedBy === 'buyer' && !order.buyerCompletedAt) {
          order.buyerCompletedAt = order.completionRequestedAt || new Date()
        }
        if (isSeller) {
          order.sellerCompletedAt = order.sellerCompletedAt || new Date()
        }
        if (isBuyer) {
          order.buyerCompletedAt = order.buyerCompletedAt || new Date()
        }
        order.status = 'complete'
        event = 'completed'
      }
    } else if (status === 'in_progress') {
      if (currentStatus === 'pending') {
        if (!isSeller && !isAdmin) {
          return res.status(403).json({ message: 'Only the seller can accept this order' })
        }
        order.status = 'in_progress'
        order.acceptedAt = new Date()
        order.acceptedBy = isAdmin ? 'admin' : 'seller'
        order.buyerCompletedAt = undefined
        order.sellerCompletedAt = undefined
        order.completionRequestedAt = undefined
        order.completionRequestedBy = undefined
        order.completionRejectedAt = undefined
        order.completionRejectedBy = undefined
        order.completionRejectedReason = ''
        clearCancellationRequests(order)
        event = 'accepted'
      } else if (currentStatus === 'awaiting_completion') {
        const requestedBy = String(order.completionRequestedBy || '').toLowerCase()
        if (!isAdmin && requestedBy && requestedBy === actorRole) {
          return res.status(400).json({ message: 'Only the other party can reject completion' })
        }
        order.status = 'in_progress'
        order.buyerCompletedAt = undefined
        order.sellerCompletedAt = undefined
        order.completionRejectedAt = new Date()
        order.completionRejectedBy = actorRole
        order.completionRejectedReason = (cancelReason || '').trim()
        order.completionRequestedAt = undefined
        order.completionRequestedBy = undefined
        clearCancellationRequests(order)
        event = 'completion_rejected'
      } else {
        order.status = 'in_progress'
      }
    } else {
      order.status = status
    }
  }

  await order.save()
  res.json({ order, event })
})
