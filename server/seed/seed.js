import bcrypt from 'bcryptjs'
import '../config/env.js'
import connectDB from '../config/db.js'
import slugify from '../utils/slugify.js'
import User from '../models/User.js'
import SellerProfile from '../models/SellerProfile.js'
import Gig from '../models/Gig.js'
import Review from '../models/Review.js'
import ChatThread from '../models/ChatThread.js'
import {
  initialGigs,
  initialSellerProfiles,
  initialSellerReviews,
  initialChatThreads,
} from './data.js'

const defaultPassword = process.env.SEED_USER_PASSWORD || 'password123'

const makeEmail = (value = '', domain = 'giglah.test') =>
  `${slugify(value) || 'user'}@${domain}`

const getCategoryForSeller = (sellerId, gigs) =>
  gigs.find((gig) => gig.sellerId === sellerId)?.category || null

const ensureUserFactory = (passwordHash) => {
  const cache = new Map()

  return async ({ name, email, role = 'buyer', avatarUrl = '' }) => {
    const key = (email || makeEmail(name)).toLowerCase()
    if (cache.has(key)) return cache.get(key)

    let user = await User.findOne({ email: key })
    if (!user) {
      user = await User.create({
        name,
        email: key,
        passwordHash,
        role,
        avatarUrl,
      })
    } else {
      user.name = user.name || name
      user.avatarUrl = user.avatarUrl || avatarUrl
      if (role === 'seller' && user.role !== 'seller') {
        user.role = 'seller'
      }
      await user.save()
    }

    cache.set(key, user)
    return user
  }
}

const seed = async () => {
  console.log('Connecting to MongoDB...')
  await connectDB()

  console.log('Clearing existing collections...')
  await Promise.all([
    User.deleteMany({}),
    SellerProfile.deleteMany({}),
    Gig.deleteMany({}),
    Review.deleteMany({}),
    ChatThread.deleteMany({}),
  ])

  const passwordHash = await bcrypt.hash(defaultPassword, 10)
  const ensureUser = ensureUserFactory(passwordHash)

  console.log('Seeding seller users and profiles...')
  const sellerMap = new Map()
  for (const profile of initialSellerProfiles) {
    const sellerId = profile.id || slugify(profile.name)
    const email = makeEmail(sellerId)
    const user = await ensureUser({
      name: profile.name,
      email,
      role: 'seller',
      avatarUrl: profile.avatar,
    })

    const sellerProfile = await SellerProfile.create({
      user: user._id,
      displayName: profile.name,
      sellerId,
      headline: profile.headline,
      bio: profile.about,
      category: getCategoryForSeller(sellerId, initialGigs),
      skills: profile.specialties || [],
      languages: profile.languages || [],
      location: profile.location,
      instagramUrl: profile.socials?.instagram,
      websiteUrl: profile.socials?.website,
      imageUrl: profile.avatar,
      availability: profile.availability,
    })

    sellerMap.set(sellerId, { user, sellerProfile })
  }

  console.log('Seeding missing sellers from gigs...')
  for (const gig of initialGigs) {
    if (sellerMap.has(gig.sellerId)) continue

    const sellerId = gig.sellerId || slugify(gig.seller)
    const user = await ensureUser({
      name: gig.seller || sellerId,
      email: makeEmail(sellerId),
      role: 'seller',
    })

    const sellerProfile = await SellerProfile.create({
      user: user._id,
      displayName: gig.seller || sellerId,
      sellerId,
      headline: gig.title,
      category: gig.category,
      imageUrl: gig.imageUrl,
      instagramUrl: gig.instagramUrl,
      websiteUrl: gig.websiteUrl,
      availability: gig.status || 'Published',
    })

    sellerMap.set(sellerId, { user, sellerProfile })
  }

  console.log('Seeding gigs...')
  for (const gig of initialGigs) {
    const sellerEntry = sellerMap.get(gig.sellerId)
    if (!sellerEntry) {
      console.warn(`Skipping gig ${gig.id} because seller ${gig.sellerId} was not seeded`)
      continue
    }

    await Gig.create({
      title: gig.title,
      seller: sellerEntry.user._id,
      sellerProfile: sellerEntry.sellerProfile._id,
      sellerName: sellerEntry.sellerProfile.displayName,
      sellerId: sellerEntry.sellerProfile.sellerId,
      category: gig.category,
      price: gig.price,
      status: gig.status,
      description: gig.description,
      media: gig.media || [],
      imageUrl: gig.imageUrl,
      instagramUrl: gig.instagramUrl,
      websiteUrl: gig.websiteUrl,
      owner: gig.owner || null,
    })
  }

  console.log('Seeding reviews...')
  for (const [sellerId, reviews] of Object.entries(initialSellerReviews)) {
    const sellerEntry = sellerMap.get(sellerId)
    if (!sellerEntry) {
      console.warn(`Skipping reviews for seller ${sellerId} (profile missing)`)
      continue
    }

    for (const review of reviews) {
      const buyerUser = await ensureUser({
        name: review.reviewerName,
        email: makeEmail(review.reviewerName),
        role: 'buyer',
      })

      await Review.create({
        seller: sellerEntry.user._id,
        sellerProfile: sellerEntry.sellerProfile._id,
        buyer: buyerUser._id,
        rating: review.rating,
        text: review.comment,
        project: review.project,
      })
    }
  }

  console.log('Seeding chat threads...')
  for (const thread of initialChatThreads) {
    const sellerEntryByName = sellerMap.get(slugify(thread.sellerName))
    const sellerEntryByGig = sellerMap.get(
      initialGigs.find((gig) => gig.id === thread.gigId)?.sellerId || '',
    )
    const seller = sellerEntryByName || sellerEntryByGig
    if (!seller) {
      console.warn(`Skipping thread ${thread.id} because seller could not be matched`)
      continue
    }

    const buyerEmail = thread.buyerEmail || makeEmail(thread.buyerName)
    const buyerUser = await ensureUser({
      name: thread.buyerName,
      email: buyerEmail,
      role: 'buyer',
    })

    const participants = [seller.user._id, buyerUser._id]
    const messages = (thread.messages || []).map((msg) => ({
      sender: msg.senderRole === 'seller' ? seller.user._id : buyerUser._id,
      text: msg.text,
      files: (msg.attachments || []).map((file) => ({
        url: file.previewUrl || '',
        name: file.name,
        size: 0,
      })),
      createdAt: new Date(msg.sentAt || Date.now()),
    }))

    const lastMessageAt =
      thread.lastUpdatedAt || thread.messages?.at(-1)?.sentAt || Date.now()

    await ChatThread.create({
      participants,
      messages,
      title: thread.gigTitle || thread.id,
      lastMessageAt: new Date(lastMessageAt),
    })
  }

  console.log('Seed complete!')
  console.log(`Seeded ${sellerMap.size} sellers, ${initialGigs.length} gigs, ${Object.values(initialSellerReviews).flat().length} reviews, ${initialChatThreads.length} threads.`)
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
