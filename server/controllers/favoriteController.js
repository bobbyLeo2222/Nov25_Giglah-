import Favorite from '../models/Favorite.js'
import asyncHandler from '../utils/asyncHandler.js'

const VALID_TYPES = ['gig', 'seller']

export const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user.id })
  const gigIds = favorites.filter((fav) => fav.type === 'gig').map((fav) => fav.targetId)
  const sellerIds = favorites.filter((fav) => fav.type === 'seller').map((fav) => fav.targetId)
  res.json({ gigIds, sellerIds })
})

export const addFavorite = asyncHandler(async (req, res) => {
  const { type, targetId } = req.body
  if (!VALID_TYPES.includes(type) || !targetId) {
    return res.status(400).json({ message: 'Type and targetId are required' })
  }

  await Favorite.findOneAndUpdate(
    { user: req.user.id, type, targetId },
    { user: req.user.id, type, targetId },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )

  const favorites = await Favorite.find({ user: req.user.id })
  const gigIds = favorites.filter((fav) => fav.type === 'gig').map((fav) => fav.targetId)
  const sellerIds = favorites.filter((fav) => fav.type === 'seller').map((fav) => fav.targetId)

  res.status(201).json({ gigIds, sellerIds })
})

export const removeFavorite = asyncHandler(async (req, res) => {
  const { type, targetId } = req.params
  if (!VALID_TYPES.includes(type) || !targetId) {
    return res.status(400).json({ message: 'Type and targetId are required' })
  }
  await Favorite.findOneAndDelete({ user: req.user.id, type, targetId })
  const favorites = await Favorite.find({ user: req.user.id })
  const gigIds = favorites.filter((fav) => fav.type === 'gig').map((fav) => fav.targetId)
  const sellerIds = favorites.filter((fav) => fav.type === 'seller').map((fav) => fav.targetId)
  res.json({ gigIds, sellerIds })
})
