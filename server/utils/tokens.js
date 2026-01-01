import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const TOKEN_BYTES = 32

export const generateRandomToken = () => crypto.randomBytes(TOKEN_BYTES).toString('hex')
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

export const signAccessToken = (user, ttl = '15m') =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ttl,
  })

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET)
