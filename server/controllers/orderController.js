import Order from '../models/Order.js'
import SellerProfile from '../models/SellerProfile.js'
import asyncHandler from '../utils/asyncHandler.js'

export const createOrder = asyncHandler(async (req, res) => {
  const { gigId, gigTitle, sellerId, price, notes, deliveryDate } = req.body
  if (!gigId || !gigTitle || !sellerId || !price) {
    return res.status(400).json({ message: 'gigId, gigTitle, sellerId, and price are required' })
  }

  const sellerProfile = await SellerProfile.findOne({ sellerId })
  if (!sellerProfile) {
    return res.status(400).json({ message: 'Seller not found' })
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

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  const isSeller = order.seller.toString() === req.user.id
  const isBuyer = order.buyer.toString() === req.user.id
  const isAdmin = req.user.role === 'admin'
  if (!isSeller && !isAdmin && !isBuyer) {
    return res.status(403).json({ message: 'Not allowed to update this order' })
  }

  const allowedStatuses = ['pending', 'in_progress', 'delivered', 'complete', 'cancelled']
  const { status, cancelReason } = req.body
  if (order.status === 'cancelled' && status && status !== 'cancelled') {
    return res.status(400).json({ message: 'Cancelled orders cannot be updated' })
  }

  if (status && allowedStatuses.includes(status)) {
    if (status === 'cancelled') {
      const reason = (cancelReason || '').trim()
      if (!reason) {
        return res.status(400).json({ message: 'Cancellation reason is required' })
      }
      order.status = 'cancelled'
      order.cancelReason = reason
      order.cancelledAt = new Date()
      order.cancelledBy = isSeller ? 'seller' : isBuyer ? 'buyer' : 'admin'
    } else if (status === 'complete') {
      if (isSeller) {
        order.sellerCompletedAt = order.sellerCompletedAt || new Date()
      }
      if (isBuyer) {
        order.buyerCompletedAt = order.buyerCompletedAt || new Date()
      }
      if (order.sellerCompletedAt && order.buyerCompletedAt) {
        order.status = 'complete'
      }
    } else {
      order.status = status
    }
  }

  await order.save()
  res.json({ order })
})
