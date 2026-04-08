import { Router } from 'express'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'
import { authRequired } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'avi', 'mkv', 'webm']

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'giglah/uploads',
    allowed_formats: allowedFormats,
    resource_type: 'auto',
  },
})

const upload = multer({ storage })

const ensureCloudinaryConfigured = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return false
  }
  return true
}

const handleMediaUpload = asyncHandler(async (req, res) => {
  if (!ensureCloudinaryConfigured()) {
    return res.status(500).json({ message: 'Cloudinary is not configured' })
  }

  if (!req.file?.path) {
    return res.status(400).json({ message: 'Upload failed' })
  }

  const isVideo = (req.file.mimetype || '').startsWith('video/')

  res.status(201).json({
    url: req.file.path,
    name: req.file.originalname,
    size: req.file.size,
    type: isVideo ? 'video' : 'image',
  })
})

router.post('/media', authRequired, upload.single('file'), handleMediaUpload)
router.post('/image', authRequired, upload.single('file'), handleMediaUpload)

export default router
