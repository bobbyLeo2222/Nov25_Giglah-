import mongoose from 'mongoose'
import ChatThread from '../models/ChatThread.js'
import Gig from '../models/Gig.js'
import SellerProfile from '../models/SellerProfile.js'
import asyncHandler from '../utils/asyncHandler.js'

const ensureParticipant = (thread, userId) =>
  thread.participants.some((id) => id.toString() === userId)

const pruneTypingStatuses = (thread) => {
  const now = new Date()
  thread.typingStatuses = (thread.typingStatuses || []).filter(
    (entry) => entry.expiresAt && entry.expiresAt > now,
  )
}

const hydrateThread = (thread, currentUserId) => {
  const obj = thread.toObject ? thread.toObject() : thread
  const messages = obj.messages || []
  const unreadCount = messages.reduce(
    (count, msg) =>
      msg.readBy?.some((id) => id.toString() === currentUserId) ? count : count + 1,
    0,
  )
  return { ...obj, unreadCount }
}

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value)

const normalizeParticipantIds = (values = []) => {
  const ids = values
    .map((val) => {
      if (!val) return ''
      if (typeof val === 'string') {
        const match = val.match(/[a-f0-9]{24}/i)
        return match && isObjectId(match[0]) ? match[0] : ''
      }
      if (val._id && isObjectId(val._id)) return val._id.toString()
      if (val.id && isObjectId(val.id)) return val.id.toString()
      if (typeof val === 'object' && isObjectId(val)) return val.toString()
      return ''
    })
    .filter(Boolean)
  return Array.from(new Set(ids))
}

const normalizeFiles = (raw) => {
  if (!raw) return []
  let files = raw
  if (typeof raw === 'string') {
    try {
      files = JSON.parse(raw)
    } catch (error) {
      try {
        // eslint-disable-next-line no-new-func
        files = new Function(`return (${raw})`)()
      } catch (error2) {
        return []
      }
    }
  }
  if (!Array.isArray(files)) return []
  return files
    .map((file) => ({
      url: file.url || '',
      name: file.name || 'Attachment',
      size: Number(file.size) || 0,
      type: file.type || 'file',
    }))
    .filter((file) => file.name || file.url)
}

const resolveSellerUserId = async ({ sellerId, gigId }) => {
  if (isObjectId(sellerId)) return sellerId
  if (gigId && isObjectId(gigId)) {
    const gig = await Gig.findById(gigId).select('seller')
    if (gig?.seller) return gig.seller.toString()
  }
  if (sellerId) {
    const profile = await SellerProfile.findOne({ sellerId }).select('user')
    if (profile?.user) return profile.user.toString()
  }
  return ''
}

const resolveChatContext = async (req) => {
  const buyerId = req.user.id
  const sellerIdInput = req.body?.sellerId
  const gigId = req.body?.gigId
  let gigTitle = req.body?.gigTitle
  let sellerName = req.body?.sellerName

  let gigDoc = null
  if (gigId && isObjectId(gigId)) {
    gigDoc = await Gig.findById(gigId).select('title seller')
    if (gigDoc?.title && !gigTitle) gigTitle = gigDoc.title
  }

  const sellerId =
    (gigDoc?.seller && gigDoc.seller.toString()) ||
    (await resolveSellerUserId({ sellerId: sellerIdInput, gigId }))

  return {
    buyerId,
    sellerId,
    gigId,
    gigTitle,
    sellerName,
  }
}

export const listThreads = asyncHandler(async (req, res) => {
  const threads = await ChatThread.find({ participants: req.user.id })
    .populate('participants', 'name avatarUrl role')
    .sort({ lastMessageAt: -1 })

  const hydrated = threads.map((thread) => hydrateThread(thread, req.user.id))
  res.json({ threads: hydrated })
})

export const getThread = asyncHandler(async (req, res) => {
  const thread = await ChatThread.findById(req.params.threadId).populate(
    'participants',
    'name avatarUrl role',
  )

  if (!thread) {
    return res.status(404).json({ message: 'Thread not found' })
  }

  if (!ensureParticipant(thread, req.user.id)) {
    const healed = normalizeParticipantIds([...thread.participants, req.user.id])
    thread.participants = healed
    await ChatThread.updateOne({ _id: thread._id }, { $set: { participants: healed } })

    if (!ensureParticipant(thread, req.user.id)) {
      return res.status(404).json({ message: 'Thread not found' })
    }
  }

  pruneTypingStatuses(thread)
  await ChatThread.updateOne({ _id: thread._id }, { $set: { typingStatuses: thread.typingStatuses } })
  res.json({ thread: hydrateThread(thread, req.user.id) })
})

export const createThread = asyncHandler(async (req, res) => {
  if (Array.isArray(req.body?.participantIds) && !req.body?.gigId && !req.body?.sellerId) {
    const uniqueParticipantIds = normalizeParticipantIds([
      ...req.body.participantIds,
      req.user.id,
    ])
    if (uniqueParticipantIds.length < 2) {
      return res.status(400).json({ message: 'At least two participants are required' })
    }
    const thread = await ChatThread.create({
      participants: uniqueParticipantIds,
      title: req.body.title,
    })
    return res.status(201).json({ thread: hydrateThread(thread, req.user.id) })
  }

  const { buyerId, sellerId, gigId, gigTitle, sellerName } = await resolveChatContext(req)

  const uniqueParticipantIds = normalizeParticipantIds([buyerId, sellerId])

  if (uniqueParticipantIds.length < 2) {
    return res.status(400).json({ message: 'At least two participants are required' })
  }

  if (!sellerId) {
    return res.status(400).json({ message: 'Seller unavailable for chat' })
  }

  const existing = await ChatThread.findOne({
    gigId,
    participants: { $all: uniqueParticipantIds, $size: uniqueParticipantIds.length },
  })

  if (existing) {
    existing.participants = normalizeParticipantIds(existing.participants)
    if (!existing.gigTitle && gigTitle) existing.gigTitle = gigTitle
    if (!existing.seller && sellerId) existing.seller = sellerId
    if (!existing.buyer && buyerId) existing.buyer = buyerId
    if (!existing.sellerName && req.body.sellerName) existing.sellerName = req.body.sellerName
    if (!existing.buyerName && req.body.buyerName) existing.buyerName = req.body.buyerName
    await existing.save()
    return res.status(200).json({ thread: hydrateThread(existing, req.user.id) })
  }

  const thread = await ChatThread.create({
    participants: uniqueParticipantIds,
    title: req.body.title,
    gigId,
    gigTitle,
    seller: sellerId,
    buyer: buyerId || req.user.id,
    sellerName: req.body.sellerName || sellerName,
    buyerName: req.body.buyerName,
  })

  res.status(201).json({ thread: hydrateThread(thread, req.user.id) })
})

export const addMessage = asyncHandler(async (req, res) => {
  let thread = await ChatThread.findById(req.params.threadId)

  if (!thread && req.body?.gigId) {
    const { sellerId, buyerId, gigId, gigTitle, sellerName } = await resolveChatContext(req)
    const uniqueParticipants = normalizeParticipantIds([sellerId, buyerId])
    if (uniqueParticipants.length >= 2 && sellerId) {
      thread = await ChatThread.findOne({
        gigId,
        participants: { $all: uniqueParticipants, $size: uniqueParticipants.length },
      })
      if (!thread) {
        thread = await ChatThread.create({
          participants: uniqueParticipants,
          gigId,
          gigTitle,
          title: gigTitle,
          seller: sellerId,
          buyer: buyerId || req.user.id,
          sellerName: req.body.sellerName || sellerName,
          buyerName: req.body.buyerName,
          messages: [],
        })
      }
    }
  }

  if (!thread) {
    return res.status(404).json({ message: 'Thread not found' })
  }

  if (!ensureParticipant(thread, req.user.id)) {
    const { buyerId, sellerId } = await resolveChatContext(req)
    const healedParticipants = normalizeParticipantIds([
      ...thread.participants,
      buyerId,
      sellerId,
      req.user.id,
    ])
    thread.participants = healedParticipants
    await ChatThread.updateOne({ _id: thread._id }, { $set: { participants: healedParticipants } })

    if (!ensureParticipant(thread, req.user.id)) {
      return res.status(404).json({ message: 'Thread not found' })
    }
  }

  if (Array.isArray(thread.messages)) {
    thread.messages.forEach((msg, idx) => {
      const normalized = normalizeFiles(msg.files)
      if (msg?.set) {
        msg.set('files', normalized)
      } else {
        thread.messages[idx].files = normalized
      }
    })
    thread.markModified('messages')
  }

  const message = {
    sender: req.user.id,
    text: req.body.text,
    files: normalizeFiles(req.body.files),
    readBy: [req.user.id],
  }

  pruneTypingStatuses(thread)

  const updated = await ChatThread.findByIdAndUpdate(
    thread._id,
    {
      $push: { messages: message },
      $set: { lastMessageAt: new Date(), typingStatuses: thread.typingStatuses },
    },
    { new: true },
  )

  const created = updated?.messages?.at(-1)
  res.status(201).json({ message: created || message })
})

export const markRead = asyncHandler(async (req, res) => {
  const thread = await ChatThread.findById(req.params.threadId)
  if (!thread || !ensureParticipant(thread, req.user.id)) {
    return res.status(404).json({ message: 'Thread not found' })
  }
  let updated = false
  thread.messages.forEach((msg) => {
    const hasRead = msg.readBy?.some((id) => id.toString() === req.user.id)
    if (!hasRead) {
      msg.readBy.push(req.user.id)
      updated = true
    }
  })
  if (updated) {
    await thread.save()
  }
  res.json({ message: 'Marked as read' })
})

export const setTyping = asyncHandler(async (req, res) => {
  const thread = await ChatThread.findById(req.params.threadId)
  if (!thread || !ensureParticipant(thread, req.user.id)) {
    return res.status(404).json({ message: 'Thread not found' })
  }
  pruneTypingStatuses(thread)
  const ttlSeconds = Number(req.body?.ttlSeconds) || 5
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
  const existing = (thread.typingStatuses || []).find(
    (entry) => entry.user?.toString() === req.user.id,
  )
  if (existing) {
    existing.expiresAt = expiresAt
  } else {
    thread.typingStatuses.push({ user: req.user.id, expiresAt })
  }
  await thread.save()
  res.json({ message: 'Typing updated' })
})
