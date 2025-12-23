import mongoose from 'mongoose'

// Explicit sub-schema so files are stored as objects, not coerced to strings
const fileSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    name: { type: String, default: 'Attachment' },
    size: { type: Number, default: 0 },
    type: { type: String, default: 'file' },
  },
  { _id: false },
)

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true },
    files: { type: [fileSchema], default: [] },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

const chatThreadSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [messageSchema],
    title: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    typingStatuses: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        expiresAt: { type: Date },
      },
    ],
    gigId: { type: String },
    gigTitle: { type: String },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sellerName: { type: String },
    buyerName: { type: String },
  },
  { timestamps: true },
)

chatThreadSchema.index({ participants: 1 })

const ChatThread = mongoose.model('ChatThread', chatThreadSchema)

export default ChatThread
