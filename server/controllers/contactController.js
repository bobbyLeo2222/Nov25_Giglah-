import nodemailer from 'nodemailer'
import asyncHandler from '../utils/asyncHandler.js'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendContact = asyncHandler(async (req, res) => {
  const { name, email, message, subject } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required' })
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: subject || `New contact message from ${name}`,
    text: `${message}\n\nFrom: ${name} (${email})`,
  }

  await transporter.sendMail(mailOptions)
  res.status(200).json({ message: 'Message sent' })
})
