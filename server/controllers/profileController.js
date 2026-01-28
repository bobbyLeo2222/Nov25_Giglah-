import SellerProfile from '../models/SellerProfile.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import slugify from '../utils/slugify.js'
import normalizeUrl from '../utils/normalizeUrl.js'

const isObjectId = (value = '') => /^[0-9a-fA-F]{24}$/.test(value)

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export const getProfiles = asyncHandler(async (req, res) => {
  const { category, search } = req.query
  const query = {}

  if (category) query.category = category
  if (search) {
    const regex = new RegExp(search, 'i')
    query.$or = [{ displayName: regex }, { headline: regex }]
  }

  const profiles = await SellerProfile.find(query)
    .populate('user', 'name email role avatarUrl')
    .sort({ createdAt: -1 })

  res.json({ profiles })
})

export const getProfile = asyncHandler(async (req, res) => {
  const { sellerId } = req.params

  const finder = isObjectId(sellerId) ? { _id: sellerId } : { sellerId }

  const profile = await SellerProfile.findOne(finder).populate(
    'user',
    'name email role avatarUrl',
  )

  if (!profile) {
    return res.status(404).json({ message: 'Seller not found' })
  }

  return res.json({ profile })
})

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user.id }).populate(
    'user',
    'name email role avatarUrl',
  )

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' })
  }

  return res.json({ profile })
})

export const upsertProfile = asyncHandler(async (req, res) => {
  const payload = {
    displayName: req.body.displayName,
    headline: req.body.headline,
    bio: req.body.bio,
    category: req.body.category,
    skills: normalizeArray(req.body.skills),
    languages: normalizeArray(req.body.languages),
    rate: req.body.rate,
    location: req.body.location,
    instagramUrl: normalizeUrl(req.body.instagramUrl),
    websiteUrl: normalizeUrl(req.body.websiteUrl),
    imageUrl: req.body.imageUrl,
    phone: req.body.phone,
    availability: req.body.availability,
  }

  let profile = await SellerProfile.findOne({ user: req.user.id })
  if (!profile && !payload.displayName) {
    return res.status(400).json({ message: 'Display name is required' })
  }

  if (!profile) {
    profile = new SellerProfile({ ...payload, user: req.user.id })
  } else {
    Object.assign(profile, payload)
    if (payload.displayName) {
      profile.sellerId = slugify(payload.displayName)
    }
  }

  try {
    await profile.save()
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.sellerId) {
      return res.status(409).json({ message: 'Display name is taken. Choose another.' })
    }
    throw error
  }

  const userUpdate = {}
  if (payload.displayName) userUpdate.name = payload.displayName
  userUpdate.role = 'seller'
  await User.findByIdAndUpdate(req.user.id, userUpdate)

  return res.status(201).json({ profile })
})
