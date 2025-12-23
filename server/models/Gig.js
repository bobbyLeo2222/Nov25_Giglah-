import mongoose from 'mongoose'

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile' },
    sellerName: { type: String },
    sellerId: { type: String },
    category: { type: String },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft' },
    description: { type: String },
    imageUrl: { type: String },
    instagramUrl: { type: String },
    websiteUrl: { type: String },
    media: {
      type: [
        {
          url: { type: String, required: true },
          type: { type: String, enum: ['image', 'video'], default: 'image' },
          thumbnailUrl: { type: String },
        },
      ],
      default: [],
    },
    packages: {
      type: [
        {
          name: { type: String, trim: true },
          description: { type: String, trim: true },
          price: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

const Gig = mongoose.model('Gig', gigSchema)

export default Gig
