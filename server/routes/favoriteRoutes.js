import { Router } from 'express'
import { addFavorite, getFavorites, removeFavorite } from '../controllers/favoriteController.js'
import { authRequired } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/', authRequired, asyncHandler(getFavorites))
router.post('/', authRequired, asyncHandler(addFavorite))
router.delete('/:type/:targetId', authRequired, asyncHandler(removeFavorite))

export default router
