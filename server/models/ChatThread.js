import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true },
    files: [{ url: String, name: String, size: Number }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

const chatThreadSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [messageSchema],
    title: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

chatThreadSchema.index({ participants: 1 })

const ChatThread = mongoose.model('ChatThread', chatThreadSchema)

export default ChatThread
