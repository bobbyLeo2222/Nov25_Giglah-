import { Router } from 'express'
import { getSellerAnalytics, recordGigView } from '../controllers/analyticsController.js'
import { authRequired, optionalAuth } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.post('/views', optionalAuth, asyncHandler(recordGigView))
router.get('/seller', authRequired, asyncHandler(getSellerAnalytics))

export default router
