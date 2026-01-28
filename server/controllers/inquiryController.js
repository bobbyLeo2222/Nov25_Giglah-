import Inquiry from '../models/Inquiry.js'
import asyncHandler from '../utils/asyncHandler.js'

export const createInquiry = asyncHandler(async (req, res) => {
  const { gigId, sellerId, message, contactName, contactEmail } = req.body
  if (!gigId || !message) {
    return res.status(400).json({ message: 'Gig and message are required' })
  }

  const inquiry = await Inquiry.create({
    gigId,
    sellerId,
    message,
    contactName: contactName || req.user?.name || 'Buyer',
    contactEmail: contactEmail || req.user?.email || '',
    user: req.user?.id || null,
  })

  res.status(201).json({ inquiry })
})
