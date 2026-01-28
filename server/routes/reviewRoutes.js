import { Router } from 'express'
import { addReview, listReviews } from '../controllers/reviewController.js'
import { authRequired, optionalAuth } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/:sellerId', optionalAuth, asyncHandler(listReviews))
router.post('/:sellerId', authRequired, asyncHandler(addReview))

export default router
