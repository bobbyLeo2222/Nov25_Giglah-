import { Router } from 'express'
import {
  login,
  logout,
  me,
  refreshSession,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js'
import { authRequired, refreshAuth } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.get('/me', authRequired, asyncHandler(me))
router.post('/refresh', refreshAuth, asyncHandler(refreshSession))
router.post('/logout', asyncHandler(logout))
router.post('/forgot-password', asyncHandler(requestPasswordReset))
router.post('/reset-password', asyncHandler(resetPassword))
router.post('/verify-email', asyncHandler(verifyEmail))
router.post('/resend-verification', asyncHandler(resendVerification))

export default router
