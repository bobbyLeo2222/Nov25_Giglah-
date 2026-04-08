import { Router } from 'express'
import { addReview, listGigReviews, listSellerReviews } from '../controllers/reviewController.js'
import { authRequired, optionalAuth } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/seller/:sellerId', optionalAuth, asyncHandler(listSellerReviews))
router.get('/gig/:gigId', optionalAuth, asyncHandler(listGigReviews))
router.post('/gig/:gigId', authRequired, asyncHandler(addReview))

export default router
