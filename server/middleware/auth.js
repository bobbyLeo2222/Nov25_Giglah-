import jwt from 'jsonwebtoken'

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
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
      req.user = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      // Ignore invalid tokens for optional paths
    }
  }

  next()
}
