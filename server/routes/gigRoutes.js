import { Router } from 'express'
import {
  createGig,
  deleteGig,
  getGig,
  getGigs,
  updateGig,
} from '../controllers/gigController.js'
import { authRequired, optionalAuth } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/', optionalAuth, asyncHandler(getGigs))
router.get('/:id', optionalAuth, asyncHandler(getGig))
router.post('/', authRequired, asyncHandler(createGig))
router.put('/:id', authRequired, asyncHandler(updateGig))
router.delete('/:id', authRequired, asyncHandler(deleteGig))

export default router
