import { Router } from 'express'
import {
  getMyProfile,
  getProfile,
  getProfiles,
  upsertProfile,
} from '../controllers/profileController.js'
import { authRequired, optionalAuth } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/', optionalAuth, asyncHandler(getProfiles))
router.get('/me', authRequired, asyncHandler(getMyProfile))
router.post('/me', authRequired, asyncHandler(upsertProfile))
router.put('/me', authRequired, asyncHandler(upsertProfile))
router.get('/:sellerId', optionalAuth, asyncHandler(getProfile))

export default router
