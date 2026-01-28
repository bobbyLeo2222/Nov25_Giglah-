import mongoose from 'mongoose'

const analyticsEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['gig_view'], required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: String },
    gigId: { type: String },
    viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Object },
  },
  { timestamps: true },
)

analyticsEventSchema.index({ seller: 1, type: 1, createdAt: -1 })
analyticsEventSchema.index({ gigId: 1, createdAt: -1 })

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema)

export default AnalyticsEvent
