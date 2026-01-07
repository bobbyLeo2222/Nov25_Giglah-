import { useCallback, useEffect, useMemo, useState } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
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
import UserProfileView from '@/frontend/views/UserProfileView'
import GigDetailView from '@/frontend/views/GigDetailView'
import SellerAnalyticsView from '@/frontend/views/SellerAnalyticsView'
import SellerDashboardView from '@/frontend/views/SellerDashboardView'
import {
  buildSellerId,
  defaultAvatar,
  defaultHeroImage,
  formatFileSize,
  mapUserFromApi,
  normalizeGig,
  normalizeMessage,
  normalizeProfile,
  normalizeReview,
  timeAgo,
} from '@/frontend/helpers'
import {
  fetchJSON,
  getStoredRefreshToken,
  getStoredToken,
  refreshAccessToken,
  setStoredRefreshToken,
  setStoredToken,
} from '@/lib/api'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [verifyForm, setVerifyForm] = useState({ email: '', token: '' })
  const [resetForm, setResetForm] = useState({ email: '', token: '', password: '' })
  const [isVerifySubmitting, setIsVerifySubmitting] = useState(false)
  const [isResetSubmitting, setIsResetSubmitting] = useState(false)
  const [sellerForm, setSellerForm] = useState(initialSellerForm)
  const [sellerError, setSellerError] = useState('')
  const [sellerProfiles, setSellerProfiles] = useState([])
  const [sellerReviews, setSellerReviews] = useState({})
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [selectedGigId, setSelectedGigId] = useState('')
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, text: '', project: '' })
  const [currentServiceSlide, setCurrentServiceSlide] = useState(0)
  const [chatThreads, setChatThreads] = useState([])
  const [, setUnreadTotal] = useState(0)
  const [selectedThreadId, setSelectedThreadId] = useState('')
  const [composerText, setComposerText] = useState('')
  const [composerFiles, setComposerFiles] = useState([])
  const [chatSearch, setChatSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showLoadingBanner, setShowLoadingBanner] = useState(false)
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
  const [favoriteGigIds, setFavoriteGigIds] = useState([])
  const [favoriteSellerIds, setFavoriteSellerIds] = useState([])
  const [inquiryDraft, setInquiryDraft] = useState({
    message: '',
  })
  const [buyerBrief, setBuyerBrief] = useState({
    projectType: '',
    category: '',
    budget: '',
    timeline: '',
    goals: '',
    notes: '',
  })
  const [buyerBriefs, setBuyerBriefs] = useState([])
  const [buyerOrders, setBuyerOrders] = useState([])
  const [sellerOrders, setSellerOrders] = useState([])
  const [sellerAnalytics, setSellerAnalytics] = useState(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')
  const [analyticsRangeDays, setAnalyticsRangeDays] = useState(30)
  const [analyticsSlaHours, setAnalyticsSlaHours] = useState(24)
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0)
  const [hasSyncedSellerProfile, setHasSyncedSellerProfile] = useState(false)
  const authedFetch = (path, options = {}) => fetchJSON(path, { ...options, token: authToken })
  const persistAuth = (token, apiUser, refreshToken) => {
    setAuthToken(token || '')
    setStoredToken(token || '')
    if (refreshToken !== undefined) {
      setStoredRefreshToken(refreshToken || '')
    }
    setUser(mapUserFromApi(apiUser))
  }
  const clearAuth = () => {
    setAuthToken('')
    setStoredToken('')
    setStoredRefreshToken('')
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

  const userSellerId = useMemo(
    () => (user ? buildSellerId(user.email || user.name || '') : ''),
    [user],
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

  const selectedSellerIsOwner = useMemo(() => {
    if (!user || !selectedSeller) return false
    const userId = user._id || user.id
    if (selectedSeller.userId && selectedSeller.userId === userId) return true
    return Boolean(user.isSeller && selectedSellerId && selectedSellerId === userSellerId)
  }, [selectedSeller, selectedSellerId, user, userSellerId])

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

  const syncViewFromPath = useCallback(() => {
    const gigMatch = matchPath('/gig/:gigId', location.pathname)
    if (gigMatch?.params?.gigId) {
      setSelectedGigId(gigMatch.params.gigId)
      setView('gig-detail')
      return
    }

    if (location.pathname === '/seller-tools') {
      setView(user?.isSeller ? 'seller-dashboard' : 'seller-apply')
      return
    }
    if (location.pathname === '/seller/apply') {
      setView('seller-apply')
      return
    }

    const sellerMatch = matchPath('/seller/:sellerId', location.pathname)
    if (sellerMatch?.params?.sellerId) {
      setSelectedSellerId(sellerMatch.params.sellerId)
      setView('seller-profile')
      return
    }

    const chatMatch = matchPath('/chats/:threadId', location.pathname)
    if (chatMatch?.params?.threadId) {
      setSelectedThreadId(chatMatch.params.threadId)
      setView('chat')
      return
    }

    if (location.pathname === '/chats') {
      setSelectedThreadId('')
      setView('chat')
      return
    }
    if (location.pathname === '/categories') {
      setView('categories')
      return
    }
    if (location.pathname === '/privacy') {
      setView('privacy')
      return
    }
    if (location.pathname === '/terms') {
      setView('terms')
      return
    }
    if (location.pathname === '/me') {
      setView('user-profile')
      return
    }
    if (location.pathname === '/verify-email') {
      setView('verify-email')
      return
    }
    if (location.pathname === '/reset-password') {
      setView('reset-password')
      return
    }
    setView('dashboard')
  }, [location.pathname, navigate, user?.isSeller])

  useEffect(() => {
    syncViewFromPath()
  }, [syncViewFromPath])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const email = params.get('email') || ''
    const token = params.get('token') || ''
    if (location.pathname === '/verify-email') {
      setVerifyForm((prev) => ({ ...prev, email, token }))
    }
    if (location.pathname === '/reset-password') {
      setResetForm((prev) => ({ ...prev, email, token }))
    }
  }, [location.pathname, location.search])

  const profileOrders = useMemo(() => {
    if (!user) return []
    return user.isSeller ? sellerOrders : buyerOrders
  }, [buyerOrders, sellerOrders, user])

  const myRatingSummary = useMemo(() => {
    if (!myReviewList.length) return { average: 0, count: 0 }
    const total = myReviewList.reduce((sum, review) => sum + (Number(review.rating) || 0), 0)
    const average = Number((total / myReviewList.length).toFixed(1))
    return { average, count: myReviewList.length }
  }, [myReviewList])

  const savedGigs = useMemo(() => {
    if (!favoriteGigIds.length) return []
    const favoriteSet = new Set(favoriteGigIds)
    return gigs.filter((gig) => favoriteSet.has(gig.id))
  }, [favoriteGigIds, gigs])

  const savedSellers = useMemo(() => {
    if (!favoriteSellerIds.length) return []
    const favoriteSet = new Set(favoriteSellerIds)
    return sellerProfiles.filter((profile) => favoriteSet.has(profile.id))
  }, [favoriteSellerIds, sellerProfiles])

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

  const categoryOptions = useMemo(
    () => serviceCategories.flatMap((group) => group.items.map((item) => item.label)),
    [],
  )

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
        if (cancelled) return
        refreshAccessToken()
          .then((newToken) => {
            setAuthToken(newToken)
          })
          .catch(() => {
            clearAuth()
          })
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authToken])

  useEffect(() => {
    if (!authToken || !user) {
      setFavoriteGigIds([])
      setFavoriteSellerIds([])
      return
    }
    let cancelled = false
    authedFetch('/api/favorites')
      .then((data) => {
        if (cancelled) return
        setFavoriteGigIds(data?.gigIds || [])
        setFavoriteSellerIds(data?.sellerIds || [])
      })
      .catch((error) => {
        console.error('Failed to load favorites', error)
      })
    return () => {
      cancelled = true
    }
  }, [authToken, user])

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
    if (!isLoadingData) {
      setShowLoadingBanner(false)
      return
    }
    const id = setTimeout(() => setShowLoadingBanner(true), 250)
    return () => clearTimeout(id)
  }, [isLoadingData])

  useEffect(() => {
    if (!authToken || !user) {
      setBuyerOrders([])
      setSellerOrders([])
      return
    }
    let cancelled = false
    Promise.all([
      authedFetch('/api/orders?role=buyer'),
      authedFetch('/api/orders?role=seller'),
    ])
      .then(([buyerData, sellerData]) => {
        if (cancelled) return
        setBuyerOrders(buyerData?.orders || [])
        setSellerOrders(sellerData?.orders || [])
      })
      .catch((error) => {
        console.error('Failed to load orders', error)
      })
    return () => {
      cancelled = true
    }
  }, [authToken, user])

  useEffect(() => {
    if (view !== 'seller-analytics' || !authToken || !user) {
      return
    }
    if (!user.isSeller && user.role !== 'admin') {
      setAnalyticsError('Seller access required.')
      return
    }
    let cancelled = false
    setIsAnalyticsLoading(true)
    setAnalyticsError('')
    authedFetch(`/api/analytics/seller?rangeDays=${analyticsRangeDays}&slaHours=${analyticsSlaHours}`)
      .then((data) => {
        if (cancelled) return
        setSellerAnalytics(data)
      })
      .catch((error) => {
        if (cancelled) return
        setAnalyticsError(error.message || 'Unable to load analytics.')
      })
      .finally(() => {
        if (!cancelled) setIsAnalyticsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [analyticsRangeDays, analyticsSlaHours, analyticsRefreshKey, authToken, user, view])

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

  const buildThreadTitleFromGig = (gig) => {
    if (!gig) return 'Conversation'
    const safeTitle = gig.title || 'Conversation'
    return `gig:${gig.id || gig._id || ''}:${safeTitle}`
  }

  const parseThreadTitle = (title = '') => {
    if (title.startsWith('gig:')) {
      const [, gigId = '', ...rest] = title.split(':')
      const gigTitle = rest.join(':') || 'Conversation'
      return { gigId, gigTitle }
    }
    return { gigId: '', gigTitle: title || 'Conversation' }
  }

  const normalizeThread = useCallback(
    (thread) => {
      if (!thread) return null
      const { gigId, gigTitle } = parseThreadTitle(thread.title || '')
      const participants = thread.participants || []
      const participantMap = new Map(
        participants.map((participant) => [
          participant._id?.toString() || participant.id,
          participant,
        ]),
      )
      const sellerId = thread.seller?._id?.toString?.() || thread.seller?.toString?.() || ''
      const buyerId = thread.buyer?._id?.toString?.() || thread.buyer?.toString?.() || ''
      const sellerParticipant =
        participants.find((participant) => {
          const pid = participant._id?.toString() || participant.id
          return pid === sellerId || participant.role === 'seller'
        }) || null
      const buyerParticipant =
        participants.find((participant) => {
          const pid = participant._id?.toString() || participant.id
          return pid === buyerId || participant.role === 'buyer'
        }) || null

      const messages = (thread.messages || []).map((msg, index) => {
        const senderId = msg.sender?._id?.toString() || msg.sender?.toString() || ''
        const sender = senderId ? participantMap.get(senderId) : null
        const senderRole =
          senderId && senderId === sellerId
            ? 'seller'
            : senderId && senderId === buyerId
              ? 'buyer'
              : sender?.role === 'seller'
                ? 'seller'
                : 'buyer'
        const senderName =
          sender?.name ||
          (senderRole === 'seller'
            ? thread.sellerName || sellerParticipant?.name || 'Seller'
            : thread.buyerName || buyerParticipant?.name || 'Buyer')
        const normalized = normalizeMessage({
          ...msg,
          senderName,
          senderRole,
        })
        return {
          ...normalized,
          id: normalized.id || `msg-${index}-${Date.now()}`,
          senderRole,
          senderId: normalized.senderId || senderId || undefined,
          senderName,
          attachments: normalized.attachments.map((file) => ({
            ...file,
            previewUrl: file.previewUrl || file.url || '',
          })),
        }
      })

      return {
        id: thread._id || thread.id,
        gigId: thread.gigId || gigId,
        gigTitle: thread.gigTitle || gigTitle || thread.title || 'Conversation',
        sellerUserId: sellerId,
        buyerUserId: buyerId,
        sellerName: thread.sellerName || sellerParticipant?.name || 'Seller',
        buyerName: thread.buyerName || buyerParticipant?.name || 'Buyer',
        buyerEmail: buyerParticipant?.email || '',
        lastUpdatedAt: thread.lastMessageAt
          ? new Date(thread.lastMessageAt).getTime()
          : messages[messages.length - 1]?.sentAt || Date.now(),
        messages,
        unreadCount:
          thread.unreadCount ??
          messages.filter(
            (msg) => !(msg.readBy || []).some((id) => id === (user?._id || user?.id)),
          ).length,
        typingStatuses: (thread.typingStatuses || []).map((entry) => entry.user?.toString?.() || entry.user),
      }
    },
    [user],
  )

  useEffect(() => {
    if (!user || !authToken) {
      setChatThreads([])
      setUnreadTotal(0)
      return
    }
    let cancelled = false
    authedFetch('/api/chats')
      .then((data) => {
        if (cancelled) return
        const normalized = (data?.threads || []).map(normalizeThread).filter(Boolean)
        setChatThreads(normalized)
        const total = normalized.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0)
        setUnreadTotal(total)
      })
      .catch((error) => {
        console.error('Failed to load chats', error)
      })
    return () => {
      cancelled = true
    }
  }, [authToken, normalizeThread, user])

  useEffect(() => {
    if (!user || !authToken || !selectedThreadId) return undefined
    let cancelled = false
    authedFetch(`/api/chats/${selectedThreadId}`)
      .then((data) => {
        if (cancelled || !data?.thread) return
        const normalized = normalizeThread(data.thread)
        if (!normalized) return
        setChatThreads((prev) => {
          const others = prev.filter((thread) => thread.id !== normalized.id)
          const nextThreads = [normalized, ...others]
          const totalUnread = nextThreads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0)
          setUnreadTotal(totalUnread)
          return nextThreads
        })
      })
      .catch((error) => {
        console.error('Failed to load thread', error)
      })
    return () => {
      cancelled = true
    }
  }, [authToken, normalizeThread, selectedThreadId, user])

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
    navigate(`/seller/${sellerId}`)
  }

  const trackGigView = (gig) => {
    if (!gig?.id) return
    fetchJSON('/api/analytics/views', {
      method: 'POST',
      body: { gigId: gig.id },
    }).catch(() => {})
  }

  const handleOpenGigDetail = (gig) => {
    if (!gig) return
    setSelectedGigId(gig.id)
    if (gig.sellerId) {
      ensureSellerProfile(gig.sellerId, gig.seller)
      setSelectedSellerId(gig.sellerId)
    }
    navigate(`/gig/${gig.id}`)
    trackGigView(gig)
  }

  const handleOpenMyProfile = () => {
    if (!user) return
    const sellerId = userSellerId || buildSellerId(user.email || user.name || '')
    ensureSellerProfile(sellerId, user.name || 'Member')
    setSelectedSellerId(sellerId)
    setView('user-profile')
    navigate('/me')
  }

  const handleOpenSellerDashboard = () => {
    if (!user) return
    setView('seller-analytics')
  }

  const handleViewPublicSellerProfile = () => {
    if (!user) return
    const sellerId = userSellerId || buildSellerId(user.email || user.name || '')
    ensureSellerProfile(sellerId, user.name || 'Member')
    setSelectedSellerId(sellerId)
    navigate(`/seller/${sellerId}`)
  }

  const handleRefreshMySellerProfile = async () => {
    if (!user || !authToken) return null
    try {
      const data = await authedFetch('/api/profiles/me')
      if (data?.profile) {
        const normalized = normalizeProfile(data.profile)
        setSellerProfiles((prev) => {
          const filtered = prev.filter((profile) => profile.id !== normalized.id && profile._id !== normalized.id)
          return [...filtered, normalized]
        })
        return normalized
      }
    } catch (error) {
      setMessage(error.message || 'Unable to load seller profile.')
    }
    return null
  }

  useEffect(() => {
    if (user?.isSeller && authToken && !hasSyncedSellerProfile) {
      handleRefreshMySellerProfile().finally(() => setHasSyncedSellerProfile(true))
    }
    // We intentionally omit handleRefreshMySellerProfile from deps to avoid re-sync loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, hasSyncedSellerProfile, user?.isSeller])

  const handleUpdateSellerProfile = async (updates) => {
    if (!user || !authToken) {
      setMessage('Please sign in to update your seller profile.')
      return
    }
    try {
      setMessage('Saving your seller profile...')
      const data = await authedFetch('/api/profiles/me', {
        method: 'PUT',
        body: updates,
      })
      const updatedProfile = data?.profile
      if (updatedProfile) {
        const normalized = normalizeProfile(updatedProfile)
        setSellerProfiles((prev) => {
          const filtered = prev.filter(
            (profile) => profile.id !== normalized.id && profile._id !== normalized.id,
          )
          return [...filtered, normalized]
        })
      }
      if (updates.displayName) {
        setUser((prev) => (prev ? { ...prev, name: updates.displayName } : prev))
      }
      setMessage('Seller profile updated.')
    } catch (error) {
      setMessage(error.message || 'Unable to update seller profile.')
      throw error
    }
  }

  const handleCategorySelect = (label) => {
    setActiveCategory(label)
    setGigFilters((prev) => ({ ...prev, category: label, page: 1 }))
    navigate('/categories')
  }

  const goToDashboard = useCallback(() => navigate('/'), [navigate])
  const goToSellerTools = useCallback(() => navigate('/seller-tools'), [navigate])
  const goToChats = useCallback(() => navigate('/chats'), [navigate])


  const handleOpenChatFromOrder = (order) => {
    if (!order) return
    const matchingGig = gigs.find((gig) => gig.id === order.gigId)
    const fallbackGig = {
      id: order.gigId,
      title: order.gigTitle,
      sellerId: order.sellerId || '',
      seller: user?.name || 'Seller',
    }
    handleOpenChatFromGig(matchingGig || fallbackGig)
  }

  const handleOpenProfile = () => {
    if (!user) return
    handleOpenMyProfile()
  }

  const handleOpenSellerTools = () => {
    if (!user) {
      setMessage('Log in first.')
      return
    }
    if (user.isSeller) {
      navigate('/seller-tools')
      return
    }
    startSellerApplication()
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
    navigate(threadId ? `/chats/${threadId}` : '/chats')
    if (threadId && user && authToken) {
      authedFetch(`/api/chats/${threadId}/read`, { method: 'POST' }).catch(() => {})
      setChatThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId ? { ...thread, unreadCount: 0 } : thread,
        ),
      )
      setUnreadTotal((prev) => {
        const target = chatThreads.find((t) => t.id === threadId)
        return prev - (target?.unreadCount || 0)
      })
    }
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

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result || '')
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })

  const handleComposerFiles = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    try {
      const mapped = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await readFileAsDataUrl(file)
          return {
            id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size || 0,
            sizeLabel: formatFileSize(file.size || 0),
            previewUrl: dataUrl,
          }
        }),
      )
      setComposerFiles((prev) => [...prev, ...mapped])
    } catch (error) {
      console.error('Failed to read attachment', error)
      setMessage('Unable to preview attachment.')
    } finally {
      event.target.value = ''
    }
  }

  const handleRemoveComposerFile = (fileId) => {
    setComposerFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleUpdateOrderStatus = async (orderId, status, cancelReason = '') => {
    if (!orderId || !status) return
    if (!user || !authToken) {
      setMessage('Log in to manage orders.')
      return
    }
    try {
      const data = await authedFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: { status, cancelReason },
      })
      if (data?.order) {
        setBuyerOrders((prev) =>
          prev.map((order) =>
            order._id === orderId || order.id === orderId ? data.order : order,
          ),
        )
        setSellerOrders((prev) =>
          prev.map((order) =>
            order._id === orderId || order.id === orderId ? data.order : order,
          ),
        )
        setMessage(
          status === 'cancelled'
            ? 'Order cancelled.'
            : status === 'complete'
              ? 'Completion recorded.'
              : 'Order updated.',
        )
      }
    } catch (error) {
      setMessage(error.message || 'Unable to update order.')
    }
  }

  const handleRequestOrderCancel = (orderId) => {
    const reason = window.prompt('Reason for cancellation:')
    if (!reason || !reason.trim()) {
      setMessage('Cancellation reason is required.')
      return
    }
    handleUpdateOrderStatus(orderId, 'cancelled', reason.trim())
  }

  const handleRequestOrderComplete = (orderId) => {
    handleUpdateOrderStatus(orderId, 'complete')
  }

  const handleRequestOrderAccept = (orderId) => {
    handleUpdateOrderStatus(orderId, 'in_progress')
  }

  const handleToggleFavoriteGig = async (gig) => {
    if (!user || !authToken) {
      setMessage('Log in to save gigs.')
      return
    }
    const isFav = favoriteGigIds.includes(gig.id)
    try {
      const endpoint = isFav ? `/api/favorites/gig/${gig.id}` : '/api/favorites'
      const options = isFav
        ? { method: 'DELETE' }
        : { method: 'POST', body: { type: 'gig', targetId: gig.id } }
      const data = await authedFetch(endpoint, options)
      setFavoriteGigIds(data?.gigIds || [])
      setFavoriteSellerIds(data?.sellerIds || [])
      setMessage(isFav ? 'Removed from saved gigs.' : 'Saved to your gigs.')
    } catch (error) {
      setMessage(error.message || 'Unable to update favorites.')
    }
  }

  const handleToggleFavoriteSeller = async (sellerId) => {
    if (!sellerId) return
    if (!user || !authToken) {
      setMessage('Log in to save sellers.')
      return
    }
    const isFav = favoriteSellerIds.includes(sellerId)
    try {
      const endpoint = isFav ? `/api/favorites/seller/${sellerId}` : '/api/favorites'
      const options = isFav
        ? { method: 'DELETE' }
        : { method: 'POST', body: { type: 'seller', targetId: sellerId } }
      const data = await authedFetch(endpoint, options)
      setFavoriteGigIds(data?.gigIds || [])
      setFavoriteSellerIds(data?.sellerIds || [])
      setMessage(isFav ? 'Removed seller from saved list.' : 'Seller saved.')
    } catch (error) {
      setMessage(error.message || 'Unable to update favorites.')
    }
  }

  const handleInquiryChange = (field) => (event) => {
    setInquiryDraft((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmitInquiry = async (gig) => {
    if (!gig) return
    const { message: inquiryMessage } = inquiryDraft
    if (!inquiryMessage) {
      setMessage('Share a short brief or question before sending.')
      return
    }
    try {
      await fetchJSON('/api/inquiries', {
        method: 'POST',
        body: {
          gigId: gig.id,
          sellerId: gig.sellerId || '',
          message: inquiryMessage,
        },
      })
      setInquiryDraft({ message: '' })
      setMessage('Inquiry sent to the seller.')
    } catch (error) {
      setMessage(error.message || 'Unable to send inquiry right now.')
    }
  }

  const handleCreateOrder = async (gig, { notes } = {}) => {
    if (!gig) return
    if (!user || !authToken) {
      setMessage('Log in to place an order.')
      return
    }
    if (user.isSeller) {
      setMessage('Switch to buyer mode to place an order.')
      return
    }
    try {
      const orderNotes = notes ?? inquiryDraft.message ?? ''
      const data = await authedFetch('/api/orders', {
        method: 'POST',
        body: {
          gigId: gig.id,
          gigTitle: gig.title,
          sellerId: gig.sellerId || gig.owner || '',
          price: gig.price || 0,
          notes: orderNotes,
        },
      })
      if (data?.order) {
        setBuyerOrders((prev) => [data.order, ...prev])
        setMessage('Order created. The seller will be notified.')
      }
    } catch (error) {
      setMessage(error.message || 'Unable to create order right now.')
    }
  }

  const handleStartGigFromChat = async () => {
    if (!selectedThread) return
    if (!user || !authToken) {
      setMessage('Log in to start a gig.')
      return
    }
    if (user.isSeller) {
      setMessage('Switch to buyer mode to start a gig.')
      return
    }
    if (!selectedThread.gigId) {
      setMessage('This chat is not linked to a gig yet.')
      return
    }

    let gig = gigs.find((item) => item.id === selectedThread.gigId) || null
    if (!gig) {
      try {
        const data = await fetchJSON(`/api/gigs/${selectedThread.gigId}`)
        gig = normalizeGig(data?.gig || data)
      } catch (error) {
        setMessage(error.message || 'Unable to load the gig details.')
        return
      }
    }

    if (!gig) {
      setMessage('Unable to locate this gig.')
      return
    }

    const existingOrder = buyerOrders.find(
      (order) => order.gigId === gig.id && order.status !== 'cancelled',
    )
    if (existingOrder) {
      setMessage('An order for this gig is already in progress.')
      return
    }

    await handleCreateOrder(gig, { notes: '' })
  }

  const ensureThreadForGig = async (gig, { forceCreate = false } = {}) => {
    if (!gig) throw new Error('Seller information is missing for this gig.')
    if (!user || !authToken) throw new Error('Log in to message the seller.')

    const sellerParticipantId = gig.sellerUserId || gig.owner || gig.sellerId || ''
    if (!sellerParticipantId) throw new Error('Seller account is missing for this gig.')

    const buyerId = user._id || user.id
    const existingThread = !forceCreate
      ? chatThreads.find((thread) => thread.gigId === gig.id)
      : null
    if (existingThread) return existingThread

    const threadTitle = buildThreadTitleFromGig(gig)
    const participantIds = [buyerId, sellerParticipantId].filter(Boolean)
    const created = await authedFetch('/api/chats', {
      method: 'POST',
      body: {
        participantIds,
        title: threadTitle,
        gigId: gig.id,
        gigTitle: gig.title,
        sellerId: sellerParticipantId,
        buyerId,
        sellerName: gig.seller || 'Seller',
        buyerName: user.name || 'Buyer',
      },
    })

    const threadId = created?.thread?._id || created?.thread?.id
    let normalized = null
    if (threadId) {
      const fetched = await authedFetch(`/api/chats/${threadId}`)
      normalized = normalizeThread(fetched?.thread || created.thread)
    } else if (created?.thread) {
      normalized = normalizeThread(created.thread)
    }

    if (!normalized) throw new Error('Unable to open chat.')

    setChatThreads((prev) => [
      normalized,
      ...prev.filter((thread) => thread.id !== normalized.id),
    ])

    return normalized
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    if (!selectedThread) {
      setMessage('Pick a conversation first.')
      return
    }
    if (!user || !authToken) {
      setMessage('Log in to send messages.')
      openLoginModal()
      return
    }
    const text = composerText.trim()
    if (!text && composerFiles.length === 0) {
      setMessage('Type a message or attach a file first.')
      return
    }

    const payload = {
      text,
      files: composerFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size || 0,
        url: file.previewUrl || '',
      })),
      gigId: selectedThread.gigId || selectedGig?.id || '',
      gigTitle: selectedThread.gigTitle || selectedGig?.title || '',
      sellerId:
        selectedThread.sellerUserId ||
        selectedGig?.sellerUserId ||
        selectedGig?.owner ||
        selectedGig?.sellerId ||
        '',
      buyerId: user._id || user.id,
      sellerName: selectedThread.sellerName || selectedGig?.seller || 'Seller',
      buyerName: user.name || 'Buyer',
      participantIds: [
        selectedThread.sellerUserId ||
          selectedGig?.sellerUserId ||
          selectedGig?.owner ||
          selectedGig?.sellerId ||
          '',
      ].filter(Boolean),
    }

    const postMessage = (threadId) =>
      authedFetch(`/api/chats/${threadId}/messages`, {
        method: 'POST',
        body: payload,
      })

    const appendMessageToThread = (threadId, data) => {
      const now = Date.now()
      const newMessage = data?.message
        ? {
            id: data.message._id || data.message.id || `msg-${now}`,
            senderRole: user?.isSeller ? 'seller' : 'buyer',
            senderId:
              data.message.sender?._id?.toString?.() ||
              data.message.sender?.toString?.() ||
              user?._id ||
              user?.id,
            senderName: user?.name || 'Member',
            text: data.message.text || text,
            sentAt: data.message.createdAt ? new Date(data.message.createdAt).getTime() : now,
            attachments: (data.message.files || []).map((file, index) => ({
              id: `${data.message._id || data.message.id || 'file'}-${index}`,
              name: file.name || 'Attachment',
              type: file.type || 'file',
              sizeLabel: formatFileSize(file.size || 0),
              previewUrl: file.url || '',
              url: file.url || '',
            })),
          }
        : {
            id: `msg-${now}`,
            senderRole: user?.isSeller ? 'seller' : 'buyer',
            senderId: user?._id || user?.id,
            senderName: user?.name || 'Member',
            text,
            sentAt: now,
            attachments: composerFiles.map((file) => ({
              id: file.id,
              name: file.name,
              type: file.type,
              sizeLabel: file.sizeLabel,
              previewUrl: file.previewUrl,
              url: file.previewUrl,
            })),
          }

      setChatThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? { ...thread, lastUpdatedAt: newMessage.sentAt, messages: [...thread.messages, newMessage] }
            : thread,
        ),
      )
      setUnreadTotal((prev) => prev)
      setComposerText('')
      setComposerFiles([])
      setMessage('Message sent.')
    }

    try {
      const data = await postMessage(selectedThread.id)
      appendMessageToThread(selectedThread.id, data)
    } catch (error) {
      const message = error.message || 'Unable to send message.'
      if (/Thread not found/i.test(message)) {
        try {
          const gigContext =
            selectedGig ||
            (selectedThread?.gigId
              ? {
                  id: selectedThread.gigId,
                  title: selectedThread.gigTitle,
                  seller: selectedThread.sellerName,
                  sellerId: selectedThread.sellerUserId,
                  sellerUserId: selectedThread.sellerUserId,
                  owner: selectedThread.sellerUserId,
                }
              : null)

          if (gigContext) {
            const ensuredThread = await ensureThreadForGig(gigContext, { forceCreate: true })
            setSelectedThreadId(ensuredThread.id)
            navigate(`/chats/${ensuredThread.id}`)
            const retryData = await postMessage(ensuredThread.id)
            appendMessageToThread(ensuredThread.id, retryData)
            return
          }
        } catch (recreateError) {
          setMessage(recreateError.message || message)
          return
        }

        setSelectedThreadId('')
        setSelectedGigId('')
      }
      setMessage(message)
    }
  }

  const handleViewGigFromChat = () => {
    if (!selectedThread?.gigId) return
    const gig =
      gigs.find((entry) => entry.id === selectedThread.gigId) || {
        id: selectedThread.gigId,
        title: selectedThread.gigTitle,
        sellerId: selectedThread.sellerUserId,
        seller: selectedThread.sellerName,
      }
    handleOpenGigDetail(gig)
  }

  const handleOpenChatFromGig = async (gig) => {
    if (!gig) return
    const userId = user?._id || user?.id
    const isOwner =
      user?.isSeller &&
      ((gig.owner && userId && gig.owner === userId) ||
        (gig.sellerId && userSellerId && gig.sellerId === userSellerId))
    if (isOwner) {
      setMessage('You cannot message yourself from your own gig.')
      return
    }
    if (gig.sellerId) {
      ensureSellerProfile(gig.sellerId, gig.seller)
      setSelectedSellerId(gig.sellerId)
    }
    if (!user || !authToken) {
      setMessage('Log in to message the seller.')
      openLoginModal()
      return
    }
    try {
      const thread = await ensureThreadForGig(gig)
      setComposerText('')
      setComposerFiles([])
      setSelectedThreadId(thread.id)
      setChatThreads((prev) => {
        const others = prev.filter((t) => t.id !== thread.id)
        return [thread, ...others]
      })
      navigate(`/chats/${thread.id}`)
    } catch (error) {
      const message = error.message || 'Unable to open chat.'
      setMessage(message)
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
    const nameValue = fullName.trim()
    const emailValue = email.trim().toLowerCase()
    if (!nameValue || !emailValue || !password) {
      setFormErrors((prev) => ({ ...prev, signup: 'Please complete every field.' }))
      return
    }
    if (!/.+@.+\..+/.test(emailValue)) {
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
          name: nameValue,
          email: emailValue,
          password,
        },
      })
      if (data?.token && data?.user) {
        persistAuth(data.token, data.user, data.refreshToken)
      } else if (data?.user && data?.emailVerified === false) {
        setVerifyForm({ email: emailValue, token: '' })
        setMessage(data?.message || 'Verify your email before logging in.')
        navigate('/verify-email')
      }
      setForms((prev) => ({
        ...prev,
        signup: { fullName: '', email: '', password: '' },
      }))
      setMessage(
        data?.message || 'Account created. Please verify your email before logging in.',
      )
      setVerifyForm({ email: emailValue, token: '' })
      navigate('/verify-email')
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
        persistAuth(data.token, data.user, data.refreshToken)
      } else if (data?.message && /verify/i.test(data.message)) {
        setVerifyForm({ email: email.trim().toLowerCase(), token: '' })
        setMessage(data.message)
        navigate('/verify-email')
        return
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
      navigate('/')
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
    const refresh = getStoredRefreshToken()
    if (refresh) {
      fetchJSON('/api/auth/logout', { method: 'POST', body: { refreshToken: refresh } }).catch(
        () => {},
      )
    }
    clearAuth()
    setMessage('Signed out.')
    navigate('/')
  }

  const dismissModals = () => {
    setView('dashboard')
    navigate('/')
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
        navigate(`/gig/${normalized.id}`)
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

const handleForgotPassword = async () => {
  try {
    const email = forms.login.email || forms.signup.email
    if (!email) {
      setMessage('Enter your email to reset your password.')
      return
    }
    await fetchJSON('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.trim().toLowerCase() },
    })
    setMessage('If an account exists, a reset email has been sent.')
  } catch (error) {
    setMessage(error.message || 'Unable to start password reset.')
  } finally {
    dismissModals()
  }
}

const handleVerifySubmit = async (event) => {
  event.preventDefault()
  const email = verifyForm.email.trim().toLowerCase()
  const token = verifyForm.token.trim()
  if (!email || !token) {
    setMessage('Add your email and verification code.')
    return
  }
  try {
    setIsVerifySubmitting(true)
    const data = await fetchJSON('/api/auth/verify-email', {
      method: 'POST',
      body: { email, token },
    })
    if (data?.user && data?.token) {
      persistAuth(data.token, data.user, data.refreshToken)
      setMessage('Email verified. Welcome!')
    } else {
      setMessage('Email verified.')
    }
    navigate('/')
  } catch (error) {
    setMessage(error.message || 'Unable to verify email.')
  } finally {
    setIsVerifySubmitting(false)
  }
}

const handleResendVerification = async () => {
  const email = verifyForm.email.trim().toLowerCase() || forms.signup.email || forms.login.email
  if (!email) {
    setMessage('Enter your email to resend verification.')
    return
  }
  try {
    setIsVerifySubmitting(true)
    await fetchJSON('/api/auth/resend-verification', {
      method: 'POST',
      body: { email },
    })
    setMessage('If an account exists, a verification email has been sent.')
  } catch (error) {
    setMessage(error.message || 'Unable to resend verification.')
  } finally {
    setIsVerifySubmitting(false)
  }
}

const handleResetSubmit = async (event) => {
  event.preventDefault()
  const email = resetForm.email.trim().toLowerCase()
  const token = resetForm.token.trim()
  const password = resetForm.password
  if (!email || !token || !password) {
    setMessage('Add email, code, and new password.')
    return
  }
  if (password.length < 8) {
    setMessage('Password must be at least 8 characters.')
    return
  }
  try {
    setIsResetSubmitting(true)
    await fetchJSON('/api/auth/reset-password', {
      method: 'POST',
      body: { email, token, password },
    })
    setMessage('Password updated. Please sign in.')
    navigate('/')
    openLoginModal()
  } catch (error) {
    setMessage(error.message || 'Unable to reset password.')
  } finally {
    setIsResetSubmitting(false)
  }
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
    navigate('/seller/apply')
  }

  const cancelSellerApplication = () => {
    setSellerError('')
    setSellerForm(initialSellerForm)
    navigate('/seller-tools')
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

  const normalizeSingaporePhone = (value) => {
    const digits = (value || '').replace(/\D/g, '')
    if (digits.length === 8) return `+65${digits}`
    if (digits.length === 10 && digits.startsWith('65')) return `+65${digits.slice(-8)}`
    return null
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
    const normalizedPhone = normalizeSingaporePhone(phone)
    if (!normalizedPhone) {
      setSellerError('Enter a valid Singapore number in +65XXXXXXXX format (8 digits).')
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
      phone: normalizedPhone,
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
      setView('seller-dashboard')
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

  const handleBuyerBriefChange = (field) => (event) => {
    const value = event.target.value
    setBuyerBrief((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitBuyerBrief = (event) => {
    event.preventDefault()
    if (!user || !authToken) {
      setMessage('Log in to save your project brief.')
      return
    }
    if (user.isSeller) {
      setMessage('Switch to buyer mode to save a brief.')
      return
    }
    const { projectType, category, goals } = buyerBrief
    if (!projectType.trim() || !category.trim() || !goals.trim()) {
      setMessage('Add a project type, category, and brief goals.')
      return
    }
    const newBrief = {
      id: `brief-${Date.now()}`,
      ...buyerBrief,
      createdAt: Date.now(),
    }
    setBuyerBriefs((prev) => [newBrief, ...prev])
    setBuyerBrief({
      projectType: '',
      category: '',
      budget: '',
      timeline: '',
      goals: '',
      notes: '',
    })
    setMessage('Brief saved. You can reuse it for inquiries or broadcasts.')
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
    const hasQualifyingOrder = buyerOrders.some(
      (order) =>
        (order.sellerId && order.sellerId === selectedSellerId) &&
        ['delivered', 'complete'].includes(order.status),
    )
    if (!hasQualifyingOrder) {
      setMessage('Complete an order with this seller before leaving a review.')
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
        onDashboard={goToDashboard}
        onLogin={openLoginModal}
        onSignup={openSignupModal}
        onChat={goToChats}
        onSellerTools={handleOpenSellerTools}
        onProfile={handleOpenProfile}
        onLogout={handleLogout}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {message && (
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm font-medium text-purple-800 shadow-sm">
            {message}
          </div>
        )}
        {showLoadingBanner && (
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
            onShowAllCategories={() => navigate('/categories')}
            gigs={gigs}
            totalGigs={totalGigs}
            gigFilters={gigFilters}
            totalPages={totalGigPages}
            formatter={formatter}
            onOpenSellerProfile={handleOpenSellerProfile}
            onOpenChat={handleOpenChatFromGig}
            onOpenGig={handleOpenGigDetail}
            favoriteGigIds={favoriteGigIds}
            onToggleFavoriteGig={handleToggleFavoriteGig}
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
            onViewGig={handleViewGigFromChat}
            onStartGig={handleStartGigFromChat}
            isOwnGig={
              Boolean(
                selectedThread &&
                  user &&
                  (selectedThread.sellerUserId === (user._id || user.id) ||
                    gigs.find((gig) => gig.id === selectedThread.gigId)?.sellerUserId ===
                      (user._id || user.id)),
              )
            }
            onTyping={() => {
              if (!selectedThread?.id || !authToken) return
              authedFetch(`/api/chats/${selectedThread.id}/typing`, {
                method: 'POST',
                body: { ttlSeconds: 5 },
              }).catch(() => {})
            }}
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
            onBackToDashboard={goToDashboard}
            onOpenSellerProfile={handleOpenSellerProfile}
            onOpenChat={handleOpenChatFromGig}
            onOpenRelatedGig={handleOpenGigDetail}
            relatedGigs={relatedGigs}
            isFavorited={selectedGig ? favoriteGigIds.includes(selectedGig.id) : false}
            onToggleFavorite={() => selectedGig && handleToggleFavoriteGig(selectedGig)}
            inquiryDraft={inquiryDraft}
            onInquiryChange={handleInquiryChange}
            onSubmitInquiry={() => handleSubmitInquiry(selectedGig)}
            onCreateOrder={() => handleCreateOrder(selectedGig)}
            user={user}
            userSellerId={userSellerId}
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
            canViewAnalytics={selectedSellerIsOwner}
            isOwner={selectedSellerIsOwner}
            savedGigs={savedGigs}
            savedSellers={savedSellers}
            buyerBriefs={buyerBriefs}
            onOpenAnalytics={() => setView('seller-analytics')}
            onBackToDashboard={goToDashboard}
            onSubmitReview={handleSubmitReview}
            onReviewDraftChange={handleReviewDraftChange}
            onOpenChatFromGig={handleOpenChatFromGig}
            onOpenGigFromProfile={handleOpenGigDetail}
            isSellerFavorited={
              selectedSeller ? favoriteSellerIds.includes(selectedSeller.id) : false
            }
            onToggleFavoriteSeller={() =>
              selectedSeller && handleToggleFavoriteSeller(selectedSeller.id)
            }
          />
        )}

        {view === 'user-profile' && (
          <UserProfileView
            user={user}
            profile={myProfile}
            myGigs={myGigs}
            reviewList={myReviewList}
            ratingSummary={myRatingSummary}
            orders={profileOrders}
            formatter={formatter}
            timeAgo={timeAgo}
            buyerBrief={buyerBrief}
            buyerBriefs={buyerBriefs}
            favoriteGigIds={favoriteGigIds}
            favoriteSellerIds={favoriteSellerIds}
            savedGigs={savedGigs}
            savedSellers={savedSellers}
            onBackToDashboard={goToDashboard}
            onViewPublicProfile={handleViewPublicSellerProfile}
            onOpenSellerTools={handleOpenSellerTools}
            onOpenSellerDashboard={handleOpenSellerDashboard}
            onRefreshSellerProfile={handleRefreshMySellerProfile}
            onUpdateSellerProfile={handleUpdateSellerProfile}
            competencyLevels={competencyLevels}
            onOpenChatFromGig={handleOpenChatFromGig}
            onOpenGigFromOrder={handleOpenGigDetail}
            onOpenGigFromSaved={handleOpenGigDetail}
            onOpenSellerProfile={handleOpenSellerProfile}
            onRequestOrderCancel={handleRequestOrderCancel}
            onRequestOrderComplete={handleRequestOrderComplete}
            onBuyerBriefChange={handleBuyerBriefChange}
            onSubmitBuyerBrief={handleSubmitBuyerBrief}
          />
        )}

        {view === 'seller-analytics' && (
          <SellerAnalyticsView
            user={user}
            analytics={sellerAnalytics}
            isLoading={isAnalyticsLoading}
            error={analyticsError}
            rangeDays={analyticsRangeDays}
            slaHours={analyticsSlaHours}
            onBackToDashboard={goToDashboard}
            onOpenProfile={handleOpenMyProfile}
            onOpenPublicProfile={handleViewPublicSellerProfile}
            onRefresh={() => setAnalyticsRefreshKey((prev) => prev + 1)}
          />
        )}



        {view === 'seller-dashboard' && (
          <SellerDashboardView
            user={user}
            buyerOrders={buyerOrders}
            sellerOrders={sellerOrders}
            newGig={newGig}
            gigErrors={gigErrors}
            gigMedia={gigMedia}
            isUploadingMedia={isUploadingMedia}
            userSellerId={userSellerId}
            inputClasses={sellerInputClasses}
            categoryOptions={categoryOptions}
            myGigs={myGigs}
            formatter={formatter}
            onOpenGigFromOrder={handleOpenGigDetail}
            onOpenChatFromOrder={handleOpenChatFromOrder}
            onRequestOrderAccept={handleRequestOrderAccept}
            onRequestOrderCancel={handleRequestOrderCancel}
            onRequestOrderComplete={handleRequestOrderComplete}
            onBackToDashboard={goToDashboard}
            onOpenProfile={handleOpenMyProfile}
            onOpenLogin={openLoginModal}
            onOpenSignup={openSignupModal}
            onStartApplication={startSellerApplication}
            onOpenSellerProfile={handleOpenSellerProfile}
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

        {view === 'verify-email' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Verify email</p>
              <h2 className="text-2xl font-semibold text-slate-900">Verify your email</h2>
              <p className="text-sm text-slate-600">
                Enter the verification code from your inbox to activate your account.
              </p>
            </div>
            <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handleVerifySubmit}>
              <input
                type="email"
                className={inputClasses}
                placeholder="Email address"
                value={verifyForm.email}
                onChange={(e) => setVerifyForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                className={inputClasses}
                placeholder="Verification code"
                value={verifyForm.token}
                onChange={(e) => setVerifyForm((prev) => ({ ...prev, token: e.target.value }))}
              />
              <Button
                type="submit"
                className="bg-purple-600 text-white hover:bg-purple-500"
                disabled={isVerifySubmitting}
              >
                {isVerifySubmitting ? 'Verifying...' : 'Verify email'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={handleResendVerification}
                disabled={isVerifySubmitting}
              >
                Resend code
              </Button>
            </form>
          </section>
        )}

        {view === 'reset-password' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Reset password</p>
              <h2 className="text-2xl font-semibold text-slate-900">Reset password</h2>
              <p className="text-sm text-slate-600">
                Use the link we emailed you to reset your account password.
              </p>
            </div>
            <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handleResetSubmit}>
              <input
                type="email"
                className={inputClasses}
                placeholder="Email address"
                value={resetForm.email}
                onChange={(e) => setResetForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                className={inputClasses}
                placeholder="Reset code"
                value={resetForm.token}
                onChange={(e) => setResetForm((prev) => ({ ...prev, token: e.target.value }))}
              />
              <input
                type="password"
                className={inputClasses}
                placeholder="New password"
                value={resetForm.password}
                onChange={(e) => setResetForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <Button
                type="submit"
                className="bg-purple-600 text-white hover:bg-purple-500"
                disabled={isResetSubmitting}
              >
                {isResetSubmitting ? 'Saving...' : 'Update password'}
              </Button>
            </form>
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
                onClick={() => navigate('/privacy')}
              >
                Privacy Policy
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                className="text-slate-700 underline-offset-2 hover:underline"
                onClick={() => navigate('/terms')}
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
