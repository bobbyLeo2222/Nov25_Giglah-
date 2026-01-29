import './config/env.js'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import gigRoutes from './routes/gigRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import favoriteRoutes from './routes/favoriteRoutes.js'
import inquiryRoutes from './routes/inquiryRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'

const app = express()
const PORT = process.env.PORT || 5001

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000']

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/gigs', gigRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/inquiries', inquiryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/analytics', analyticsRoutes)

app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({ message: err.message || 'Server error' })
})

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server', error)
    process.exit(1)
  })
