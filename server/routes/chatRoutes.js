import { Router } from 'express'
import {
  addMessage,
  createThread,
  getThread,
  listThreads,
  markRead,
  setTyping,
} from '../controllers/chatController.js'
import { authRequired } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/', authRequired, asyncHandler(listThreads))
router.post('/', authRequired, asyncHandler(createThread))
router.get('/:threadId', authRequired, asyncHandler(getThread))
router.post('/:threadId/messages', authRequired, asyncHandler(addMessage))
router.post('/:threadId/read', authRequired, asyncHandler(markRead))
router.post('/:threadId/typing', authRequired, asyncHandler(setTyping))

export default router
