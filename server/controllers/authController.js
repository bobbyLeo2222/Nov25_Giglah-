import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import RefreshToken from '../models/RefreshToken.js'
import { sendMail } from '../utils/mailer.js'
import { generateRandomToken, hashToken, signAccessToken } from '../utils/tokens.js'

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user
  delete obj.passwordHash
  delete obj.resetTokenHash
  delete obj.resetTokenExpiresAt
  delete obj.verificationTokenHash
  delete obj.verificationTokenExpiresAt
  return obj
}

const REFRESH_TTL_DAYS = 30
const buildAppBaseUrl = () => process.env.CLIENT_ORIGIN || 'http://localhost:5173'

const issueTokens = async (user, context = {}) => {
  const accessToken = signAccessToken(user)
  const refreshToken = generateRandomToken()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)
  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt,
    userAgent: context.userAgent,
    ip: context.ip,
  })
  return { accessToken, refreshToken }
}

export const register = async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' })
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    return res.status(400).json({ message: 'An account already exists for that email' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const verificationToken = generateRandomToken()
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role === 'seller' ? 'seller' : 'buyer',
    emailVerified: false,
    verificationTokenHash: hashToken(verificationToken),
    verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  if (process.env.SMTP_HOST) {
    const verifyLink = `${buildAppBaseUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      user.email,
    )}`
    await sendMail({
      to: user.email,
      subject: 'Verify your email for GigLah!',
      text: `Welcome to GigLah! Click to verify your email: ${verifyLink}`,
      html: `<p>Welcome to GigLah!</p><p><a href="${verifyLink}">Verify your email</a></p>`,
    })
  }

  const tokens = await issueTokens(user, { userAgent: req.get('user-agent'), ip: req.ip })
  return res.status(201).json({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user: sanitizeUser(user) })
}

export const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const valid = await user.comparePassword(password)
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const tokens = await issueTokens(user, { userAgent: req.get('user-agent'), ip: req.ip })
  return res.json({
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: sanitizeUser(user),
    emailVerified: user.emailVerified,
  })
}

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash')
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  return res.json({ user })
}

export const refreshSession = async (req, res) => {
  const refreshToken = req.refreshToken
  const user = await User.findById(refreshToken.user)
  if (!user) return res.status(401).json({ message: 'User not found' })
  const accessToken = signAccessToken(user)
  return res.json({ token: accessToken })
}

export const logout = async (req, res) => {
  const refreshTokenValue = req.body?.refreshToken || req.cookies?.refreshToken || ''
  if (refreshTokenValue) {
    await RefreshToken.updateOne({ token: refreshTokenValue }, { revokedAt: new Date() })
  }
  res.json({ message: 'Logged out' })
}

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Email is required' })
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) return res.json({ message: 'If that account exists, a reset email has been sent.' })
  const resetToken = generateRandomToken()
  user.resetTokenHash = hashToken(resetToken)
  user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await user.save()
  if (process.env.SMTP_HOST) {
    const resetLink = `${buildAppBaseUrl()}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email,
    )}`
    await sendMail({
      to: user.email,
      subject: 'Reset your GigLah! password',
      text: `Use this code to reset your password: ${resetToken}\n\nReset link: ${resetLink}`,
      html: `<p>Use this code to reset your password within 60 minutes:</p><p><strong>${resetToken}</strong></p><p>Or click the link:</p><p><a href="${resetLink}">Reset password</a></p>`,
    })
  }
  return res.json({ message: 'If that account exists, a reset email has been sent.' })
}

export const resetPassword = async (req, res) => {
  const { email, token, password } = req.body
  if (!email || !token || !password) {
    return res.status(400).json({ message: 'Email, token, and new password are required' })
  }
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
    return res.status(400).json({ message: 'Invalid reset token' })
  }
  if (user.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ message: 'Reset token expired' })
  }
  if (user.resetTokenHash !== hashToken(token)) {
    return res.status(400).json({ message: 'Invalid reset token' })
  }
  user.passwordHash = await bcrypt.hash(password, 10)
  user.resetTokenHash = undefined
  user.resetTokenExpiresAt = undefined
  await user.save()
  return res.json({ message: 'Password updated' })
}

export const verifyEmail = async (req, res) => {
  const { email, token } = req.body
  if (!email || !token) return res.status(400).json({ message: 'Email and token are required' })
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user || !user.verificationTokenHash || !user.verificationTokenExpiresAt) {
    return res.status(400).json({ message: 'Invalid verification token' })
  }
  if (user.verificationTokenExpiresAt < new Date()) {
    return res.status(400).json({ message: 'Verification token expired' })
  }
  if (user.verificationTokenHash !== hashToken(token)) {
    return res.status(400).json({ message: 'Invalid verification token' })
  }
  user.emailVerified = true
  user.verificationTokenHash = undefined
  user.verificationTokenExpiresAt = undefined
  await user.save()
  return res.json({ message: 'Email verified', user: sanitizeUser(user) })
}

export const resendVerification = async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Email is required' })
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) return res.json({ message: 'If that account exists, a verification email has been sent.' })
  if (user.emailVerified) return res.json({ message: 'Email already verified.' })
  const verificationToken = generateRandomToken()
  user.verificationTokenHash = hashToken(verificationToken)
  user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await user.save()
  if (process.env.SMTP_HOST) {
    const verifyLink = `${buildAppBaseUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      user.email,
    )}`
    await sendMail({
      to: user.email,
      subject: 'Verify your email for GigLah!',
      text: `Verify your email: ${verifyLink}`,
      html: `<p><a href="${verifyLink}">Verify your email</a></p>`,
    })
  }
  return res.json({ message: 'If that account exists, a verification email has been sent.' })
}
