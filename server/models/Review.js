import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile' },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, required: true },
    project: { type: String },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const Review = mongoose.model('Review', reviewSchema)

export default Review
