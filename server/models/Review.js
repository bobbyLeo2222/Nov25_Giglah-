import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile' },
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, required: true },
    project: { type: String },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
)

reviewSchema.index({ sellerProfile: 1, createdAt: -1 })
reviewSchema.index({ gig: 1, createdAt: -1 })
reviewSchema.index({ buyer: 1, gig: 1 }, { unique: true })

const Review = mongoose.model('Review', reviewSchema)

export default Review
