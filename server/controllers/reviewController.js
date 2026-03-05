import Review from '../models/Review.js'
import SellerProfile from '../models/SellerProfile.js'
import Order from '../models/Order.js'
import Gig from '../models/Gig.js'
import asyncHandler from '../utils/asyncHandler.js'

const isObjectId = (value = '') => /^[0-9a-fA-F]{24}$/.test(value)

const findSellerByParam = async (sellerId) => {
  if (!sellerId) return null
  const finder = isObjectId(sellerId) ? { _id: sellerId } : { sellerId }
  return SellerProfile.findOne(finder)
}

export const listGigReviews = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.gigId).select('_id')
  if (!gig) {
    return res.status(404).json({ message: 'Gig not found' })
  }

  const reviews = await Review.find({ gig: gig._id })
    .populate('buyer', 'name email')
    .populate('gig', 'title sellerId')
    .sort({ createdAt: -1 })

  res.json({ reviews })
})

export const addReview = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.gigId).select(
    '_id title seller sellerId sellerProfile',
  )
  if (!gig) {
    return res.status(404).json({ message: 'Gig not found' })
  }

  if (gig.seller?.toString() === req.user.id) {
    return res.status(400).json({ message: 'You cannot review your own gig' })
  }

  const { rating, text, project } = req.body
  if (!rating || !text) {
    return res.status(400).json({ message: 'Rating and text are required' })
  }

  const ratingNumber = Number(rating)
  if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' })
  }

  const qualifyingOrder = await Order.findOne({
    buyer: req.user.id,
    seller: gig.seller,
    gigId: gig._id.toString(),
    status: { $in: ['delivered', 'complete'] },
  }).sort({ updatedAt: -1 })

  if (!qualifyingOrder) {
    return res
      .status(400)
      .json({ message: 'You can only review gigs after completing an order for that gig' })
  }

  const existing = await Review.findOne({ buyer: req.user.id, gig: gig._id }).select('_id')
  if (existing) {
    return res.status(409).json({ message: 'You have already reviewed this gig' })
  }

  let sellerProfileId = gig.sellerProfile || null
  if (!sellerProfileId && gig.sellerId) {
    const resolvedSeller = await SellerProfile.findOne({ sellerId: gig.sellerId }).select('_id')
    sellerProfileId = resolvedSeller?._id || null
  }

  const review = await Review.create({
    seller: gig.seller,
    sellerProfile: sellerProfileId || undefined,
    gig: gig._id,
    buyer: req.user.id,
    rating: ratingNumber,
    text,
    project: project || gig.title,
    order: qualifyingOrder._id,
    isVerified: true,
  })

  await review.populate('buyer', 'name email')
  await review.populate('gig', 'title sellerId')

  return res.status(201).json({ review })
})

export const listSellerReviews = asyncHandler(async (req, res) => {
  const sellerProfile = await findSellerByParam(req.params.sellerId)
  if (!sellerProfile) {
    return res.status(404).json({ message: 'Seller not found' })
  }

  const reviews = await Review.find({ sellerProfile: sellerProfile._id, gig: { $exists: true } })
    .populate('buyer', 'name email')
    .populate('gig', 'title sellerId')
    .sort({ createdAt: -1 })

  res.json({ reviews })
})
