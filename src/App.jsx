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
import SellerApplicationView from '@/frontend/views/SellerApplicationView'
import SellerProfileView from '@/frontend/views/SellerProfileView'
import SellerGigCreateView from '@/frontend/views/SellerGigCreateView'
import UserProfileView from '@/frontend/views/UserProfileView'
import GigDetailView from '@/frontend/views/GigDetailView'
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
  const [totalGigs, setTotalGigs] = useState(0)
  const [gigMedia, setGigMedia] = useState([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [newGig, setNewGig] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    packages: [],
  })
  const [gigErrors, setGigErrors] = useState({
    title: '',
    category: '',
    price: '',
    packages: '',
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
  const [selectedGigId, setSelectedGigId] = useState('')
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
  const [gigFilters, setGigFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    page: 1,
    pageSize: 12,
  })
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

  const selectedGig = useMemo(
    () => gigs.find((gig) => gig.id === selectedGigId) || null,
    [gigs, selectedGigId],
  )

  const sellerPortfolio = useMemo(
    () => gigs.filter((gig) => gig.sellerId === selectedSellerId),
    [gigs, selectedSellerId],
  )

  const sellerReviewList = useMemo(
    () => sellerReviews[selectedSellerId] || [],
    [sellerReviews, selectedSellerId],
  )

  const relatedGigs = useMemo(() => {
    if (!selectedGig) return []
    const category = (selectedGig.category || '').toLowerCase()
    return gigs
      .filter(
        (gig) =>
          gig.id !== selectedGig.id &&
          (gig.category || '').toLowerCase() === category,
      )
      .slice(0, 4)
  }, [gigs, selectedGig])

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

  const totalGigPages = useMemo(() => {
    const size = Number(gigFilters.pageSize) || 1
    return Math.max(1, Math.ceil((totalGigs || 0) / size))
  }, [gigFilters.pageSize, totalGigs])

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

  const myProfile = useMemo(() => {
    if (!user) return null
    const sellerProfile = sellerProfiles.find((profile) => profile.id === userSellerId) || null
    return {
      ...sellerProfile,
      name: user.name || sellerProfile?.name || 'Member',
      email: user.email || '',
      headline: sellerProfile?.headline || '',
      about: sellerProfile?.about || '',
      avatar: sellerProfile?.avatar || defaultAvatar,
      location: sellerProfile?.location || '',
      languages: sellerProfile?.languages || [],
      stats: sellerProfile?.stats || { projects: userGigCount, response: '—', repeat: '—' },
    }
  }, [sellerProfiles, user, userGigCount, userSellerId])

  const myReviewList = useMemo(
    () => (userSellerId ? sellerReviews[userSellerId] || [] : []),
    [sellerReviews, userSellerId],
  )

  const myRatingSummary = useMemo(() => {
    if (!myReviewList.length) return { average: 0, count: 0 }
    const total = myReviewList.reduce((sum, review) => sum + (Number(review.rating) || 0), 0)
    const average = Number((total / myReviewList.length).toFixed(1))
    return { average, count: myReviewList.length }
  }, [myReviewList])

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
    const loadProfiles = async () => {
      try {
        const profileData = await fetchJSON('/api/profiles')
        const normalizedProfiles = (profileData?.profiles || []).map(normalizeProfile)
        setSellerProfiles(normalizedProfiles)
        const fallbackSellerId = normalizedProfiles[0]?.id || ''
        setSelectedSellerId((prev) => prev || fallbackSellerId)
      } catch (error) {
        console.error('Failed to load profiles', error)
        setDataError('Unable to load marketplace data from the API.')
        setMessage('Unable to load marketplace data from the API.')
      }
    }
    loadProfiles()
  }, [])

  useEffect(() => {
    const loadGigs = async () => {
      setIsLoadingData(true)
      setDataError('')
      try {
        const params = new URLSearchParams()
        if (gigFilters.search) params.set('search', gigFilters.search)
        if (gigFilters.category) params.set('category', gigFilters.category)
        if (gigFilters.minPrice) params.set('minPrice', gigFilters.minPrice)
        if (gigFilters.maxPrice) params.set('maxPrice', gigFilters.maxPrice)
        if (gigFilters.sort) params.set('sort', gigFilters.sort)
        params.set('page', gigFilters.page)
        params.set('pageSize', gigFilters.pageSize)
        const gigData = await fetchJSON(`/api/gigs?${params.toString()}`)
        const normalizedGigs = (gigData?.gigs || []).map(normalizeGig)
        setGigs(normalizedGigs)
        setTotalGigs(gigData?.total || normalizedGigs.length)
        if (!selectedSellerId && normalizedGigs[0]?.sellerId) {
          setSelectedSellerId(normalizedGigs[0].sellerId)
        }
      } catch (error) {
        console.error('Failed to load gigs', error)
        setDataError('Unable to load marketplace data from the API.')
        setMessage('Unable to load marketplace data from the API.')
      } finally {
        setIsLoadingData(false)
      }
    }
    loadGigs()
  }, [gigFilters])

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

  const handleOpenGigDetail = (gig) => {
    if (!gig) return
    setSelectedGigId(gig.id)
    if (gig.sellerId) {
      ensureSellerProfile(gig.sellerId, gig.seller)
      setSelectedSellerId(gig.sellerId)
    }
    setView('gig-detail')
  }

  const handleOpenMyProfile = () => {
    if (!user) return
    const sellerId = userSellerId || buildSellerId(user.email || user.name || '')
    ensureSellerProfile(sellerId, user.name || 'Member')
    setSelectedSellerId(sellerId)
    setView('user-profile')
  }

  const handleViewPublicSellerProfile = () => {
    if (!user) return
    const sellerId = userSellerId || buildSellerId(user.email || user.name || '')
    ensureSellerProfile(sellerId, user.name || 'Member')
    setSelectedSellerId(sellerId)
    setView('seller-profile')
  }

  const handleCategorySelect = (label) => {
    setActiveCategory(label)
    setGigFilters((prev) => ({ ...prev, category: label, page: 1 }))
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

  const handleGigFilterChange = (field, value) => {
    setGigFilters((prev) => ({ ...prev, [field]: value, page: field === 'page' ? value : 1 }))
  }

  const handleClearGigFilters = () => {
    setGigFilters((prev) => ({
      ...prev,
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      page: 1,
    }))
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
    setGigErrors((prev) => ({ ...prev, [field]: '' }))
    setNewGig((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddPackage = () => {
    setGigErrors((prev) => ({ ...prev, packages: '' }))
    setNewGig((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        { id: `pkg-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: '', description: '', price: '' },
      ],
    }))
  }

  const handlePackageChange = (index, field, value) => {
    setGigErrors((prev) => ({ ...prev, packages: '' }))
    setNewGig((prev) => {
      const packages = [...prev.packages]
      packages[index] = { ...packages[index], [field]: value }
      return { ...prev, packages }
    })
  }

  const handleRemovePackage = (index) => {
    setGigErrors((prev) => ({ ...prev, packages: '' }))
    setNewGig((prev) => {
      const packages = prev.packages.filter((_, pkgIndex) => pkgIndex !== index)
      return { ...prev, packages }
    })
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
    const { title, category, price, description, packages } = newGig
    setGigErrors({ title: '', category: '', price: '', packages: '' })
    const normalizedPackages = (packages || [])
      .map((pkg) => ({
        name: (pkg.name || '').trim(),
        description: (pkg.description || '').trim(),
        price: pkg.price === '' ? '' : Number(pkg.price),
      }))
      .filter((pkg) => pkg.name || pkg.description || Number.isFinite(pkg.price))
    const packagePrices = normalizedPackages.map((pkg) => (Number.isFinite(pkg.price) ? pkg.price : 0))
    const hasPackagePrice = packagePrices.some((value) => Number.isFinite(value) && value > 0)

    const errors = { title: '', category: '', price: '', packages: '' }
    if (!title || !category) {
      errors.title = !title ? 'Enter a gig title.' : ''
      errors.category = !category ? 'Pick a category.' : ''
    }
    if (!price && !hasPackagePrice) {
      errors.price = 'Add a base price or set package pricing.'
      errors.packages = 'Add at least one package price if base price is empty.'
    }
    if (Object.values(errors).some(Boolean)) {
      setGigErrors(errors)
      setMessage('Fix the highlighted fields before submitting your gig.')
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
      const priceNumber = price ? Number(price) : 0
      const lowestPackagePrice =
        hasPackagePrice && packagePrices.length
          ? Math.min(...packagePrices.filter((value) => Number.isFinite(value) && value > 0))
          : 0
      const payload = {
        title: title.trim(),
        category: category.trim(),
        price: priceNumber > 0 ? priceNumber : lowestPackagePrice,
        status: 'Published',
        description: description.trim() || 'Awaiting description.',
        ...(ownerId ? { owner: ownerId } : {}),
        media: mediaPayload,
        imageUrl: primaryImage,
        packages: normalizedPackages,
      }
      const data = await authedFetch('/api/gigs', {
        method: 'POST',
        body: payload,
      })
      if (data?.gig) {
        const normalized = normalizeGig(data.gig)
        setGigs((prev) => [normalized, ...prev])
        ensureSellerProfile(normalized.sellerId, normalized.seller)
        setSelectedGigId(normalized.id)
        if (normalized.sellerId) setSelectedSellerId(normalized.sellerId)
        setView('gig-detail')
      }
      setNewGig({
        title: '',
        category: '',
        price: '',
        description: '',
        packages: [],
      })
      setGigErrors({ title: '', category: '', price: '', packages: '' })
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
        onProfile={handleOpenMyProfile}
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
            totalGigs={totalGigs}
            gigFilters={gigFilters}
            totalPages={totalGigPages}
            formatter={formatter}
            onOpenSellerProfile={handleOpenSellerProfile}
            onOpenChat={handleOpenChatFromGig}
            onOpenGig={handleOpenGigDetail}
            onGigFilterChange={handleGigFilterChange}
            onClearGigFilters={handleClearGigFilters}
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

        {view === 'gig-detail' && (
          <GigDetailView
            gig={selectedGig}
            seller={selectedSeller}
            sellerRatingSummary={sellerRatingSummary}
            sellerReviewList={sellerReviewList}
            formatter={formatter}
            onBackToDashboard={() => setView('dashboard')}
            onOpenSellerProfile={handleOpenSellerProfile}
            onOpenChat={handleOpenChatFromGig}
            onOpenRelatedGig={handleOpenGigDetail}
            relatedGigs={relatedGigs}
          />
        )}

        {view === 'seller-profile' && (
          <SellerProfileView
            selectedSeller={selectedSeller}
            sellerRatingSummary={sellerRatingSummary}
            sellerReviewList={sellerReviewList}
            reviewDraft={reviewDraft}
            sellerPortfolio={sellerPortfolio}
            formatter={formatter}
            timeAgo={timeAgo}
            user={user}
            onBackToDashboard={() => setView('dashboard')}
            onSubmitReview={handleSubmitReview}
            onReviewDraftChange={handleReviewDraftChange}
            onOpenChatFromGig={handleOpenChatFromGig}
            onOpenGigFromProfile={handleOpenGigDetail}
          />
        )}

        {view === 'user-profile' && (
          <UserProfileView
            user={user}
            profile={myProfile}
            myGigs={myGigs}
            reviewList={myReviewList}
            ratingSummary={myRatingSummary}
            formatter={formatter}
            timeAgo={timeAgo}
            onBackToDashboard={() => setView('dashboard')}
            onViewPublicProfile={handleViewPublicSellerProfile}
            onOpenSellerTools={() => setView('seller')}
            onOpenChatFromGig={handleOpenChatFromGig}
          />
        )}


        {view === 'seller' && (
          <SellerGigCreateView
            user={user}
            userGigCount={userGigCount}
            userSellerId={userSellerId}
            inputClasses={inputClasses}
            categoryOptions={categoryLabels}
            newGig={newGig}
            gigErrors={gigErrors}
            gigMedia={gigMedia}
            isUploadingMedia={isUploadingMedia}
            myGigs={myGigs}
            formatter={formatter}
            onOpenSellerProfile={handleOpenSellerProfile}
            onOpenLogin={openLoginModal}
            onOpenSignup={openSignupModal}
            onStartApplication={startSellerApplication}
            onGigChange={handleGigChange}
            onAddPackage={handleAddPackage}
            onPackageChange={handlePackageChange}
            onRemovePackage={handleRemovePackage}
            onGigFiles={handleGigFiles}
            onRemoveGigMedia={handleRemoveGigMedia}
            onCreateGig={handleCreateGig}
          />
        )}

        {view === 'seller-apply' && (
          <SellerApplicationView
            user={user}
            sellerForm={sellerForm}
            sellerError={sellerError}
            sellerInputClasses={sellerInputClasses}
            languageOptions={languageOptions}
            competencyLevels={competencyLevels}
            onCancel={cancelSellerApplication}
            onSellerFormChange={handleSellerFormChange}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            onAddLanguage={handleAddLanguage}
            onRemoveLanguage={handleRemoveLanguage}
            onSubmit={handleSellerUpgrade}
            onClearProfilePicture={() =>
              setSellerForm((prev) => ({
                ...prev,
                profilePicture: null,
              }))
            }
          />
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
                          onOpenGig={handleOpenGigDetail}
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
