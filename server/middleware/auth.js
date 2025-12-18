import jwt from 'jsonwebtoken'
import RefreshToken from '../models/RefreshToken.js'
import { verifyAccessToken } from '../utils/tokens.js'

export const authRequired = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT secret is not configured' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const decoded = verifyAccessToken(token)
    req.user = decoded
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token && process.env.JWT_SECRET) {
    try {
      req.user = verifyAccessToken(token)
    } catch (error) {
      // Ignore invalid tokens for optional paths
    }
  }

  next()
}

export const refreshAuth = async (req, res, next) => {
  const token = req.body?.refreshToken || req.cookies?.refreshToken || ''
  if (!token) return res.status(401).json({ message: 'Refresh token required' })
  const existing = await RefreshToken.findOne({ token, revokedAt: null })
  if (!existing || existing.expiresAt < new Date()) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
  req.refreshToken = existing
  return next()
}
