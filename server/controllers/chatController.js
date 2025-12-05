import ChatThread from '../models/ChatThread.js'
import asyncHandler from '../utils/asyncHandler.js'

const ensureParticipant = (thread, userId) =>
  thread.participants.some((id) => id.toString() === userId)

export const listThreads = asyncHandler(async (req, res) => {
  const threads = await ChatThread.find({ participants: req.user.id })
    .populate('participants', 'name avatarUrl role')
    .sort({ lastMessageAt: -1 })

  res.json({ threads })
})

export const getThread = asyncHandler(async (req, res) => {
  const thread = await ChatThread.findById(req.params.threadId).populate(
    'participants',
    'name avatarUrl role',
  )

  if (!thread || !ensureParticipant(thread, req.user.id)) {
    return res.status(404).json({ message: 'Thread not found' })
  }

  res.json({ thread })
})

export const createThread = asyncHandler(async (req, res) => {
  const uniqueParticipantIds = Array.from(
    new Set([...(req.body.participantIds || []), req.user.id]),
  )

  if (uniqueParticipantIds.length < 2) {
    return res.status(400).json({ message: 'At least two participants are required' })
  }

  const thread = await ChatThread.create({
    participants: uniqueParticipantIds,
    title: req.body.title,
  })

  res.status(201).json({ thread })
})

export const addMessage = asyncHandler(async (req, res) => {
  const thread = await ChatThread.findById(req.params.threadId)
  if (!thread || !ensureParticipant(thread, req.user.id)) {
    return res.status(404).json({ message: 'Thread not found' })
  }

  const message = {
    sender: req.user.id,
    text: req.body.text,
    files: req.body.files || [],
  }

  thread.messages.push(message)
  thread.lastMessageAt = new Date()
  await thread.save()

  res.status(201).json({ message: thread.messages.at(-1) })
})
