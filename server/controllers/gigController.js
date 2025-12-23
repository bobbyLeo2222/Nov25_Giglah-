import Gig from '../models/Gig.js'
import SellerProfile from '../models/SellerProfile.js'
import asyncHandler from '../utils/asyncHandler.js'
import normalizeUrl from '../utils/normalizeUrl.js'

const maybeNormalizeUrl = (value) => (value === undefined ? undefined : normalizeUrl(value))

const inferMediaType = (url = '', declaredType = '') => {
  if (declaredType === 'video' || declaredType === 'image') return declaredType
  const lower = url.toLowerCase()
  if (/\.(mp4|mov|avi|mkv|webm)$/.test(lower)) return 'video'
  return 'image'
}

const normalizeMediaItem = (item) => {
  if (!item) return null
  if (typeof item === 'string') {
    const url = normalizeUrl(item)
    if (!url) return null
    return { url, type: inferMediaType(url) }
  }

  const url = item.url ? normalizeUrl(item.url) : ''
  if (!url) return null

  const type = inferMediaType(url, item.type)
  const thumbnailUrl =
    item.thumbnailUrl === undefined ? undefined : normalizeUrl(item.thumbnailUrl)

  return thumbnailUrl ? { url, type, thumbnailUrl } : { url, type }
}

const normalizeMedia = (value) => {
  if (value === undefined) return undefined
  const items = Array.isArray(value) ? value : [value]
  const normalized = items
    .map(normalizeMediaItem)
    .filter(Boolean)
  return normalized
}

const normalizePackages = (value) => {
  if (value === undefined) return undefined
  const items = Array.isArray(value) ? value : [value]
  const normalized = items
    .map((item) => {
      if (!item) return null
      const name = (item.name || '').trim()
      const description = (item.description || '').trim()
      const price = Number(item.price)
      if (!name && !description && !Number.isFinite(price)) return null
      return {
        name: name || 'Package',
        description,
        price: Number.isFinite(price) ? price : 0,
      }
    })
    .filter(Boolean)
  return normalized
}

const pickGigFields = (body = {}) => ({
  title: body.title,
  category: body.category,
  price: body.price,
  packages: normalizePackages(body.packages),
  status: body.status,
  description: body.description,
  imageUrl: body.imageUrl,
  instagramUrl: maybeNormalizeUrl(body.instagramUrl),
  websiteUrl: maybeNormalizeUrl(body.websiteUrl),
  media: normalizeMedia(body.media),
  owner: body.owner,
})

const buildSearchQuery = ({ category, sellerId, search, status, minPrice, maxPrice }) => {
  const query = {}
  if (category) query.category = { $regex: new RegExp(category, 'i') }
  if (status) query.status = status
  if (search) {
    const regex = new RegExp(search, 'i')
    query.$or = [{ title: regex }, { description: regex }]
  }
  if (sellerId) query.sellerId = sellerId
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {}
    if (minPrice !== undefined) query.price.$gte = Number(minPrice)
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice)
  }
  return query
}

export const getGigs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
  const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 12, 50)
  const { sort = 'newest', minPrice, maxPrice, ...rest } = req.query
  const query = buildSearchQuery({ ...rest, minPrice, maxPrice })

  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
  }
  const sortOption = sortMap[sort] || sortMap.newest

  const [gigs, total] = await Promise.all([
    Gig.find(query).sort(sortOption).skip((page - 1) * pageSize).limit(pageSize),
    Gig.countDocuments(query),
  ])

  res.json({ gigs, total, page, pageSize })
})

export const getGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id)
  if (!gig) {
    return res.status(404).json({ message: 'Gig not found' })
  }
  return res.json({ gig })
})

export const createGig = asyncHandler(async (req, res) => {
  const sellerProfile = await SellerProfile.findOne({ user: req.user.id })
  if (!sellerProfile) {
    return res.status(400).json({ message: 'Create a seller profile before publishing gigs' })
  }

  const payload = pickGigFields(req.body)
  if ((!payload.price || Number(payload.price) <= 0) && payload.packages?.length) {
    const lowest = Math.min(...payload.packages.map((pkg) => Number(pkg.price) || 0))
    payload.price = Number.isFinite(lowest) ? lowest : 0
  }

  const gig = await Gig.create({
    ...payload,
    media: payload.media || [],
    seller: req.user.id,
    sellerProfile: sellerProfile._id,
    sellerName: sellerProfile.displayName,
    sellerId: sellerProfile.sellerId,
    status: req.body.status || 'Published',
  })

  return res.status(201).json({ gig })
})

export const updateGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id)
  if (!gig) return res.status(404).json({ message: 'Gig not found' })

  const isOwner = gig.seller.toString() === req.user.id || req.user.role === 'admin'
  if (!isOwner) return res.status(403).json({ message: 'Not allowed to update this gig' })

  const payload = pickGigFields(req.body)
  if ((payload.price === undefined || Number(payload.price) <= 0) && payload.packages?.length) {
    const lowest = Math.min(...payload.packages.map((pkg) => Number(pkg.price) || 0))
    payload.price = Number.isFinite(lowest) ? lowest : gig.price
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      gig[key] = value
    }
  })
  await gig.save()
  return res.json({ gig })
})

export const deleteGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id)
  if (!gig) return res.status(404).json({ message: 'Gig not found' })

  const isOwner = gig.seller.toString() === req.user.id || req.user.role === 'admin'
  if (!isOwner) return res.status(403).json({ message: 'Not allowed to delete this gig' })

  await gig.deleteOne()
  return res.json({ message: 'Gig deleted' })
})
