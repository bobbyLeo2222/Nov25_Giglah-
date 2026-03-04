const ongoingOrderStatuses = new Set(['pending', 'in_progress', 'delivered'])

export const normalizeOrderStatus = (status) => (status || 'pending').toLowerCase()

export const isOngoingOrderStatus = (status) => ongoingOrderStatuses.has(normalizeOrderStatus(status))

export const sortOrdersByUpdatedAtDesc = (orders = []) =>
  [...orders].sort((a, b) => {
    const left = new Date(a?.updatedAt || a?.createdAt || 0).getTime()
    const right = new Date(b?.updatedAt || b?.createdAt || 0).getTime()
    return right - left
  })

export const summarizeOrders = (orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      spend: 0,
    }
  }
  const active = orders.filter((order) => isOngoingOrderStatus(order?.status)).length
  const completed = orders.filter((order) => normalizeOrderStatus(order?.status) === 'complete').length
  const cancelled = orders.filter((order) => normalizeOrderStatus(order?.status) === 'cancelled').length
  const spend = orders
    .filter((order) => normalizeOrderStatus(order?.status) !== 'cancelled')
    .reduce((sum, order) => sum + (Number(order?.price) || 0), 0)
  return {
    total: orders.length,
    active,
    completed,
    cancelled,
    spend,
  }
}

export const summarizeBuyerOrders = summarizeOrders

export const filterOrdersByStatus = (orders = [], statusFilter = 'all') => {
  if (!Array.isArray(orders)) return []
  if (statusFilter === 'ongoing') {
    return orders.filter((order) => isOngoingOrderStatus(order?.status))
  }
  if (statusFilter === 'complete') {
    return orders.filter((order) => normalizeOrderStatus(order?.status) === 'complete')
  }
  if (statusFilter === 'cancelled') {
    return orders.filter((order) => normalizeOrderStatus(order?.status) === 'cancelled')
  }
  return orders
}

const getOrderId = (order) => order?._id || order?.id || ''

export const mergeSellerAndBuyerOrders = (sellerOrders = [], buyerOrders = []) => {
  const merged = new Map()

  sellerOrders.forEach((order) => {
    const id = getOrderId(order)
    if (!id) return
    merged.set(id, { ...order, flow: 'incoming' })
  })

  buyerOrders.forEach((order) => {
    const id = getOrderId(order)
    if (!id) return
    if (merged.has(id)) {
      const existing = merged.get(id)
      const existingTime = new Date(existing?.updatedAt || existing?.createdAt || 0).getTime()
      const nextTime = new Date(order?.updatedAt || order?.createdAt || 0).getTime()
      if (nextTime > existingTime) {
        merged.set(id, { ...order, flow: existing.flow || 'outgoing' })
      }
      return
    }
    merged.set(id, { ...order, flow: 'outgoing' })
  })

  return sortOrdersByUpdatedAtDesc(Array.from(merged.values()))
}
