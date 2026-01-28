import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: String },
    gigId: { type: String, required: true },
    gigTitle: { type: String, required: true },
    price: { type: Number, required: true },
    notes: { type: String },
    deliveryDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'delivered', 'complete', 'cancelled'],
      default: 'pending',
    },
    buyerCompletedAt: { type: Date },
    sellerCompletedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    cancelledBy: { type: String, enum: ['buyer', 'seller', 'admin'] },
    milestones: [
      {
        title: { type: String },
        amount: { type: Number, default: 0 },
        dueDate: { type: Date },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'complete'],
          default: 'pending',
        },
      },
    ],
  },
  { timestamps: true },
)

const Order = mongoose.model('Order', orderSchema)

export default Order
