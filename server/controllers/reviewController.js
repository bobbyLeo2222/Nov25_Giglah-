import Review from '../models/Review.js'
import SellerProfile from '../models/SellerProfile.js'
import Order from '../models/Order.js'
import asyncHandler from '../utils/asyncHandler.js'

const isObjectId = (value = '') => /^[0-9a-fA-F]{24}$/.test(value)

const findSellerByParam = async (sellerId) => {
  if (!sellerId) return null
  const finder = isObjectId(sellerId) ? { _id: sellerId } : { sellerId }
  return SellerProfile.findOne(finder)
}

export const listReviews = asyncHandler(async (req, res) => {
  const sellerProfile = await findSellerByParam(req.params.sellerId)
  if (!sellerProfile) {
    return res.status(404).json({ message: 'Seller not found' })
  }

  const reviews = await Review.find({ sellerProfile: sellerProfile._id })
    .populate('buyer', 'name email')
    .sort({ createdAt: -1 })

  res.json({ reviews })
})

export const addReview = asyncHandler(async (req, res) => {
  const sellerProfile = await findSellerByParam(req.params.sellerId)
  if (!sellerProfile) {
    return res.status(404).json({ message: 'Seller not found' })
  }

  if (sellerProfile.user.toString() === req.user.id) {
    return res.status(400).json({ message: 'You cannot review your own profile' })
  }

  const { rating, text, project } = req.body
  if (!rating || !text) {
    return res.status(400).json({ message: 'Rating and text are required' })
  }

  const qualifyingOrder = await Order.findOne({
    buyer: req.user.id,
    seller: sellerProfile.user,
    status: { $in: ['delivered', 'complete'] },
  }).sort({ updatedAt: -1 })

  if (!qualifyingOrder) {
    return res.status(400).json({ message: 'You can only review sellers after completing an order' })
  }

  const review = await Review.create({
    seller: sellerProfile.user,
    sellerProfile: sellerProfile._id,
    buyer: req.user.id,
    rating,
    text,
    project,
    order: qualifyingOrder._id,
    isVerified: true,
  })

  return res.status(201).json({ review })
})
