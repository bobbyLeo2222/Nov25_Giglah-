import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import TopBar from '@/components/ui/TopBar'
import {
  serviceCategories,
  languageOptions,
  competencyLevels,
  initialSellerForm,
  privacyPoints,
  termsPoints,
} from '@/data/static'
import LoginModal from '@/frontend/auth/LoginModal'
import SignupModal from '@/frontend/auth/SignupModal'
import GigCard from '@/frontend/components/GigCard'
import RatingStars from '@/frontend/components/RatingStars'
import DashboardView from '@/frontend/views/DashboardView'
import ChatView from '@/frontend/views/ChatView'
import {
  buildSellerId,
  defaultAvatar,
  defaultHeroImage,
  formatFileSize,
  mapUserFromApi,
  normalizeGig,
  normalizeProfile,
  normalizeReview,
  timeAgo,
} from '@/frontend/helpers'
import { fetchJSON, getStoredToken, setStoredToken } from '@/lib/api'

function App() {
  const [view, setView] = useState('dashboard')
  const [forms, setForms] = useState({
    signup: { fullName: '', email: '', password: '' },
    login: { email: '', password: '' },
  })
  const [authToken, setAuthToken] = useState(() => getStoredToken())
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [gigs, setGigs] = useState([])
  const [gigMedia, setGigMedia] = useState([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [newGig, setNewGig] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
  })
  const [message, setMessage] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({
    signup: '',
    login: '',
  })
  const [sellerForm, setSellerForm] = useState(initialSellerForm)
  const [sellerError, setSellerError] = useState('')
  const [sellerProfiles, setSellerProfiles] = useState([])
  const [sellerReviews, setSellerReviews] = useState({})
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, text: '', project: '' })
  const [currentServiceSlide, setCurrentServiceSlide] = useState(0)
  const [chatThreads, setChatThreads] = useState([])
  const [selectedThreadId, setSelectedThreadId] = useState('')
  const [composerText, setComposerText] = useState('')
  const [composerFiles, setComposerFiles] = useState([])
  const [chatSearch, setChatSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataError, setDataError] = useState('')
  const authedFetch = (path, options = {}) => fetchJSON(path, { ...options, token: authToken })
  const persistAuth = (token, apiUser) => {
    setAuthToken(token || '')
    setStoredToken(token || '')
    setUser(mapUserFromApi(apiUser))
  }
  const clearAuth = () => {
    setAuthToken('')
    setStoredToken('')
    setUser(null)
  }

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-SG', {
        style: 'currency',
        currency: 'SGD',
        maximumFractionDigits: 0,
      }),
    [],
  )

  const selectedSeller = useMemo(
    () => sellerProfiles.find((profile) => profile.id === selectedSellerId) ?? null,
    [sellerProfiles, selectedSellerId],
  )

  const sellerPortfolio = useMemo(
    () => gigs.filter((gig) => gig.sellerId === selectedSellerId),
    [gigs, selectedSellerId],
  )

  const sellerReviewList = useMemo(
    () => sellerReviews[selectedSellerId] || [],
    [sellerReviews, selectedSellerId],
  )

  const sellerRatingSummary = useMemo(() => {
    if (!sellerReviewList.length) return { average: 0, count: 0 }
    const total = sellerReviewList.reduce((sum, review) => sum + (Number(review.rating) || 0), 0)
    const average = Number((total / sellerReviewList.length).toFixed(1))
    return { average, count: sellerReviewList.length }
  }, [sellerReviewList])

  const selectedThread = useMemo(
    () => chatThreads.find((thread) => thread.id === selectedThreadId) ?? null,
    [chatThreads, selectedThreadId],
  )

  const sortedThreads = useMemo(
    () => [...chatThreads].sort((a, b) => (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0)),
    [chatThreads],
  )

  const userSellerId = useMemo(
    () => (user ? buildSellerId(user.email || user.name || '') : ''),
    [user],
  )

  const isGigOwner = useCallback(
    (gig) => {
      if (!user) return false
      const owner = gig.owner
      const userId = user._id || user.id
      return (
        owner === user.email ||
        owner === userId ||
        gig.sellerId === userSellerId ||
        gig.seller === userId
      )
    },
    [user, userSellerId],
  )

  const visibleThreads = useMemo(() => {
    const searchTerm = chatSearch.trim().toLowerCase()
    if (!searchTerm) return sortedThreads
    return sortedThreads.filter(
      (thread) =>
        thread.gigTitle.toLowerCase().includes(searchTerm) ||
        thread.sellerName.toLowerCase().includes(searchTerm) ||
        (thread.buyerName || '').toLowerCase().includes(searchTerm),
    )
  }, [chatSearch, sortedThreads])

  const myGigs = useMemo(
    () => (user ? gigs.filter((gig) => isGigOwner(gig)) : []),
    [gigs, isGigOwner, user],
  )

  const userGigCount = myGigs.length

  const categoryLabels = useMemo(
    () => serviceCategories.flatMap((group) => group.items.map((item) => item.label)),
    [],
  )

  const serviceSlides = useMemo(() => {
    const palettes = [
      'from-purple-600 via-fuchsia-500 to-orange-400',
      'from-sky-600 via-cyan-500 to-emerald-400',
      'from-amber-600 via-orange-500 to-rose-500',
      'from-indigo-600 via-blue-500 to-teal-400',
    ]
    const slides = []
    serviceCategories.forEach((group, groupIndex) => {
      group.items.forEach((item, itemIndex) => {
        const palette = palettes[(groupIndex + itemIndex) % palettes.length]
        slides.push({
          ...item,
          group: group.title,
          palette,
        })
      })
    })
    return slides
  }, [])

  const currentSlide = serviceSlides[currentServiceSlide] || serviceSlides[0] || null

  useEffect(() => {
    if (!serviceSlides.length) return undefined
    const id = setInterval(
      () => setCurrentServiceSlide((prev) => (prev + 1) % serviceSlides.length),
      5000,
    )
    return () => clearInterval(id)
  }, [serviceSlides])

  const orderedCategoryLabels = useMemo(() => {
    if (!activeCategory || !categoryLabels.includes(activeCategory)) return categoryLabels
    const remaining = categoryLabels.filter((label) => label !== activeCategory)
    return [activeCategory, ...remaining]
  }, [activeCategory, categoryLabels])

  const gigsByCategory = useMemo(() => {
    const map = {}
    categoryLabels.forEach((label) => {
      map[label] = gigs.filter(
        (gig) => (gig.category || '').toLowerCase() === label.toLowerCase(),
      )
    })
    return map
  }, [categoryLabels, gigs])

  useEffect(() => {
    if (!authToken) return undefined
    let cancelled = false
    setIsAuthLoading(true)
    authedFetch('/api/auth/me')
      .then((data) => {
        if (cancelled) return
        if (data?.user) {
          setUser(mapUserFromApi(data.user))
        }
      })
      .catch((error) => {
        console.error('Failed to restore session', error)
        if (!cancelled) {
          clearAuth()
        }
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authToken])

  useEffect(() => {
    const loadMarketplace = async () => {
      setIsLoadingData(true)
      setDataError('')
      try {
        const [gigData, profileData] = await Promise.all([
          fetchJSON('/api/gigs'),
          fetchJSON('/api/profiles'),
        ])
        const normalizedGigs = (gigData?.gigs || []).map(normalizeGig)
        const normalizedProfiles = (profileData?.profiles || []).map(normalizeProfile)
        setGigs(normalizedGigs)
        setSellerProfiles(normalizedProfiles)
        const fallbackSellerId =
          normalizedProfiles[0]?.id || normalizedGigs[0]?.sellerId || ''
        setSelectedSellerId((prev) => prev || fallbackSellerId)
      } catch (error) {
        console.error('Failed to load marketplace data', error)
        setDataError('Unable to load marketplace data from the API.')
        setMessage('Unable to load marketplace data from the API.')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadMarketplace()
  }, [])

  useEffect(() => {
    if (!selectedSellerId) return undefined
    let cancelled = false
    fetchJSON(`/api/reviews/${selectedSellerId}`)
      .then((data) => {
        if (cancelled) return
        const normalized = (data?.reviews || []).map(normalizeReview)
        setSellerReviews((prev) => ({
          ...prev,
          [selectedSellerId]: normalized,
        }))
      })
      .catch((error) => {
        console.error('Failed to load reviews', error)
      })

    return () => {
      cancelled = true
    }
  }, [selectedSellerId])

  const ensureSellerProfile = (sellerId, sellerName, extras = {}) => {
    if (!sellerId) return
    setSellerProfiles((prev) => {
      if (prev.some((profile) => profile.id === sellerId)) return prev
      const profile = {
        id: sellerId,
        name: sellerName || 'New Seller',
        headline: extras.headline || 'Independent seller',
        about: extras.about || 'Describe your expertise so buyers know what you do.',
        location: extras.location || 'Singapore · Remote/On-site',
        avatar: extras.avatar || defaultAvatar,
        heroImage: extras.heroImage || defaultHeroImage,
        specialties: extras.specialties || ['Custom engagements', 'Flexible timelines'],
        languages: extras.languages || ['English'],
        stats: extras.stats || { projects: 0, response: '—', repeat: '—' },
        socials: extras.socials || { website: '', instagram: '' },
        availability: extras.availability || 'Update your availability to convert buyers',
      }
      return [...prev, profile]
    })
  }

  const handleOpenSellerProfile = (sellerId, sellerName = '') => {
    if (!sellerId) return
    ensureSellerProfile(sellerId, sellerName)
    setSelectedSellerId(sellerId)
    setView('seller-profile')
  }

  const handleCategorySelect = (label) => {
    setActiveCategory(label)
    setView('categories')
  }

  const getCategoryIcon = (label) => {
    for (const group of serviceCategories) {
      const found = group.items.find((item) => item.label === label)
      if (found) return found.icon
    }
    return '📌'
  }

  const handleSelectThread = (threadId) => {
    setSelectedThreadId(threadId)
    setComposerText('')
    setComposerFiles([])
  }

  const handleComposerFiles = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    const mapped = files.map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      sizeLabel: formatFileSize(file.size || 0),
      previewUrl: file.type?.startsWith('image/') ? URL.createObjectURL(file) : '',
    }))
    setComposerFiles((prev) => [...prev, ...mapped])
    event.target.value = ''
  }

  const handleRemoveComposerFile = (fileId) => {
    setComposerFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleSendMessage = (event) => {
    event.preventDefault()
    if (!selectedThread) {
      setMessage('Pick a conversation first.')
      return
    }
    if (!user) {
      setMessage('Log in to send messages.')
      return
    }
    const text = composerText.trim()
    if (!text && composerFiles.length === 0) {
      setMessage('Type a message or attach a file first.')
      return
    }
    const now = Date.now()
    const newMessage = {
      id: `msg-${now}`,
      senderRole: user?.isSeller ? 'seller' : 'buyer',
      senderName: user?.name || 'Member',
      text,
      sentAt: now,
      attachments: composerFiles.map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        sizeLabel: file.sizeLabel,
        previewUrl: file.previewUrl,
      })),
    }
    setChatThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedThread.id
          ? { ...thread, lastUpdatedAt: now, messages: [...thread.messages, newMessage] }
          : thread,
      ),
    )
    setComposerText('')
    setComposerFiles([])
    setMessage('Message sent.')
  }

  const handleOpenChatFromGig = (gig) => {
    if (!gig) return
    if (gig.sellerId) {
      ensureSellerProfile(gig.sellerId, gig.seller)
      setSelectedSellerId(gig.sellerId)
    }
    const existingThread = chatThreads.find((thread) => thread.gigId === gig.id)
    setComposerText('')
    setComposerFiles([])
    if (existingThread) {
      setSelectedThreadId(existingThread.id)
      setView('chat')
      return
    }
    const now = Date.now()
    const buyerAlias = user?.name || 'Buyer'
    const newThread = {
      id: `thread-${gig.id}`,
      gigId: gig.id,
      gigTitle: gig.title,
      sellerName: gig.seller || 'Seller',
      buyerName: buyerAlias,
      buyerEmail: user?.email || '',
      lastUpdatedAt: now,
      messages: [],
    }
    setChatThreads((prev) => [newThread, ...prev])
    setSelectedThreadId(newThread.id)
    setView('chat')
    if (!user) {
      setMessage('Log in to message the seller.')
    }
  }

  const handleFormChange = (formKey, field) => (event) => {
    const value = event.target.value
    setForms((prev) => ({
      ...prev,
      [formKey]: { ...prev[formKey], [field]: value },
    }))
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    const { fullName, email, password } = forms.signup
    if (!fullName || !email || !password) {
      setFormErrors((prev) => ({ ...prev, signup: 'Please complete every field.' }))
      return
    }
    if (!/.+@.+\..+/.test(email)) {
      setFormErrors((prev) => ({ ...prev, signup: 'Use a valid email address.' }))
      return
    }
    if (password.length < 8) {
      setFormErrors((prev) => ({ ...prev, signup: 'Password must be at least 8 characters.' }))
      return
    }
    setFormErrors((prev) => ({ ...prev, signup: '' }))
    try {
      setIsAuthLoading(true)
      const data = await fetchJSON('/api/auth/register', {
        method: 'POST',
        body: {
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      })
      if (data?.token && data?.user) {
        persistAuth(data.token, data.user)
      }
      setForms((prev) => ({
        ...prev,
        signup: { fullName: '', email: '', password: '' },
      }))
      setMessage('Account created. Switch to seller any time.')
      setView('dashboard')
      setShowSignupPassword(false)
    } catch (error) {
      const message = error.message || 'Unable to create account.'
      setFormErrors((prev) => ({ ...prev, signup: message }))
      setMessage(message)
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    const { email, password } = forms.login
    if (!email || !password) {
      setFormErrors((prev) => ({ ...prev, login: 'Enter both email and password.' }))
      return
    }
    if (!/.+@.+\..+/.test(email)) {
      setFormErrors((prev) => ({ ...prev, login: 'Please enter a valid email.' }))
      return
    }
    setFormErrors((prev) => ({ ...prev, login: '' }))
    const alias = email.split('@')[0] ?? ''
    const friendlyName =
      alias
        .replace(/[._-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ') || 'GigLah Member'
    try {
      setIsAuthLoading(true)
      const data = await fetchJSON('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password },
      })
      if (data?.token && data?.user) {
        persistAuth(data.token, data.user)
      } else {
        setUser({
          name: friendlyName,
          email: email.trim().toLowerCase(),
          isSeller: false,
        })
      }
      setForms((prev) => ({
        ...prev,
        login: { email: '', password: '' },
      }))
      setMessage('Welcome back.')
      setView('dashboard')
      setShowLoginPassword(false)
    } catch (error) {
      const message = error.message || 'Unable to sign in.'
      setFormErrors((prev) => ({ ...prev, login: message }))
      setMessage(message)
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    setMessage('Signed out.')
    setView('dashboard')
  }

  const dismissModals = () => {
    setView('dashboard')
    setShowLoginPassword(false)
    setShowSignupPassword(false)
    setFormErrors({ signup: '', login: '' })
  }

  const handleGigChange = (field) => (event) => {
    const value = event.target.value
    setNewGig((prev) => ({ ...prev, [field]: value }))
  }

  const handleGigFiles = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    if (!user || !authToken) {
      setMessage('Log in as a seller to upload media.')
      if (event?.target) event.target.value = ''
      return
    }
    setIsUploadingMedia(true)
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          const data = await authedFetch('/api/uploads/media', { method: 'POST', body: formData })
          return {
            id: `media-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            url: data?.url || '',
            type: data?.type === 'video' ? 'video' : 'image',
            name: data?.name || file.name,
            thumbnailUrl: data?.thumbnailUrl || '',
          }
        }),
      )
      setGigMedia((prev) => [...uploads, ...prev].slice(0, 10))
      setMessage('Media uploaded. Finish your gig details and submit.')
    } catch (error) {
      const message = error.message || 'Upload failed. Try again.'
      setMessage(message)
    } finally {
      setIsUploadingMedia(false)
      if (event?.target) event.target.value = ''
    }
  }

  const handleRemoveGigMedia = (mediaId) => {
    setGigMedia((prev) => prev.filter((item) => item.id !== mediaId))
  }

  const handleCreateGig = async (event) => {
    event.preventDefault()
    if (!user || !authToken) {
      setMessage('Log in as a seller to publish gigs.')
      return
    }
    if (!user?.isSeller) {
      setMessage('Create your seller profile before publishing gigs.')
      return
    }
    const { title, category, price, description } = newGig
    if (!title || !category || !price) {
      setMessage('Add a title, category, and price.')
      return
    }
    try {
      const mediaPayload = gigMedia.map((item) => {
        const normalized = { url: item.url, type: item.type === 'video' ? 'video' : 'image' }
        if (item.thumbnailUrl) normalized.thumbnailUrl = item.thumbnailUrl
        return normalized
      })
      const primaryImage = gigMedia.find((item) => item.type === 'image')?.url || ''
      const ownerId = user?._id || user?.id || ''
      const payload = {
        title: title.trim(),
        category: category.trim(),
        price: Number(price),
        status: 'Published',
        description: description.trim() || 'Awaiting description.',
        ...(ownerId ? { owner: ownerId } : {}),
        media: mediaPayload,
        imageUrl: primaryImage,
      }
      const data = await authedFetch('/api/gigs', {
        method: 'POST',
        body: payload,
      })
      if (data?.gig) {
        const normalized = normalizeGig(data.gig)
        setGigs((prev) => [normalized, ...prev])
        ensureSellerProfile(normalized.sellerId, normalized.seller)
      }
      setNewGig({
        title: '',
        category: '',
        price: '',
        description: '',
      })
      setGigMedia([])
      setMessage('Gig published and visible on your dashboard.')
    } catch (error) {
      const message =
        error.message || 'Unable to create gig. Make sure your seller profile is saved.'
      setMessage(message)
    }
  }

  const inputClasses =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100'
  const modalInputClasses =
    'w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100'
  const sellerInputClasses =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100'

const handleForgotPassword = () => {
  setMessage('Password reset instructions will be emailed to you shortly.')
  dismissModals()
}

const openLoginModal = () => {
  setFormErrors((prev) => ({ ...prev, login: '' }))
  setShowLoginPassword(false)
  setView('login')
}

const openSignupModal = () => {
  setFormErrors((prev) => ({ ...prev, signup: '' }))
  setShowSignupPassword(false)
  setView('signup')
}

  const startSellerApplication = () => {
    if (!user) {
      setMessage('Log in first.')
      return
    }
    setSellerError('')
    setSellerForm(initialSellerForm)
    setView('seller-apply')
  }

  const cancelSellerApplication = () => {
    setSellerError('')
    setSellerForm(initialSellerForm)
    setView('seller')
  }

  const handleSellerFormChange = (field) => (event) => {
    if (field === 'profilePicture') {
      const file = event.target.files?.[0] ?? null
      setSellerForm((prev) => ({ ...prev, profilePicture: file }))
      return
    }
    const value = event.target.value
    setSellerForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddSkill = (event) => {
    event.preventDefault()
    const skill = sellerForm.skillInput.trim()
    if (!skill) return
    if (sellerForm.skills.length >= 5) {
      setSellerError('Add up to 5 skills only.')
      return
    }
    if (sellerForm.skills.some((existing) => existing.toLowerCase() === skill.toLowerCase())) {
      setSellerError('Skill already added.')
      return
    }
    setSellerForm((prev) => ({
      ...prev,
      skills: [...prev.skills, skill],
      skillInput: '',
    }))
    setSellerError('')
  }

  const handleRemoveSkill = (skill) => {
    setSellerForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }))
  }

  const handleAddLanguage = (event) => {
    event.preventDefault()
    const { languageSelection, levelSelection, languages } = sellerForm
    if (!languageSelection || !levelSelection) {
      setSellerError('Select both a language and competency level.')
      return
    }
    if (languages.some((entry) => entry.language === languageSelection)) {
      setSellerError('Language already added.')
      return
    }
    setSellerForm((prev) => ({
      ...prev,
      languages: [...prev.languages, { language: languageSelection, level: levelSelection }],
      languageSelection: '',
      levelSelection: '',
    }))
    setSellerError('')
  }

  const handleRemoveLanguage = (language) => {
    setSellerForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((entry) => entry.language !== language),
    }))
  }

  const handleSellerUpgrade = async (event) => {
    event.preventDefault()
    if (!user || !authToken) {
      setSellerError('Please sign in before becoming a seller.')
      return
    }
    const { fullName, displayName, description, phone, skills, languages } = sellerForm
    if (!fullName || !displayName || !description || !phone) {
      setSellerError('Complete your name, display details, description, and phone number.')
      return
    }
    if (skills.length === 0) {
      setSellerError('Add at least one skill.')
      return
    }
    if (languages.length === 0) {
      setSellerError('Add at least one language.')
      return
    }
    const languageList = languages.map((entry) =>
      entry.level ? `${entry.language} (${entry.level})` : entry.language,
    )
    const payload = {
      displayName: displayName.trim(),
      headline: description.trim(),
      bio: description.trim(),
      skills,
      languages: languageList,
      websiteUrl: sellerForm.website.trim(),
      instagramUrl: sellerForm.instagram.trim(),
      phone: phone.trim(),
      availability: 'Available',
    }
    try {
      setSellerError('')
      setIsAuthLoading(true)
      const data = await authedFetch('/api/profiles/me', {
        method: 'POST',
        body: payload,
      })
      if (data?.profile) {
        const normalized = normalizeProfile(data.profile)
        setSellerProfiles((prev) => {
          const others = prev.filter((profile) => profile.id !== normalized.id)
          return [normalized, ...others]
        })
        setSelectedSellerId(normalized.id)
      }
      setUser((prev) => (prev ? { ...prev, isSeller: true, role: 'seller' } : prev))
      setSellerForm(initialSellerForm)
      setView('seller')
      setMessage('Seller profile saved. Draft your first gig to go live.')
    } catch (error) {
      const message = error.message || 'Unable to save seller profile.'
      setSellerError(message)
      setMessage(message)
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleReviewDraftChange = (field) => (event) => {
    const value = event.target.value
    setReviewDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitReview = async (event) => {
    event.preventDefault()
    if (!selectedSellerId) {
      setMessage('Open a seller profile before leaving a review.')
      return
    }
    if (!user || !authToken) {
      setMessage('Log in as a buyer to leave a review.')
      return
    }
    if (user.isSeller) {
      setMessage('Switch to buyer mode to review sellers.')
      return
    }
    const ratingNumber = Number(reviewDraft.rating)
    const text = reviewDraft.text.trim()
    if (!ratingNumber || ratingNumber < 1 || ratingNumber > 5) {
      setMessage('Add a rating between 1 and 5.')
      return
    }
    if (!text) {
      setMessage('Share a quick note for this seller.')
      return
    }
    try {
      const data = await authedFetch(`/api/reviews/${selectedSellerId}`, {
        method: 'POST',
        body: {
          rating: ratingNumber,
          text,
          project: reviewDraft.project.trim() || 'Custom brief',
        },
      })
      const newReview = data?.review
        ? normalizeReview(data.review)
        : {
            id: `rev-${Date.now()}`,
            reviewerName: user.name || 'Buyer',
            rating: ratingNumber,
            comment: text,
            project: reviewDraft.project.trim() || 'Custom brief',
            createdAt: Date.now(),
          }
      setSellerReviews((prev) => ({
        ...prev,
        [selectedSellerId]: [newReview, ...(prev[selectedSellerId] || [])],
      }))
      setReviewDraft({ rating: 5, text: '', project: '' })
      setMessage('Review posted. Thanks for sharing feedback.')
    } catch (error) {
      const message = error.message || 'Unable to post review.'
      setMessage(message)
    }
  }

  const isWorkspaceView = view === 'dashboard' || view === 'login' || view === 'signup'
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden">
      <TopBar
        user={user}
        onDashboard={() => setView('dashboard')}
        onLogin={openLoginModal}
        onSignup={openSignupModal}
        onChat={() => setView('chat')}
        onSellerTools={() => setView('seller')}
        onLogout={handleLogout}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {message && (
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm font-medium text-purple-800 shadow-sm">
            {message}
          </div>
        )}
        {isLoadingData && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
            Loading the latest marketplace data...
          </div>
        )}
        {dataError && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
            {dataError}
          </div>
        )}

        {isWorkspaceView && (
          <DashboardView
            serviceSlides={serviceSlides}
            currentServiceSlide={currentServiceSlide}
            currentSlide={currentSlide}
            onPrevSlide={() =>
              setCurrentServiceSlide((prev) => (prev === 0 ? serviceSlides.length - 1 : prev - 1))
            }
            onNextSlide={() => setCurrentServiceSlide((prev) => (prev + 1) % serviceSlides.length)}
            onSelectSlide={(index) => setCurrentServiceSlide(index)}
            onSelectCategory={handleCategorySelect}
            onShowAllCategories={() => setView('categories')}
            gigs={gigs}
            formatter={formatter}
            onOpenSellerProfile={handleOpenSellerProfile}
            onOpenChat={handleOpenChatFromGig}
          />
        )}

        {view === 'chat' && (
          <ChatView
            chatThreads={chatThreads}
            chatSearch={chatSearch}
            onSearchChange={setChatSearch}
            visibleThreads={visibleThreads}
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
            selectedThread={selectedThread}
            composerText={composerText}
            onComposerChange={setComposerText}
            composerFiles={composerFiles}
            onComposerFiles={handleComposerFiles}
            onRemoveComposerFile={handleRemoveComposerFile}
            onSendMessage={handleSendMessage}
            onViewGig={() => setView('dashboard')}
            user={user}
          />
        )}

        {view === 'seller-profile' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {!selectedSeller ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-slate-900">Seller not found</p>
                <p className="text-sm text-slate-500">
                  Pick a seller from the marketplace to view their profile and reviews.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                      Seller profile
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-900">{selectedSeller.name}</h2>
                    <p className="text-sm text-slate-600">{selectedSeller.headline}</p>
                    <p className="text-sm text-slate-500">{selectedSeller.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-purple-600 text-white hover:bg-purple-500"
                      onClick={() =>
                        handleOpenChatFromGig(
                          sellerPortfolio[0] || {
                            id: `GL-${selectedSeller.id}`,
                            title: selectedSeller.headline,
                            seller: selectedSeller.name,
                            sellerId: selectedSeller.id,
                          },
                        )
                      }
                    >
                      Message seller
                    </Button>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <img
                        src={selectedSeller.avatar}
                        alt={selectedSeller.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">{selectedSeller.about}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-purple-100 px-3 py-1 font-semibold text-purple-700">
                            {selectedSeller.availability}
                          </span>
                          {selectedSeller.languages.map((language) => (
                            <span
                              key={language}
                              className="rounded-full bg-white px-3 py-1 font-semibold text-slate-600"
                            >
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500">Rating</p>
                        <div className="mt-2 flex items-center gap-2">
                          <RatingStars rating={sellerRatingSummary.average} />
                          <span className="text-base font-semibold text-slate-900">
                            {sellerRatingSummary.average
                              ? `${sellerRatingSummary.average}/5`
                              : 'No reviews'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {sellerRatingSummary.count} review{sellerRatingSummary.count === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500">Projects</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {selectedSeller.stats?.projects ?? 0}
                        </p>
                        <p className="text-xs text-slate-500">Completed engagements</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500">Response time</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {selectedSeller.stats?.response || '—'}
                        </p>
                        <p className="text-xs text-slate-500">Avg first reply</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500">Repeat clients</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {selectedSeller.stats?.repeat || '—'}
                        </p>
                        <p className="text-xs text-slate-500">Based on past projects</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">Specialties</p>
                        <span className="text-xs text-slate-500">What this seller focuses on</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSeller.specialties.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-900">Languages</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedSeller.languages.map((language) => (
                            <span
                              key={language}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-purple-100 via-slate-50 to-white shadow-inner">
                    <div className="h-60 w-full overflow-hidden">
                      <img
                        src={selectedSeller.heroImage}
                        alt={`${selectedSeller.name} portfolio`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-3 px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">Booking summary</p>
                      <p className="text-sm text-slate-600">
                        {selectedSeller.availability || 'Share when you are free this month.'}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {sellerPortfolio.slice(0, 3).map((gig) => (
                          <span
                            key={gig.id}
                            className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700"
                          >
                            {gig.title}
                          </span>
                        ))}
                        {sellerPortfolio.length === 0 && (
                          <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-500">
                            No gigs listed yet
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSeller.socials?.website && (
                          <a
                            href={selectedSeller.socials.website}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-purple-200 hover:text-purple-700"
                          >
                            Website
                          </a>
                        )}
                        {selectedSeller.socials?.instagram && (
                          <a
                            href={selectedSeller.socials.instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-purple-200 hover:text-purple-700"
                          >
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                        Services
                      </p>
                      <p className="text-lg font-semibold text-slate-900">Gigs by {selectedSeller.name}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {sellerPortfolio.length} listing{sellerPortfolio.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {sellerPortfolio.length === 0 && (
                      <p className="text-sm text-slate-500">
                        This seller has not published gigs yet. Message them to request a custom offer.
                      </p>
                    )}
                    {sellerPortfolio.map((gig) => (
                      <div
                        key={gig.id}
                        className="flex h-full flex-col rounded-2xl border border-white bg-white px-4 py-4 shadow-sm"
                      >
                        <p className="text-sm font-semibold text-slate-900">{gig.title}</p>
                        <p className="text-xs text-slate-500">{gig.category}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          {gig.description || 'Custom engagement available on request.'}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <span className="text-base font-semibold text-slate-900">
                            {gig.price ? formatter.format(gig.price) : 'Ask for quote'}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            onClick={() => handleOpenChatFromGig(gig)}
                          >
                            Enquire
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                          Reviews
                        </p>
                        <div className="flex items-center gap-3">
                          <RatingStars rating={sellerRatingSummary.average} />
                          <div>
                            <p className="text-lg font-semibold text-slate-900">
                              {sellerRatingSummary.average
                                ? `${sellerRatingSummary.average} / 5`
                                : 'No reviews yet'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {sellerRatingSummary.count} review{sellerRatingSummary.count === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => setView('dashboard')}
                      >
                        Browse other sellers
                      </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {sellerReviewList.length === 0 && (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                          No reviews yet. Be the first buyer to share feedback for {selectedSeller.name}.
                        </p>
                      )}
                      {sellerReviewList.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {review.reviewerName}
                              </p>
                              {review.project && (
                                <p className="text-xs text-slate-500">{review.project}</p>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {review.createdAt ? timeAgo(review.createdAt) : ''}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <RatingStars rating={review.rating} />
                            <span className="text-sm font-semibold text-slate-900">
                              {review.rating}/5
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm"
                    onSubmit={handleSubmitReview}
                  >
                    <p className="text-sm font-semibold text-slate-900">Leave a review</p>
                    <p className="text-xs text-slate-500">
                      Share a rating and note to help other buyers choose confidently.
                    </p>
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Rating</label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                          value={reviewDraft.rating}
                          onChange={handleReviewDraftChange('rating')}
                        >
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <option key={rating} value={rating}>
                              {rating} star{rating === 1 ? '' : 's'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Project or gig</label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                          placeholder="e.g., AI chatbot rollout"
                          value={reviewDraft.project}
                          onChange={handleReviewDraftChange('project')}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Review</label>
                        <textarea
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                          placeholder="What went well? How was the communication and delivery?"
                          value={reviewDraft.text}
                          onChange={handleReviewDraftChange('text')}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-purple-600 text-white hover:bg-purple-500"
                      >
                        Post review
                      </Button>
                      {!user && (
                        <p className="text-xs font-semibold text-amber-600">
                          Log in to post a review.
                        </p>
                      )}
                      {user?.isSeller && (
                        <p className="text-xs font-semibold text-amber-600">
                          Switch to buyer mode to review another seller.
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}


        {view === 'seller' && (
          <section className="w-full rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7h18M3 12h10m-7 5h14"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Seller hub</p>
                <h2 className="text-2xl font-semibold text-slate-900">List your gig for Singapore buyers</h2>
                <p className="text-sm text-slate-500">
                  Use the same login. Complete a quick profile, then submit your listing.
                </p>
              </div>
              {user?.isSeller && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {userGigCount || 0} live gig{userGigCount === 1 ? '' : 's'}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => handleOpenSellerProfile(userSellerId, user.name)}
                  >
                    Preview profile
                  </Button>
                </div>
              )}
            </div>

            {!user && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p>Sign in before activating seller mode.</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="bg-purple-600 text-white hover:bg-purple-500"
                    onClick={openLoginModal}
                  >
                    Log in
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={openSignupModal}
                  >
                    Create account
                  </Button>
                </div>
              </div>
            )}

            {user && !user.isSeller && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 px-5 py-4 text-sm text-slate-700">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ready to earn?
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    Switch this account to seller mode.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border border-purple-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-700 hover:bg-purple-50"
                  onClick={startSellerApplication}
                >
                  Start application
                </Button>
              </div>
            )}

            {user?.isSeller && (
              <div className="mt-6 space-y-6">
                <form className="space-y-4" onSubmit={handleCreateGig}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className={inputClasses}
                      placeholder="Gig title"
                      value={newGig.title}
                      onChange={handleGigChange('title')}
                    />
                    <input
                      className={inputClasses}
                      placeholder="Category"
                      value={newGig.category}
                      onChange={handleGigChange('category')}
                    />
                  </div>
                  <input
                    type="number"
                    className={inputClasses}
                    placeholder="Price (SGD)"
                    value={newGig.price}
                    onChange={handleGigChange('price')}
                  />
                  <textarea
                    rows={4}
                    className={`${inputClasses} resize-none`}
                    placeholder="Describe your deliverables and timeline."
                    value={newGig.description}
                    onChange={handleGigChange('description')}
                  />
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Photos & videos</p>
                        <p className="text-xs text-slate-500">
                          Upload images or short clips (jpg, png, webp, mp4, mov). Up to 10 files.
                        </p>
                      </div>
                      <label className="inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-purple-500">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={handleGigFiles}
                        />
                        Upload
                      </label>
                    </div>
                    {isUploadingMedia && (
                      <p className="text-xs font-semibold text-slate-600">Uploading media…</p>
                    )}
                    {gigMedia.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {gigMedia.map((item) => (
                          <div
                            key={item.id}
                            className="group relative overflow-hidden rounded-xl border border-white/60 bg-white"
                          >
                            {item.type === 'video' ? (
                              <video
                                src={item.url}
                                className="h-36 w-full object-cover"
                                controls
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt={item.name}
                                className="h-36 w-full object-cover"
                              />
                            )}
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[11px] font-semibold uppercase text-slate-600">
                                {item.type}
                              </span>
                              <button
                                type="button"
                                className="text-xs font-semibold text-rose-600 opacity-0 transition group-hover:opacity-100"
                                onClick={() => handleRemoveGigMedia(item.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-purple-600 text-white hover:bg-purple-500">
                    Submit gig
                  </Button>
                </form>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Your gigs</p>
                  <div className="mt-3 space-y-3">
                    {myGigs.length === 0 && (
                      <p>No gigs yet. Publish your first listing above.</p>
                    )}
                    {myGigs.map((gig) => (
                      <div
                        key={gig.id}
                        className="flex flex-wrap items-center justify-between rounded-xl border border-white/60 bg-white px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{gig.title}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatter.format(gig.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {view === 'seller-apply' && (
          <section className="w-full rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Become a seller
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">Complete your profile</h2>
                <p className="text-sm text-slate-500">
                  We review this info before unlocking seller tools for your account.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-sm text-slate-500 hover:text-slate-900"
                onClick={cancelSellerApplication}
              >
                Back to hub
              </Button>
            </div>

            {user ? (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex sm:items-center sm:gap-6">
                <p>
                  <span className="font-semibold text-slate-900">Username:</span>{' '}
                  {user.email.split('@')[0]}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Email:</span> {user.email}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                Please sign in to submit your seller profile.
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSellerUpgrade}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Name (Private)</label>
                <input
                  className={sellerInputClasses}
                  placeholder="e.g., Tan Wei Ming"
                  value={sellerForm.fullName}
                  onChange={handleSellerFormChange('fullName')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Display Name</label>
                <input
                  className={sellerInputClasses}
                  placeholder="e.g., Wei — Product Photographer"
                  value={sellerForm.displayName}
                  onChange={handleSellerFormChange('displayName')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSellerFormChange('profilePicture')}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-full file:border-0 file:bg-purple-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
                {sellerForm.profilePicture && (
                  <p className="text-xs text-slate-500">
                    Selected: {sellerForm.profilePicture?.name ?? '1 file'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  rows={4}
                  className={`${sellerInputClasses} resize-none`}
                  placeholder="Share your experience, notable projects, and what you specialise in."
                  value={sellerForm.description}
                  onChange={handleSellerFormChange('description')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Personal Website</label>
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  className={sellerInputClasses}
                  placeholder="https:// or www.yourdomain.com"
                  value={sellerForm.website}
                  onChange={handleSellerFormChange('website')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Instagram</label>
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  className={sellerInputClasses}
                  placeholder="https://instagram.com/yourusername"
                  value={sellerForm.instagram}
                  onChange={handleSellerFormChange('instagram')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Other Social Media</label>
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  className={sellerInputClasses}
                  placeholder="https://linkedin.com/in/yourname"
                  value={sellerForm.otherSocial}
                  onChange={handleSellerFormChange('otherSocial')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  className={sellerInputClasses}
                  placeholder="+65 9123 4567"
                  value={sellerForm.phone}
                  onChange={handleSellerFormChange('phone')}
                />
              </div>
              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-semibold text-slate-700">Skills</label>
                  <span className="text-xs text-slate-400">Add at least 1 skill, up to 5.</span>
                </div>
                <input
                  className={sellerInputClasses}
                  placeholder="e.g., Product Photography"
                  value={sellerForm.skillInput}
                  onChange={handleSellerFormChange('skillInput')}
                />
                <button
                  type="button"
                  className="h-11 rounded-full bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500"
                  onClick={handleAddSkill}
                >
                  Add Skill
                </button>
                {sellerForm.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sellerForm.skills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                      >
                        {skill}
                        <button
                          type="button"
                          className="text-purple-500 hover:text-purple-700"
                          onClick={() => handleRemoveSkill(skill)}
                          aria-label={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-base font-semibold text-slate-900">Languages and Competency Levels</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className={sellerInputClasses}
                    value={sellerForm.languageSelection}
                    onChange={handleSellerFormChange('languageSelection')}
                  >
                    <option value="">Select Language</option>
                    {languageOptions.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                  <select
                    className={sellerInputClasses}
                    value={sellerForm.levelSelection}
                    onChange={handleSellerFormChange('levelSelection')}
                  >
                    <option value="">Select Level</option>
                    {competencyLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="h-11 rounded-full bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500"
                  onClick={handleAddLanguage}
                >
                  Add Language
                </button>
                {sellerForm.languages.length > 0 && (
                  <ul className="space-y-2">
                    {sellerForm.languages.map((entry) => (
                      <li
                        key={entry.language}
                        className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-600"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{entry.language}</p>
                          <p className="text-xs text-slate-500">{entry.level}</p>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-rose-500"
                          onClick={() => handleRemoveLanguage(entry.language)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-purple-600 px-4 py-3 text-base font-semibold text-white shadow transition hover:bg-purple-500"
              >
                Submit
              </button>
            </form>
            {sellerError && (
              <p className="mt-4 text-sm font-semibold text-rose-600">{sellerError}</p>
            )}
          </section>
        )}

        {view === 'categories' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Categories
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">Browse gigs by category</h2>
                <p className="text-sm text-slate-600">
                  Tap a category below to focus. All marketplace categories are listed here.
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {gigs.length} live gigs across {categoryLabels.length} categories
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {categoryLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveCategory(label)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    activeCategory === label
                      ? 'border border-purple-300 bg-purple-50 text-purple-800'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:text-purple-700'
                  }`}
                >
                  {getCategoryIcon(label)} {label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-6">
              {orderedCategoryLabels.map((label) => {
                const categoryGigs = gigsByCategory[label] || []
                return (
                  <div
                    key={label}
                    className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(label)}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{label}</p>
                          <p className="text-xs text-slate-500">Gigs curated for this service</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {categoryGigs.length} gig{categoryGigs.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {categoryGigs.length === 0 && (
                        <p className="text-sm text-slate-500">
                          No gigs yet in this category. Check back soon.
                        </p>
                      )}
                      {categoryGigs.map((gig, index) => (
                        <GigCard
                          key={gig.id}
                          gig={gig}
                          index={index}
                          formatter={formatter}
                          onOpenSellerProfile={handleOpenSellerProfile}
                          onOpenChat={handleOpenChatFromGig}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {view === 'privacy' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Privacy Policy
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">How GigLah! handles data</h2>
                <p className="text-sm text-slate-600">
                  This Privacy Policy is guided by Singapore&apos;s Personal Data Protection Act (PDPA).
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {privacyPoints.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
              For PDPA access, correction, withdrawal, complaints, or DPO enquiries, email{' '}
              <a
                href="mailto:support@giglah.com"
                className="font-semibold text-purple-700 underline-offset-2 hover:underline"
              >
                support@giglah.com
              </a>
              .
            </div>
          </section>
        )}

        {view === 'terms' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Terms of Use
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">Please read before using GigLah!</h2>
                <p className="text-sm text-slate-600">
                  We operate solely as a listing marketplace for freelance gigs and adhere to the laws of Singapore.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {termsPoints.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
              By using GigLah!, you acknowledge GigLah! bears no responsibility for buyer-seller dealings,
              payments, refunds, or outcomes. If you disagree with these Terms, stop using the platform immediately.
            </div>
          </section>
        )}

        <footer className="mt-10 w-full border-t border-slate-200 bg-white">
          <div className="mx-auto flex w-full flex-col gap-3 px-5 py-5 text-[11px] text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:text-xs">
            <p className="text-[11px] text-slate-700 sm:text-xs">
              Contact us at{" "}
              <a href="mailto:support@giglah.com" className="text-sky-700 underline-offset-2 hover:underline">
                support@giglah.com
              </a>
              .
            </p>
            <div className="flex flex-wrap items-center gap-2 text-slate-600 sm:text-xs">
              <span className="font-medium text-slate-800">
                Copyright © {currentYear} GigLah! All rights reserved.
              </span>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                className="text-slate-700 underline-offset-2 hover:underline"
                onClick={() => setView('privacy')}
              >
                Privacy Policy
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                className="text-slate-700 underline-offset-2 hover:underline"
                onClick={() => setView('terms')}
              >
                Terms of Use
              </button>
            </div>
          </div>
        </footer>

      </div>

      {view === 'login' && (
        <LoginModal
          forms={forms}
          modalInputClasses={modalInputClasses}
          onChange={handleFormChange}
          onSubmit={handleLogin}
          isAuthLoading={isAuthLoading}
          formError={formErrors.login}
          onOpenSignup={openSignupModal}
          onClose={dismissModals}
          showPassword={showLoginPassword}
          onTogglePassword={() => setShowLoginPassword((prev) => !prev)}
          onForgotPassword={handleForgotPassword}
        />
      )}
      {view === 'signup' && (
        <SignupModal
          forms={forms}
          modalInputClasses={modalInputClasses}
          onChange={handleFormChange}
          onSubmit={handleSignup}
          isAuthLoading={isAuthLoading}
          formError={formErrors.signup}
          onOpenLogin={openLoginModal}
          onClose={dismissModals}
          showPassword={showSignupPassword}
          onTogglePassword={() => setShowSignupPassword((prev) => !prev)}
        />
      )}
    </div>
  )
}

export default App
