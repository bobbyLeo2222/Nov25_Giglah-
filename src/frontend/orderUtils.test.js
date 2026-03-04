import { describe, expect, it } from 'vitest'
import {
  filterOrdersByStatus,
  mergeSellerAndBuyerOrders,
  normalizeOrderStatus,
  sortOrdersByUpdatedAtDesc,
  summarizeBuyerOrders,
} from '@/frontend/orderUtils'

describe('orderUtils', () => {
  it('normalizes empty status to pending', () => {
    expect(normalizeOrderStatus()).toBe('pending')
    expect(normalizeOrderStatus('IN_PROGRESS')).toBe('in_progress')
  })

  it('summarizes buyer order totals accurately', () => {
    const orders = [
      { id: '1', status: 'pending', price: 100 },
      { id: '2', status: 'in_progress', price: '250' },
      { id: '3', status: 'complete', price: 90 },
      { id: '4', status: 'cancelled', price: 400 },
      { id: '5', status: 'delivered', price: 0 },
      { id: '6', status: null, price: 35 },
    ]

    expect(summarizeBuyerOrders(orders)).toEqual({
      total: 6,
      active: 4,
      completed: 1,
      cancelled: 1,
      spend: 475,
    })
  })

  it('filters buyer orders by requested status', () => {
    const orders = [
      { id: 'pending', status: 'pending' },
      { id: 'progress', status: 'in_progress' },
      { id: 'delivered', status: 'delivered' },
      { id: 'complete', status: 'complete' },
      { id: 'cancelled', status: 'cancelled' },
    ]

    expect(filterOrdersByStatus(orders, 'ongoing').map((order) => order.id)).toEqual([
      'pending',
      'progress',
      'delivered',
    ])
    expect(filterOrdersByStatus(orders, 'complete').map((order) => order.id)).toEqual(['complete'])
    expect(filterOrdersByStatus(orders, 'cancelled').map((order) => order.id)).toEqual(['cancelled'])
    expect(filterOrdersByStatus(orders, 'all').map((order) => order.id)).toEqual([
      'pending',
      'progress',
      'delivered',
      'complete',
      'cancelled',
    ])
  })

  it('sorts orders by updatedAt then createdAt descending', () => {
    const orders = [
      { id: 'older', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'created-only', createdAt: '2026-01-02T00:00:00.000Z' },
      { id: 'newest', updatedAt: '2026-01-03T00:00:00.000Z' },
    ]

    expect(sortOrdersByUpdatedAtDesc(orders).map((order) => order.id)).toEqual([
      'newest',
      'created-only',
      'older',
    ])
  })

  it('merges seller and buyer order collections with correct flow and dedupe behavior', () => {
    const sellerOrders = [
      { _id: 'dup', status: 'pending', updatedAt: '2026-01-01T00:00:00.000Z' },
      { _id: 'sellerOnly', status: 'pending', updatedAt: '2026-01-03T00:00:00.000Z' },
    ]
    const buyerOrders = [
      { _id: 'dup', status: 'in_progress', updatedAt: '2026-01-02T00:00:00.000Z' },
      { _id: 'buyerOnly', status: 'pending', updatedAt: '2026-01-04T00:00:00.000Z' },
    ]

    const merged = mergeSellerAndBuyerOrders(sellerOrders, buyerOrders)

    expect(merged.map((order) => order._id)).toEqual(['buyerOnly', 'sellerOnly', 'dup'])
    expect(merged.find((order) => order._id === 'dup')).toMatchObject({
      status: 'in_progress',
      flow: 'incoming',
    })
    expect(merged.find((order) => order._id === 'sellerOnly')).toMatchObject({
      flow: 'incoming',
    })
    expect(merged.find((order) => order._id === 'buyerOnly')).toMatchObject({
      flow: 'outgoing',
    })
  })
})
