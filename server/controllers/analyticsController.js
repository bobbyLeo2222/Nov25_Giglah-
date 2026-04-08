import AnalyticsEvent from '../models/AnalyticsEvent.js'
import ChatThread from '../models/ChatThread.js'
import Gig from '../models/Gig.js'
import Order from '../models/Order.js'
import asyncHandler from '../utils/asyncHandler.js'

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

export const recordGigView = asyncHandler(async (req, res) => {
  const { gigId } = req.body || {}
  if (!gigId) {
    return res.status(400).json({ message: 'gigId is required' })
  }

  const gig = await Gig.findById(gigId).select('seller sellerId')
  if (!gig) {
    return res.status(404).json({ message: 'Gig not found' })
  }

  if (req.user?.id && gig.seller?.toString() === req.user.id) {
    return res.status(204).end()
  }

  await AnalyticsEvent.create({
    type: 'gig_view',
    seller: gig.seller,
    sellerId: gig.sellerId,
    gigId,
    viewer: req.user?.id,
  })

  return res.status(201).json({ tracked: true })
})

export const getSellerAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Seller access required' })
  }

  const rangeDays = clampNumber(req.query.rangeDays, 1, 365, 30)
  const slaHours = clampNumber(req.query.slaHours, 1, 72, 24)
  const sinceDate = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000)
  const slaMs = slaHours * 60 * 60 * 1000

  const [viewsCount, ordersCount, threads] = await Promise.all([
    AnalyticsEvent.countDocuments({
      seller: req.user.id,
      type: 'gig_view',
      createdAt: { $gte: sinceDate },
    }),
    Order.countDocuments({ seller: req.user.id, createdAt: { $gte: sinceDate } }),
    ChatThread.find({ participants: req.user.id }),
  ])

  const sellerId = req.user.id.toString()
  let buyerMessages = 0
  let sellerMessages = 0
  let respondedWithinSla = 0
  let totalResponseMs = 0
  let responseCount = 0

  threads.forEach((thread) => {
    const messages = (thread.messages || [])
      .map((message) => ({
        sender: message.sender?.toString() || '',
        createdAt: message.createdAt ? new Date(message.createdAt) : null,
      }))
      .filter((message) => message.sender && message.createdAt)

    for (let i = 0; i < messages.length; i += 1) {
      const current = messages[i]
      const isSellerSender = current.sender === sellerId
      if (current.createdAt >= sinceDate) {
        if (isSellerSender) {
          sellerMessages += 1
        } else {
          buyerMessages += 1
        }
      }

      if (isSellerSender || current.createdAt < sinceDate) continue

      for (let j = i + 1; j < messages.length; j += 1) {
        const nextMessage = messages[j]
        if (nextMessage.sender !== sellerId) continue
        const responseMs = nextMessage.createdAt - current.createdAt
        responseCount += 1
        totalResponseMs += responseMs
        if (responseMs <= slaMs) {
          respondedWithinSla += 1
        }
        break
      }
    }
  })

  const responseRate = buyerMessages ? respondedWithinSla / buyerMessages : 0
  const avgResponseHours = responseCount
    ? Number((totalResponseMs / responseCount / (1000 * 60 * 60)).toFixed(2))
    : 0

  const conversionRate = viewsCount ? ordersCount / viewsCount : 0

  res.json({
    rangeDays,
    slaHours,
    totals: {
      views: viewsCount,
      orders: ordersCount,
      messagesReceived: buyerMessages,
      messagesSent: sellerMessages,
      conversionRate,
    },
    response: {
      buyerMessages,
      respondedWithinSla,
      responseRate,
      avgResponseHours,
    },
  })
})
