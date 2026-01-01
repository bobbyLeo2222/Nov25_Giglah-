import mongoose from 'mongoose'

const inquirySchema = new mongoose.Schema(
  {
    gigId: { type: String, required: true },
    sellerId: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contactName: { type: String },
    contactEmail: { type: String },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'read', 'responded', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true },
)

const Inquiry = mongoose.model('Inquiry', inquirySchema)

export default Inquiry
