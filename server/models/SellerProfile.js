import mongoose from 'mongoose'
import slugify from '../utils/slugify.js'

const sellerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String, required: true, trim: true },
    sellerId: { type: String, required: true, unique: true },
    headline: { type: String },
    bio: { type: String },
    category: { type: String },
    skills: [{ type: String }],
    languages: [{ type: String }],
    rate: { type: Number },
    location: { type: String },
    instagramUrl: { type: String },
    websiteUrl: { type: String },
    imageUrl: { type: String },
    phone: { type: String },
    availability: { type: String, default: 'Available' },
  },
  { timestamps: true },
)

sellerProfileSchema.pre('validate', function preValidate(next) {
  if (this.isModified('displayName')) {
    this.sellerId = slugify(this.displayName)
  }
  if (typeof next === 'function') next()
})

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema)

export default SellerProfile
