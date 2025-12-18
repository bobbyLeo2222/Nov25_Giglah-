import nodemailer from 'nodemailer'

const buildTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || (process.env.EMAIL_USER ? 'smtp.gmail.com' : '')
  const smtpPort = Number(process.env.SMTP_PORT) || 587
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS

  if (!smtpHost) {
    console.warn('SMTP not configured (set SMTP_HOST/USER/PASS or EMAIL_USER/PASS). Emails will be skipped.')
    return null
  }

  // If using Gmail with app password, this works with host+port or service:gmail.
  const base = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser
      ? {
          user: smtpUser,
          pass: smtpPass,
        }
      : undefined,
  }

  if (smtpHost === 'smtp.gmail.com') {
    return nodemailer.createTransport({
      ...base,
      service: 'gmail',
    })
  }

  return nodemailer.createTransport(base)
}

const transporter = buildTransporter()

export const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.warn(`Skipping email to ${to}: transporter not configured.`)
    return { skipped: true }
  }
  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    (process.env.EMAIL_USER ? `GigLah! <${process.env.EMAIL_USER}>` : 'GigLah! <no-reply@giglah.com>')
  try {
    return await transporter.sendMail({ from, to, subject, text, html })
  } catch (error) {
    console.error('Email send failed:', error)
    throw error
  }
}
