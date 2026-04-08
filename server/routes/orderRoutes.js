import { Router } from 'express'
import { createOrder, getOrderById, listOrders, updateOrderStatus } from '../controllers/orderController.js'
import { authRequired } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get('/', authRequired, asyncHandler(listOrders))
router.post('/', authRequired, asyncHandler(createOrder))
router.get('/:id', authRequired, asyncHandler(getOrderById))
router.put('/:id', authRequired, asyncHandler(updateOrderStatus))

export default router
