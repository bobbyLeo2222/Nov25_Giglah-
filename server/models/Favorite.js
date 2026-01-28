import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['gig', 'seller'], required: true },
    targetId: { type: String, required: true },
  },
  { timestamps: true },
)

favoriteSchema.index({ user: 1, type: 1, targetId: 1 }, { unique: true })

const Favorite = mongoose.model('Favorite', favoriteSchema)

export default Favorite
