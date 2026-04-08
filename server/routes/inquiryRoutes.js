import { Router } from 'express'
import { createInquiry } from '../controllers/inquiryController.js'
import { optionalAuth } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.post('/', optionalAuth, asyncHandler(createInquiry))

export default router
