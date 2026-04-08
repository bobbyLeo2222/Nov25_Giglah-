import { Router } from 'express'
import { sendContact } from '../controllers/contactController.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.post('/', asyncHandler(sendContact))

export default router
