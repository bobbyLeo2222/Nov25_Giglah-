const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '0 KB'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
  const sized = bytes / Math.pow(1024, index)
  return `${sized.toFixed(index === 0 ? 0 : 1)} ${sizes[index]}`
}

const timeAgo = (timestamp) => {
  const parsed = timestamp ? new Date(timestamp).getTime() : 0
  const diff = Date.now() - parsed
  if (!Number.isFinite(diff) || diff <= 0) return 'Just now'
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const formatChatTime = (timestamp) =>
  new Intl.DateTimeFormat('en-SG', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(timestamp),
  )

const buildSellerId = (value) =>
  (value || 'seller').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
  'seller'

const defaultAvatar =
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'
const defaultHeroImage =
  'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80'

const normalizeGigMedia = (media = []) => {
  if (!Array.isArray(media)) return []
  return media
    .map((item) => {
      if (!item) return null
      if (typeof item === 'string') return { url: item, type: 'image', thumbnailUrl: '' }
      if (!item.url) return null
      const type = item.type === 'video' ? 'video' : 'image'
      return {
        url: item.url,
        type,
        thumbnailUrl: item.thumbnailUrl || '',
      }
    })
    .filter(Boolean)
}

const normalizeGig = (gig) => {
  const rawSeller = gig.seller
  let sellerUserId = ''
  if (typeof rawSeller === 'string' && /^[a-f0-9]{24}$/i.test(rawSeller)) {
    sellerUserId = rawSeller
  } else if (rawSeller?._id) {
    sellerUserId = rawSeller._id.toString()
  } else if (rawSeller?.toString) {
    const maybe = rawSeller.toString()
    sellerUserId = /^[a-f0-9]{24}$/i.test(maybe) ? maybe : ''
  }

  return {
    id: gig._id || gig.id,
    title: gig.title,
    seller: gig.sellerName || gig.seller || 'Seller',
    sellerUserId,
    sellerId: gig.sellerId || gig.sellerProfile?.sellerId || gig.sellerProfile?._id || '',
    category: gig.category || '',
    packages: Array.isArray(gig.packages)
      ? gig.packages.map((pkg) => ({
          name: pkg.name || 'Package',
          description: pkg.description || '',
          price: Number(pkg.price) || 0,
        }))
      : [],
    price: (() => {
      const base = Number(gig.price) || 0
      if (base > 0) return base
      const packagePrices = (gig.packages || []).map((pkg) => Number(pkg.price) || 0)
      const lowest = packagePrices.length ? Math.min(...packagePrices) : 0
      return Number.isFinite(lowest) ? lowest : 0
    })(),
    status: gig.status || 'Published',
    description: gig.description || '',
    owner: gig.owner || null,
    imageUrl: gig.imageUrl || '',
    instagramUrl: gig.instagramUrl || '',
    websiteUrl: gig.websiteUrl || '',
    media: normalizeGigMedia(gig.media),
  }
}

const parseLanguages = (languages = []) =>
  (languages || []).map((entry) => {
    if (typeof entry === 'string') {
      const match = entry.match(/^(.*)\s+\((.*)\)$/)
      if (match) return { language: match[1], level: match[2] }
      return { language: entry, level: '' }
    }
    if (entry && typeof entry === 'object') {
      return { language: entry.language || entry.name || '', level: entry.level || entry.fluency || '' }
    }
    return null
  }).filter(Boolean)

const normalizeProfile = (profile) => ({
  id: profile.sellerId || profile._id,
  userId: profile.user?._id || '',
  displayName: profile.displayName || profile.user?.name || 'Seller',
  name: profile.displayName || profile.user?.name || 'Seller',
  headline: profile.headline || 'Independent seller',
  bio: profile.bio || profile.about || '',
  about: profile.bio || profile.about || 'Describe your expertise so buyers know what you do.',
  location: profile.location || 'Location not set',
  avatar: profile.imageUrl || defaultAvatar,
  heroImage: profile.imageUrl || defaultHeroImage,
  specialties: profile.skills || ['Custom engagements', 'Flexible timelines'],
  skills: profile.skills || [],
  languages: parseLanguages(profile.languages),
  stats: profile.stats || { projects: 0, response: '—', repeat: '—' },
  socials: { website: profile.websiteUrl || '', instagram: profile.instagramUrl || '' },
  websiteUrl: profile.websiteUrl || '',
  instagramUrl: profile.instagramUrl || '',
  availability: profile.availability || 'Available',
  languagesRaw: profile.languages || [],
})

const normalizeReview = (review) => ({
  id: review._id || review.id,
  reviewerName: review.buyer?.name || review.reviewerName || 'Buyer',
  rating: review.rating,
  comment: review.text || review.comment,
  project: review.project || 'Custom brief',
  createdAt: review.createdAt ? new Date(review.createdAt).getTime() : Date.now(),
  isVerified: Boolean(review.isVerified || review.order),
})

const normalizeMessage = (msg) => ({
  id: msg._id || msg.id,
  senderId: msg.sender?._id || msg.sender?.id || msg.sender,
  senderName: msg.senderName || msg.sender?.name || 'Member',
  senderRole: msg.senderRole || 'buyer',
  text: msg.text || '',
  sentAt: msg.createdAt ? new Date(msg.createdAt).getTime() : msg.sentAt || Date.now(),
  attachments: (msg.files || msg.attachments || []).map((file, index) => ({
    id: file.id || `${msg._id || msg.id || 'file'}-${index}`,
    name: file.name || 'Attachment',
    sizeLabel: file.sizeLabel || formatFileSize(file.size || 0),
    type: file.type || 'file',
    url: file.url || '',
  })),
  readBy: (msg.readBy || []).map((id) => (typeof id === 'string' ? id : id?._id || id?.id)),
})

const mapUserFromApi = (apiUser) =>
  apiUser ? { ...apiUser, isSeller: apiUser.role === 'seller' } : null

export {
  buildSellerId,
  defaultAvatar,
  defaultHeroImage,
  formatChatTime,
  formatFileSize,
  mapUserFromApi,
  normalizeGig,
  normalizeGigMedia,
  normalizeMessage,
  normalizeProfile,
  normalizeReview,
  timeAgo,
}
