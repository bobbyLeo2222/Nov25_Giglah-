import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import TimedAlert from '@/components/ui/TimedAlert'
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
import SearchResultsView from '@/frontend/views/SearchResultsView'
import ChatView from '@/frontend/views/ChatView'
import SellerApplicationView from '@/frontend/views/SellerApplicationView'
import SellerProfileView from '@/frontend/views/SellerProfileView'
import UserProfileView from '@/frontend/views/UserProfileView'
import GigDetailView from '@/frontend/views/GigDetailView'
import SellerDashboardView from '@/frontend/views/SellerDashboardView'
import SellerOrdersView from '@/frontend/views/SellerOrdersView'
import { normalizeOrderStatus } from '@/frontend/orderUtils'
import {
  buildSellerId,
  formatFileSize,
  mapUserFromApi,
  normalizeGig,
  normalizeMessage,
  normalizeProfile,
  normalizeReview,
  setStoredUserMode,
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

const PASSWORD_REQUIREMENTS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const PASSWORD_REQUIREMENTS_MESSAGE =
  'Use at least 8 characters with uppercase, lowercase, and a number.'
const GIG_IMAGE_LIMIT = 10
const GIG_VIDEO_LIMIT = 3
const CHAT_POLL_INTERVAL_MS = 15000
const ORDER_POLL_INTERVAL_MS = 20000
const NOTIFICATION_TOAST_DURATION_MS = 5000
const MAX_NOTIFICATIONS = 30
const EMPTY_GIG_FORM = {
  title: '',
  category: '',
  price: '',
  description: '',
  packages: [],
}

const getComparableUserId = (participant) =>
  participant?._id?.toString?.() || participant?.id?.toString?.() || participant?.toString?.() || ''

const toOrderStatusLabel = (status = '') => {
  const normalized = String(status || 'pending').replace(/_/g, ' ').trim()
  if (!normalized) return 'Pending'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const getOrderIdentity = (order) => String(order?._id || order?.id || '')

const getOrderTimestamp = (order) =>
  new Date(order?.updatedAt || order?.createdAt || 0).getTime() || 0

const resolveViewFromPath = (pathname = '/') => {
  if (matchPath('/gig/:gigId', pathname)) return 'gig-detail'
  if (pathname === '/seller-tools') return 'seller-dashboard'
  if (pathname === '/seller/orders') return 'seller-orders'
  if (pathname === '/orders') return 'buyer-orders'
  if (pathname === '/seller/apply') return 'seller-apply'
  if (matchPath('/seller/:sellerId', pathname)) return 'seller-profile'
  if (matchPath('/chats/:threadId', pathname) || pathname === '/chats') return 'chat'
  if (pathname === '/search') return 'search-results'
  if (pathname === '/categories') return 'categories'
  if (pathname === '/privacy') return 'privacy'
  if (pathname === '/terms') return 'terms'
  if (pathname === '/me' || pathname === '/me/seller') return 'user-profile'
  if (pathname === '/verify-email') return 'verify-email'
  if (pathname === '/reset-password') return 'reset-password'
  return 'dashboard'
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState(() =>
    resolveViewFromPath(typeof window !== 'undefined' ? window.location.pathname : '/'),
  )
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
    ...EMPTY_GIG_FORM,
  })
  const [editingGigId, setEditingGigId] = useState('')
  const [gigErrors, setGigErrors] = useState({
    title: '',
    category: '',
    price: '',
    packages: '',
  })
  const [message, setMessage] = useState('')
  const [reviewPrompt, setReviewPrompt] = useState(null)
  const [reviewPromptCountdown, setReviewPromptCountdown] = useState(5)
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
  const [gigReviews, setGigReviews] = useState({})
  const [selectedSellerId, setSelectedSellerId] = useState(() => {
    if (typeof window === 'undefined') return ''
    return matchPath('/seller/:sellerId', window.location.pathname)?.params?.sellerId || ''
  })
  const [selectedGigId, setSelectedGigId] = useState(() => {
    if (typeof window === 'undefined') return ''
    return matchPath('/gig/:gigId', window.location.pathname)?.params?.gigId || ''
  })
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, text: '', project: '' })
  const [currentServiceSlide, setCurrentServiceSlide] = useState(0)
  const [chatThreads, setChatThreads] = useState([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [isStartingGigFromChat, setIsStartingGigFromChat] = useState(false)
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState('')
  const [composerText, setComposerText] = useState('')
  const [composerFiles, setComposerFiles] = useState([])
  const [chatSearch, setChatSearch] = useState('')
  const [chatRoleFilter, setChatRoleFilter] = useState('all')
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
  const [savingGigStates, setSavingGigStates] = useState({})
  const [chattingGigStates, setChattingGigStates] = useState({})
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
  const [notifications, setNotifications] = useState([])
  const [notificationToasts, setNotificationToasts] = useState([])
  const [toastTick, setToastTick] = useState(0)
  const [hasSyncedSellerProfile, setHasSyncedSellerProfile] = useState(false)
  const seenThreadActivityRef = useRef(new Map())
  const seenOrderActivityRef = useRef(new Map())
  const recentOrderMutationsRef = useRef(new Map())
  const isStartingGigFromChatRef = useRef(false)
  const isSendingChatMessageRef = useRef(false)
  const lastChatSendSignatureRef = useRef({ signature: '', at: 0 })
  const toastTimeoutsRef = useRef([])
  const verificationEmailKey = 'giglah_pending_verification_email'
  const authedFetch = async (path, options = {}) => {
    const request = (token) => fetchJSON(path, { ...options, token })
    try {
      return await request(authToken)
    } catch (error) {
      const message = String(error?.message || '')
      const isAuthError = /invalid or expired token|authentication required/i.test(message)
      if (!isAuthError) {
        throw error
      }
      if (!getStoredRefreshToken()) {
        setAuthToken('')
        setStoredToken('')
        setStoredRefreshToken('')
        setUser(null)
        throw new Error('Session expired. Please log in again.')
      }
      try {
        const refreshedToken = await refreshAccessToken()
        setAuthToken(refreshedToken)
        setStoredToken(refreshedToken)
        return await request(refreshedToken)
      } catch {
        setAuthToken('')
        setStoredToken('')
        setStoredRefreshToken('')
        setUser(null)
        throw new Error('Session expired. Please log in again.')
      }
    }
  }
  const getStoredVerificationEmail = () => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(verificationEmailKey) || ''
  }
  const setStoredVerificationEmail = (email) => {
    if (typeof localStorage === 'undefined') return
    if (email) {
      localStorage.setItem(verificationEmailKey, email)
    } else {
      localStorage.removeItem(verificationEmailKey)
    }
  }
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
    setNotifications([])
    setNotificationToasts([])
    seenThreadActivityRef.current = new Map()
    seenOrderActivityRef.current = new Map()
    recentOrderMutationsRef.current = new Map()
  }

  useEffect(
    () => () => {
      toastTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      toastTimeoutsRef.current = []
    },
    [],
  )

  useEffect(() => {
    if (!notificationToasts.length) return undefined
    const intervalId = window.setInterval(() => {
      setToastTick((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [notificationToasts.length])

  const queueNotification = useCallback((payload) => {
    if (!payload?.title) return
    const now = Date.now()
    const notificationId = `notif-${now}-${Math.random().toString(16).slice(2)}`
    const dedupeKey = payload.dedupeKey || ''
    const nextNotification = {
      id: notificationId,
      type: payload.type === 'order' ? 'order' : 'message',
      title: payload.title,
      body: payload.body || '',
      createdAt: now,
      unread: true,
      action: payload.action || null,
      dedupeKey,
    }

    setNotifications((prev) => {
      if (dedupeKey && prev.some((entry) => entry.dedupeKey === dedupeKey)) return prev
      return [nextNotification, ...prev].slice(0, MAX_NOTIFICATIONS)
    })
    setNotificationToasts((prev) => [nextNotification, ...prev].slice(0, 3))

    if (typeof window !== 'undefined') {
      const timeoutId = window.setTimeout(() => {
        setNotificationToasts((prev) => prev.filter((entry) => entry.id !== notificationId))
      }, NOTIFICATION_TOAST_DURATION_MS)
      toastTimeoutsRef.current.push(timeoutId)
    }

    if (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden' &&
      'Notification' in window &&
      window.Notification.permission === 'granted'
    ) {
      try {
        new window.Notification(payload.title, { body: payload.body || 'Open GigLah to view updates.' })
      } catch {
        // Browser notification support can fail silently in some environments.
      }
    }
  }, [])

  const dismissNotificationToast = useCallback((notificationId) => {
    setNotificationToasts((prev) => prev.filter((entry) => entry.id !== notificationId))
  }, [])

  const markNotificationRead = useCallback((notificationId) => {
    if (!notificationId) return
    setNotifications((prev) =>
      prev.map((entry) => (entry.id === notificationId ? { ...entry, unread: false } : entry)),
    )
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((entry) => ({ ...entry, unread: false })))
  }, [])

  const markNotificationsByTypeRead = useCallback((type) => {
    if (!type) return
    setNotifications((prev) =>
      prev.map((entry) => (entry.type === type ? { ...entry, unread: false } : entry)),
    )
  }, [])

  const handleSwitchUserMode = (nextMode) => {
    if (!user || user.role !== 'seller') return
    setStoredUserMode(nextMode)
    setUser((prev) => (prev ? { ...prev, isSeller: nextMode === 'seller' } : prev))
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

  const mySellerProfile = useMemo(() => {
    if (!user) return null
    const userId = user._id || user.id || ''
    if (userId) {
      const byUserId = sellerProfiles.find((profile) => profile.userId && profile.userId === userId)
      if (byUserId) return byUserId
    }
    return sellerProfiles.find((profile) => profile.id === userSellerId) || null
  }, [sellerProfiles, user, userSellerId])

  const mySellerProfileId = mySellerProfile?.id || userSellerId

  const selectedSeller = useMemo(() => {
    const byId = sellerProfiles.find((profile) => profile.id === selectedSellerId)
    if (byId) return byId
    if (!user) return null
    const userId = user._id || user.id || ''
    if (!userId || selectedSellerId !== userSellerId) return null
    return sellerProfiles.find((profile) => profile.userId && profile.userId === userId) || null
  }, [sellerProfiles, selectedSellerId, user, userSellerId])

  const activeSellerId = selectedSeller?.id || selectedSellerId

  const sellerNameById = useMemo(
    () =>
      sellerProfiles.reduce((map, profile) => {
        if (profile?.id) {
          map[profile.id] = profile.name || 'Seller'
        }
        return map
      }, {}),
    [sellerProfiles],
  )

  const selectedGig = useMemo(
    () => gigs.find((gig) => gig.id === selectedGigId) || null,
    [gigs, selectedGigId],
  )

  const sellerPortfolio = useMemo(
    () => gigs.filter((gig) => gig.sellerId === activeSellerId),
    [activeSellerId, gigs],
  )

  const selectedSellerIsOwner = useMemo(() => {
    if (!user || !selectedSeller || !user.isSeller) return false
    const userId = user._id || user.id
    if (selectedSeller.userId && selectedSeller.userId === userId) return true
    return Boolean(selectedSeller.id && selectedSeller.id === mySellerProfileId)
  }, [mySellerProfileId, selectedSeller, user])

  const isGigOwner = useCallback(
    (gig) => {
      if (!user) return false
      const owner = gig.owner
      const userId = user._id || user.id
      return (
        owner === user.email ||
        owner === userId ||
        (gig.sellerId && mySellerProfileId && gig.sellerId === mySellerProfileId) ||
        gig.sellerId === userSellerId ||
        gig.seller === userId
      )
    },
    [mySellerProfileId, user, userSellerId],
  )

  const sellerReviewList = useMemo(
    () => sellerReviews[activeSellerId] || [],
    [activeSellerId, sellerReviews],
  )

  const gigReviewList = useMemo(
    () => (selectedGig?.id ? gigReviews[selectedGig.id] || [] : []),
    [gigReviews, selectedGig?.id],
  )

  const canLeaveReviewForSelectedGig = useMemo(() => {
    if (!selectedGig || !user || !authToken || user.isSeller) return false
    if (isGigOwner(selectedGig)) return false
    const userId = user._id || user.id || ''
    const alreadyReviewed = gigReviewList.some(
      (review) => String(review.buyerId || '') === String(userId),
    )
    if (alreadyReviewed) return false
    return buyerOrders.some((order) => {
      const status = normalizeOrderStatus(order?.status)
      if (status !== 'complete') return false
      return String(order?.gigId || '') === String(selectedGig.id)
    })
  }, [authToken, buyerOrders, gigReviewList, isGigOwner, selectedGig, user])

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

  useEffect(() => {
    if (!user) {
      setChatRoleFilter('all')
      return
    }
    if (user.role !== 'seller') {
      setChatRoleFilter('all')
      return
    }
    setChatRoleFilter(user.isSeller ? 'seller' : 'buyer')
  }, [user?._id, user?.id, user?.isSeller, user?.role])

  const chatThreadCounts = useMemo(() => {
    const userId = user?._id || user?.id || ''
    return sortedThreads.reduce(
      (counts, thread) => {
        counts.all += 1
        if (!userId || thread.buyerUserId === userId) counts.buyer += 1
        if (!userId || thread.sellerUserId === userId) counts.seller += 1
        return counts
      },
      { all: 0, buyer: 0, seller: 0 },
    )
  }, [sortedThreads, user])

  const notificationUnreadCount = useMemo(
    () => notifications.filter((entry) => entry.unread).length,
    [notifications],
  )

  const orderNotificationCount = useMemo(
    () => notifications.filter((entry) => entry.unread && entry.type === 'order').length,
    [notifications],
  )

  const totalGigPages = useMemo(() => {
    const size = Number(gigFilters.pageSize) || 1
    return Math.max(1, Math.ceil((totalGigs || 0) / size))
  }, [gigFilters.pageSize, totalGigs])

  const visibleThreads = useMemo(() => {
    const effectiveRoleFilter = user?.role === 'seller' ? chatRoleFilter : 'all'
    const userId = user?._id || user?.id || ''
    const roleFiltered =
      effectiveRoleFilter === 'all'
        ? sortedThreads
        : sortedThreads.filter((thread) =>
            effectiveRoleFilter === 'seller'
              ? (!userId || thread.sellerUserId === userId)
              : (!userId || thread.buyerUserId === userId),
          )
    const searchTerm = chatSearch.trim().toLowerCase()
    if (!searchTerm) return roleFiltered
    return roleFiltered.filter(
      (thread) =>
        thread.gigTitle.toLowerCase().includes(searchTerm) ||
        thread.sellerName.toLowerCase().includes(searchTerm) ||
        (thread.buyerName || '').toLowerCase().includes(searchTerm),
    )
  }, [chatRoleFilter, chatSearch, sortedThreads, user])

  useEffect(() => {
    if (!selectedThreadId) return
    const stillVisible = visibleThreads.some((thread) => thread.id === selectedThreadId)
    if (stillVisible) return
    setSelectedThreadId(visibleThreads[0]?.id || '')
  }, [selectedThreadId, visibleThreads])

  const myGigs = useMemo(
    () => (user ? gigs.filter((gig) => isGigOwner(gig)) : []),
    [gigs, isGigOwner, user],
  )

  const userGigCount = myGigs.length

  const myProfile = useMemo(() => {
    if (!user) return null
    const sellerProfile = mySellerProfile
    const isSellerPrivateRoute = location.pathname === '/me/seller'
    const includeSellerDetails = Boolean(user.role === 'seller' && isSellerPrivateRoute)
    return {
      ...sellerProfile,
      name: user.name || sellerProfile?.name || '',
      email: user.email || '',
      headline: includeSellerDetails ? sellerProfile?.headline || '' : '',
      about: includeSellerDetails ? sellerProfile?.about || '' : '',
      avatar: user?.avatarUrl || sellerProfile?.avatar || '',
      location: includeSellerDetails ? sellerProfile?.location || '' : '',
      languages: includeSellerDetails ? sellerProfile?.languages || [] : [],
      skills: includeSellerDetails ? sellerProfile?.skills || sellerProfile?.specialties || [] : [],
      specialties: includeSellerDetails ? sellerProfile?.specialties || sellerProfile?.skills || [] : [],
      stats: sellerProfile?.stats || { projects: userGigCount, response: '—', repeat: '—' },
    }
  }, [location.pathname, mySellerProfile, user, userGigCount])

  const myReviewList = useMemo(
    () => (mySellerProfileId ? sellerReviews[mySellerProfileId] || [] : []),
    [mySellerProfileId, sellerReviews],
  )

  const pendingChatOrder = useMemo(() => {
    if (!selectedThread || !user?.isSeller) return null
    const buyerId = selectedThread.buyerUserId || ''
    return (
      sellerOrders.find((order) => {
        if (!order || order.status !== 'pending') return false
        if (order.gigId !== selectedThread.gigId) return false
        const orderBuyer =
          order.buyer?._id?.toString?.() || order.buyer?.toString?.() || order.buyer || ''
        return buyerId && orderBuyer && orderBuyer.toString() === buyerId.toString()
      }) || null
    )
  }, [selectedThread, sellerOrders, user])

  const syncViewFromPath = useCallback(() => {
    const gigMatch = matchPath('/gig/:gigId', location.pathname)
    if (gigMatch?.params?.gigId) {
      setSelectedGigId(gigMatch.params.gigId)
      setView('gig-detail')
      return
    }

    if (location.pathname === '/seller-tools') {
      setView(user?.role === 'seller' ? 'seller-dashboard' : 'seller-apply')
      return
    }
    if (location.pathname === '/seller/orders') {
      setView('seller-orders')
      return
    }
    if (location.pathname === '/orders') {
      setView('buyer-orders')
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
    if (location.pathname === '/search') {
      setView('search-results')
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
    if (location.pathname === '/me/seller') {
      if (user?.role !== 'seller') {
        navigate('/me', { replace: true })
      }
      setView('user-profile')
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
  }, [location.pathname, navigate, user?.isSeller, user?.role])

  useEffect(() => {
    syncViewFromPath()
  }, [syncViewFromPath])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const email = params.get('email') || ''
    const tokenParam = params.get('token') || ''
    const token = /^\d{6}$/.test(tokenParam) ? tokenParam : ''
    if (location.pathname === '/verify-email') {
      const storedEmail = email || getStoredVerificationEmail()
      if (storedEmail) {
        setStoredVerificationEmail(storedEmail)
      }
      setVerifyForm((prev) => ({ ...prev, email: storedEmail || prev.email, token }))
    }
    if (location.pathname === '/reset-password') {
      setResetForm((prev) => ({ ...prev, email, token }))
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!reviewPrompt) return undefined
    setReviewPromptCountdown(5)
    const intervalId = window.setInterval(() => {
      setReviewPromptCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId)
          setReviewPrompt(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [reviewPrompt])

  useEffect(() => {
    if (location.pathname !== '/search') return
    const params = new URLSearchParams(location.search || '')
    const search = params.get('search') || ''
    setGigFilters((prev) => {
      if (prev.search === search) return prev
      return { ...prev, search, page: 1 }
    })
  }, [location.pathname, location.search])

  useEffect(() => {
    if (location.pathname === '/search') return
    setGigFilters((prev) => {
      if (!prev.search) return prev
      return { ...prev, search: '', page: 1 }
    })
  }, [location.pathname])

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
        const trimmedSearch = String(gigFilters.search || '').trim()
        if (trimmedSearch) params.set('search', trimmedSearch)
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
      seenOrderActivityRef.current = new Map()
      return
    }
    let cancelled = false
    const currentUserId = user?._id || user?.id || ''
    const syncOrders = (nextBuyerOrders, nextSellerOrders, announceUpdates = false) => {
      setBuyerOrders(nextBuyerOrders)
      setSellerOrders(nextSellerOrders)

      const previousActivity = seenOrderActivityRef.current
      const mergedById = new Map()
      ;[...nextBuyerOrders, ...nextSellerOrders].forEach((order) => {
        const orderId = getOrderIdentity(order)
        if (!orderId) return
        const existing = mergedById.get(orderId)
        if (!existing || getOrderTimestamp(order) >= getOrderTimestamp(existing)) {
          mergedById.set(orderId, order)
        }
      })

      const nextActivity = new Map()
      mergedById.forEach((order, orderId) => {
        const status = String(order?.status || 'pending').toLowerCase()
        const updatedAt = getOrderTimestamp(order)
        nextActivity.set(orderId, { status, updatedAt })

        if (!announceUpdates) return
        const previous = previousActivity.get(orderId)
        const buyerId = getComparableUserId(order?.buyer)
        const sellerId = getComparableUserId(order?.seller)
        const isBuyer = String(buyerId) === String(currentUserId || '')
        const isSeller = String(sellerId) === String(currentUserId || '')

        if (!isBuyer && !isSeller) return

        if (!previous) {
          if (!isSeller) return
          queueNotification({
            type: 'order',
            title: 'New order received',
            body: `${order?.gigTitle || 'A gig'} has a new order request.`,
            action: { kind: 'seller-orders' },
            dedupeKey: `order:new:${orderId}`,
          })
          return
        }

        if (previous.status === status) return
        const recentMutation = recentOrderMutationsRef.current.get(orderId)
        if (recentMutation) {
          const mutationAgeMs = Date.now() - (recentMutation.at || 0)
          if (mutationAgeMs > 60000) {
            recentOrderMutationsRef.current.delete(orderId)
          } else if (recentMutation.status === status) {
            recentOrderMutationsRef.current.delete(orderId)
            return
          }
        }
        const statusLabel = toOrderStatusLabel(status)
        const perspective = isSeller ? 'Buyer workflow updated.' : 'Seller workflow updated.'
        queueNotification({
          type: 'order',
          title: `Order ${statusLabel}`,
          body: `${order?.gigTitle || 'Your order'} • ${perspective}`,
          action: { kind: isSeller ? 'seller-orders' : 'buyer-orders' },
          dedupeKey: `order:status:${orderId}:${status}:${updatedAt}`,
        })
      })

      seenOrderActivityRef.current = nextActivity
    }

    const loadOrders = async (announceUpdates = false) => {
      try {
        const [buyerData, sellerData] = await Promise.all([
          authedFetch('/api/orders?role=buyer'),
          authedFetch('/api/orders?role=seller'),
        ])
        if (cancelled) return
        syncOrders(buyerData?.orders || [], sellerData?.orders || [], announceUpdates)
      } catch (error) {
        console.error('Failed to load orders', error)
      }
    }

    loadOrders(false)
    const intervalId = setInterval(() => {
      loadOrders(true)
    }, ORDER_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [authToken, queueNotification, user])

  useEffect(() => {
    if (!activeSellerId) return undefined
    let cancelled = false
    fetchJSON(`/api/reviews/seller/${activeSellerId}`)
      .then((data) => {
        if (cancelled) return
        const normalized = (data?.reviews || []).map(normalizeReview)
        setSellerReviews((prev) => ({
          ...prev,
          [activeSellerId]: normalized,
        }))
      })
      .catch((error) => {
        console.error('Failed to load reviews', error)
      })

    return () => {
      cancelled = true
    }
  }, [activeSellerId])

  useEffect(() => {
    if (!selectedGigId) return undefined
    let cancelled = false
    fetchJSON(`/api/reviews/gig/${selectedGigId}`)
      .then((data) => {
        if (cancelled) return
        const normalized = (data?.reviews || []).map(normalizeReview)
        setGigReviews((prev) => ({
          ...prev,
          [selectedGigId]: normalized,
        }))
      })
      .catch((error) => {
        console.error('Failed to load gig reviews', error)
      })

    return () => {
      cancelled = true
    }
  }, [selectedGigId])

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
      seenThreadActivityRef.current = new Map()
      return
    }
    let cancelled = false
    const currentUserId = user?._id || user?.id || ''
    const syncThreads = (normalizedThreads, announceUpdates = false) => {
      const previousActivity = seenThreadActivityRef.current
      const nextActivity = new Map()

      normalizedThreads.forEach((thread) => {
        const lastMessage = thread.messages?.[thread.messages.length - 1] || null
        const lastMessageAt = lastMessage?.sentAt || thread.lastUpdatedAt || 0
        nextActivity.set(thread.id, { lastMessageAt })

        if (!announceUpdates) return
        const previous = previousActivity.get(thread.id)
        if (previous && lastMessageAt <= previous.lastMessageAt) return
        if (!lastMessage) return
        if (String(lastMessage.senderId || '') === String(currentUserId || '')) return
        if ((thread.unreadCount || 0) <= 0) return

        const isSellerPerspective = String(thread.sellerUserId || '') === String(currentUserId || '')
        const senderName = isSellerPerspective
          ? thread.buyerName || lastMessage.senderName || 'Buyer'
          : thread.sellerName || lastMessage.senderName || 'Seller'
        const body =
          (lastMessage.text || '').trim() ||
          (lastMessage.attachments?.length ? 'Shared an attachment.' : `New message about ${thread.gigTitle}.`)

        queueNotification({
          type: 'message',
          title: `New message from ${senderName}`,
          body: body.slice(0, 140),
          action: { kind: 'chat', threadId: thread.id },
          dedupeKey: `message:${thread.id}:${lastMessageAt}`,
        })
      })

      seenThreadActivityRef.current = nextActivity
      setChatThreads(normalizedThreads)
      const total = normalizedThreads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0)
      setUnreadTotal(total)
    }

    const loadChats = async (announceUpdates = false) => {
      try {
        const data = await authedFetch('/api/chats')
        if (cancelled) return
        const normalized = (data?.threads || []).map(normalizeThread).filter(Boolean)
        syncThreads(normalized, announceUpdates)
      } catch (error) {
        console.error('Failed to load chats', error)
      }
    }

    loadChats(false)
    const intervalId = setInterval(() => {
      loadChats(true)
    }, CHAT_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [authToken, normalizeThread, queueNotification, user])

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
      const profileUserId = extras.userId || ''
      if (prev.some((profile) => profile.id === sellerId || (profileUserId && profile.userId === profileUserId))) {
        return prev
      }
      const profile = {
        id: sellerId,
        userId: profileUserId,
        name: sellerName || '',
        headline: extras.headline || '',
        about: extras.about || '',
        location: extras.location || '',
        avatar: extras.avatar || '',
        heroImage: extras.heroImage || '',
        specialties: extras.specialties || [],
        languages: extras.languages || [],
        stats: extras.stats || { projects: 0, response: '—', repeat: '—' },
        socials: extras.socials || { website: '', instagram: '', otherSocial: '' },
        availability: extras.availability || '',
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

  const handleOpenBuyerProfile = () => {
    if (!user) return
    setView('user-profile')
    navigate('/me')
  }

  const handleOpenSellerPrivateProfile = () => {
    if (!user) return
    if (user.role !== 'seller') {
      setMessage('Complete seller onboarding first to open seller private profile.')
      startSellerApplication()
      return
    }
    const sellerId = mySellerProfile?.id || userSellerId || buildSellerId(user.email || user.name || '')
    ensureSellerProfile(sellerId, user.name || 'Member', {
      userId: user._id || user.id || '',
      avatar: mySellerProfile?.avatar || user.avatarUrl || '',
      headline: mySellerProfile?.headline || '',
      about: mySellerProfile?.about || '',
      location: mySellerProfile?.location || '',
      specialties: mySellerProfile?.skills || mySellerProfile?.specialties || [],
      languages: mySellerProfile?.languages || [],
      socials: mySellerProfile?.socials || { website: '', instagram: '', otherSocial: '' },
    })
    setSelectedSellerId(sellerId)
    setView('user-profile')
    navigate('/me/seller')
  }

  const handleOpenMyProfile = () => {
    if (!user) return
    if (user.isSeller) {
      handleOpenSellerPrivateProfile()
      return
    }
    handleOpenBuyerProfile()
  }

  const handleOpenSellerDashboard = () => {
    if (!user) return
    if (!user.isSeller) {
      setMessage('Switch to seller mode to open the seller dashboard.')
      return
    }
    navigate('/seller-tools#seller-dashboard')
  }

  const handleOpenSellerOrders = () => {
    if (!user) return
    if (!user.isSeller) {
      setMessage('Switch to seller mode to open seller orders.')
      return
    }
    markNotificationsByTypeRead('order')
    navigate('/seller/orders')
  }

  const handleOpenBuyerOrders = () => {
    if (!user) {
      setMessage('Log in to view your buyer orders.')
      navigate('/orders')
      return
    }
    if (user.isSeller) {
      setMessage('Switch to buyer mode to open buyer orders.')
      return
    }
    markNotificationsByTypeRead('order')
    navigate('/orders')
  }

  const handleOpenNotification = useCallback(
    (notification) => {
      if (!notification) return
      markNotificationRead(notification.id)
      dismissNotificationToast(notification.id)

      const actionKind = notification.action?.kind || ''
      if (actionKind === 'chat' && notification.action?.threadId) {
        setSelectedThreadId(notification.action.threadId)
        navigate(`/chats/${notification.action.threadId}`)
        return
      }
      if (actionKind === 'seller-orders') {
        handleOpenSellerOrders()
        return
      }
      if (actionKind === 'buyer-orders') {
        handleOpenBuyerOrders()
      }
    },
    [
      dismissNotificationToast,
      handleOpenBuyerOrders,
      handleOpenSellerOrders,
      markNotificationRead,
      navigate,
    ],
  )

  const handleViewPublicSellerProfile = () => {
    if (!user) return
    if (user.role !== 'seller') {
      setMessage('Complete seller onboarding first to view your public seller profile.')
      return
    }
    const sellerId = mySellerProfile?.id || userSellerId || buildSellerId(user.email || user.name || '')
    ensureSellerProfile(sellerId, user.name || 'Member', {
      userId: user._id || user.id || '',
      avatar: mySellerProfile?.avatar || user.avatarUrl || '',
      headline: mySellerProfile?.headline || '',
      about: mySellerProfile?.about || '',
      location: mySellerProfile?.location || '',
      specialties: mySellerProfile?.skills || mySellerProfile?.specialties || [],
      languages: mySellerProfile?.languages || [],
      socials: mySellerProfile?.socials || { website: '', instagram: '', otherSocial: '' },
    })
    setSelectedSellerId(sellerId)
    navigate(`/seller/${sellerId}`)
  }

  const handleRefreshMySellerProfile = useCallback(async () => {
    if (!user || !authToken) return null
    try {
      const data = await authedFetch('/api/profiles/me')
      if (data?.profile) {
        const normalized = normalizeProfile(data.profile)
        setSellerProfiles((prev) => {
          const filtered = prev.filter((profile) => {
            if (profile.id === normalized.id || profile._id === normalized.id) return false
            if (normalized.userId && profile.userId && profile.userId === normalized.userId) return false
            return true
          })
          return [...filtered, normalized]
        })
        setSelectedSellerId((prev) => {
          if (!prev) return normalized.id
          if (prev === normalized.id) return prev
          if (prev === userSellerId) return normalized.id
          return prev
        })
        return normalized
      }
    } catch (error) {
      setMessage(error.message || 'Unable to load seller profile.')
    }
    return null
  }, [authToken, user, userSellerId])

  useEffect(() => {
    if (user?.role === 'seller' && authToken && !hasSyncedSellerProfile) {
      handleRefreshMySellerProfile().finally(() => setHasSyncedSellerProfile(true))
    }
    // We intentionally omit handleRefreshMySellerProfile from deps to avoid re-sync loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, hasSyncedSellerProfile, user?.role])

  const handleUpdateSellerProfile = async (updates) => {
    if (!user || !authToken) {
      setMessage('Please sign in to update your seller profile.')
      return
    }
    try {
      const payload = { ...updates }
      if (updates?.profilePicture) {
        const formData = new FormData()
        formData.append('file', updates.profilePicture)
        const upload = await authedFetch('/api/uploads/image', {
          method: 'POST',
          body: formData,
        })
        if (upload?.url) {
          payload.imageUrl = upload.url
        }
      }
      delete payload.profilePicture

      setMessage('Saving your seller profile...')
      const data = await authedFetch('/api/profiles/me', {
        method: 'PUT',
        body: payload,
      })
      const updatedProfile = data?.profile
      if (updatedProfile) {
        const normalized = normalizeProfile(updatedProfile)
        setSellerProfiles((prev) => {
          const filtered = prev.filter((profile) => {
            if (profile.id === normalized.id || profile._id === normalized.id) return false
            if (normalized.userId && profile.userId && profile.userId === normalized.userId) return false
            return true
          })
          return [...filtered, normalized]
        })
        setSelectedSellerId((prev) => {
          if (!prev) return normalized.id
          if (prev === normalized.id) return prev
          if (prev === userSellerId) return normalized.id
          return prev
        })
      }
      if (payload.imageUrl) {
        setUser((prev) =>
          prev ? { ...prev, avatarUrl: payload.imageUrl, avatar: payload.imageUrl } : prev,
        )
      }
      if (payload.displayName) {
        setUser((prev) => (prev ? { ...prev, name: payload.displayName } : prev))
      }
      setMessage('Seller profile updated.')
    } catch (error) {
      setMessage(error.message || 'Unable to update seller profile.')
      throw error
    }
  }

  const handleUpdateBuyerProfile = async (updates) => {
    if (!user || !authToken) {
      setMessage('Please sign in to update your buyer profile.')
      return
    }
    try {
      const payload = { ...updates }
      if (updates?.profilePicture) {
        const formData = new FormData()
        formData.append('file', updates.profilePicture)
        const upload = await authedFetch('/api/uploads/image', {
          method: 'POST',
          body: formData,
        })
        if (upload?.url) {
          payload.avatarUrl = upload.url
        }
      }
      delete payload.profilePicture

      const data = await authedFetch('/api/auth/me', {
        method: 'PUT',
        body: payload,
      })
      if (data?.user) {
        const nextUser = mapUserFromApi(data.user)
        const currentUserId = user?._id || user?.id || ''
        setUser(nextUser)
        if (currentUserId) {
          setSellerProfiles((prev) =>
            prev.map((profile) =>
              profile.userId === currentUserId
                ? {
                    ...profile,
                    avatar: nextUser.avatarUrl || profile.avatar,
                    heroImage: nextUser.avatarUrl || profile.heroImage,
                  }
                : profile,
            ),
          )
        }
      }
      setMessage('Buyer profile updated.')
    } catch (error) {
      setMessage(error.message || 'Unable to update buyer profile.')
      throw error
    }
  }

  const handleCategorySelect = (label) => {
    setActiveCategory(label)
    setGigFilters((prev) => ({ ...prev, category: label, page: 1 }))
    navigate('/categories')
  }

  const goToDashboard = useCallback(() => navigate('/'), [navigate])
  const goToChats = useCallback(() => {
    markNotificationsByTypeRead('message')
    navigate('/chats')
  }, [markNotificationsByTypeRead, navigate])
  const goToMarketplace = useCallback(() => {
    setGigFilters((prev) => ({
      ...prev,
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      page: 1,
    }))
    navigate('/search')
  }, [navigate])

  const getOrderParticipantId = (participant) =>
    participant?._id?.toString?.() || participant?.id?.toString?.() || participant?.toString?.() || ''

  const ensureThreadForOrder = async (order) => {
    if (!order) throw new Error('Order details are missing.')
    if (!user || !authToken) throw new Error('Log in to open order chats.')

    const currentUserId = user?._id || user?.id || ''
    const buyerUserId = getOrderParticipantId(order.buyer)
    const sellerUserId = getOrderParticipantId(order.seller)

    if (!buyerUserId || !sellerUserId) {
      throw new Error('Unable to determine order participants for chat.')
    }

    if (currentUserId !== buyerUserId && currentUserId !== sellerUserId) {
      throw new Error('You can only message participants from your own orders.')
    }

    const existingThread = chatThreads.find((thread) => {
      if (thread.gigId !== order.gigId) return false
      const sameBuyer = !buyerUserId || thread.buyerUserId === buyerUserId
      const sameSeller = !sellerUserId || thread.sellerUserId === sellerUserId
      return sameBuyer && sameSeller
    })
    if (existingThread) return existingThread

    const sellerName =
      order.sellerName || sellerNameById[order.sellerId] || selectedSeller?.name || 'Seller'
    const created = await authedFetch('/api/chats', {
      method: 'POST',
      body: {
        participantIds: [buyerUserId, sellerUserId],
        title: buildThreadTitleFromGig({ id: order.gigId, title: order.gigTitle }),
        gigId: order.gigId,
        gigTitle: order.gigTitle,
        sellerId: sellerUserId,
        buyerId: buyerUserId,
        sellerName,
        buyerName:
          currentUserId === buyerUserId ? user.name || 'Buyer' : order.buyerName || 'Buyer',
      },
    })
    const threadId = created?.thread?._id || created?.thread?.id
    let normalized = null
    if (threadId) {
      const fetched = await authedFetch(`/api/chats/${threadId}`)
      normalized = normalizeThread(fetched?.thread || created?.thread)
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

  const handleOpenChatFromOrder = async (order) => {
    if (!order) return
    if (!user || !authToken) {
      setMessage('Log in to message about this order.')
      openLoginModal()
      return
    }
    try {
      const thread = await ensureThreadForOrder(order)
      setComposerText('')
      setComposerFiles([])
      setSelectedThreadId(thread.id)
      navigate(`/chats/${thread.id}`)
    } catch (error) {
      setMessage(error.message || 'Unable to open order chat.')
    }
  }

  const handleOpenProfile = () => {
    if (!user) return
    handleOpenMyProfile()
  }

  const handleOpenSellerTools = (sectionId = '') => {
    if (!user) {
      setMessage('Log in first.')
      return
    }
    if (user.role === 'seller') {
      if (!user.isSeller) {
        setMessage('Switch to seller mode to open seller tools.')
        return
      }
      const targetPath = sectionId ? `/seller-tools#${sectionId}` : '/seller-tools'
      navigate(targetPath)
      return
    }
    startSellerApplication()
  }

  const handleOpenSellerCreateGig = () => {
    setEditingGigId('')
    setNewGig({ ...EMPTY_GIG_FORM })
    setGigErrors({ title: '', category: '', price: '', packages: '' })
    setGigMedia([])
    handleOpenSellerTools('create-gig')
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

  const syncGigSearchRoute = useCallback(
    (value) => {
      const trimmed = String(value || '').trim()
      if (trimmed) {
        const params = new URLSearchParams()
        params.set('search', trimmed)
        const nextRoute = `/search?${params.toString()}`
        const currentRoute = `${location.pathname}${location.search || ''}`
        if (currentRoute !== nextRoute) {
          navigate(nextRoute, { replace: true })
        }
        return
      }
      if (location.pathname === '/search' && location.search) {
        navigate('/search', { replace: true })
      }
    },
    [location.pathname, location.search, navigate],
  )

  const handleGigSearchChange = useCallback(
    (value) => {
      const nextSearch = String(value || '')
      setGigFilters((prev) => {
        if (prev.search === nextSearch) return prev
        return { ...prev, search: nextSearch, page: 1 }
      })
      syncGigSearchRoute(nextSearch)
    },
    [syncGigSearchRoute],
  )

  const handleGigSearchSubmit = (value) => {
    handleGigSearchChange(value)
    if (!String(value || '').trim() && location.pathname === '/search' && location.search) {
      navigate('/search', { replace: true })
    }
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
    if (location.pathname === '/search') {
      navigate('/', { replace: true })
    }
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
            file,
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
        const userId = user?._id || user?.id
        const orderSellerId = data.order.sellerId || ''
        const orderComplete = data.order.status === 'complete'
        const isBuyer = data.order.buyer?.toString?.() === userId || data.order.buyer === userId
        const matchesOrder = (order) =>
          String(order?._id || order?.id || '') === String(orderId)
        setBuyerOrders((prev) =>
          prev.map((order) =>
            matchesOrder(order) ? data.order : order,
          ),
        )
        setSellerOrders((prev) =>
          prev.map((order) =>
            matchesOrder(order) ? data.order : order,
          ),
        )
        const updatedOrderId = getOrderIdentity(data.order)
        if (updatedOrderId) {
          recentOrderMutationsRef.current.set(updatedOrderId, {
            status: String(data.order.status || status || 'pending').toLowerCase(),
            at: Date.now(),
          })
        }
        setMessage(
          status === 'cancelled'
            ? 'Order cancelled.'
            : status === 'complete'
              ? 'Completion recorded.'
              : 'Order updated.',
        )
        if (orderComplete && isBuyer && data.order.gigId) {
          setReviewPrompt({
            sellerId: orderSellerId,
            gigId: data.order.gigId || '',
            gigTitle: data.order.gigTitle || 'this gig',
          })
        }
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
    if (!gig?.id) return
    if (!user || !authToken) {
      setMessage('Log in to save gigs.')
      return
    }
    if (user.isSeller) {
      setMessage('Buyer mode required to save gigs.')
      return
    }
    const isFav = favoriteGigIds.includes(gig.id)
    setSavingGigStates((prev) => ({ ...prev, [gig.id]: true }))
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
    } finally {
      setSavingGigStates((prev) => ({ ...prev, [gig.id]: false }))
    }
  }

  const handleToggleFavoriteSeller = async (sellerId) => {
    if (!sellerId) return
    if (!user || !authToken) {
      setMessage('Log in to save sellers.')
      return
    }
    if (user.isSeller) {
      setMessage('Buyer mode required to save sellers.')
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
    if (user?.isSeller) {
      setMessage('Buyer mode required to contact sellers from gig listings.')
      return
    }
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
      setMessage('Buyer mode required to place an order.')
      return
    }
    const userId = user._id || user.id
    const isOwnGig = gig.sellerUserId === userId || gig.owner === userId
    if (isOwnGig) {
      setMessage('You cannot start an order on your own gig.')
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
    if (isStartingGigFromChatRef.current) return
    isStartingGigFromChatRef.current = true
    setIsStartingGigFromChat(true)
    if (!user || !authToken) {
      setMessage('Log in to start a gig.')
      isStartingGigFromChatRef.current = false
      setIsStartingGigFromChat(false)
      return
    }
    if (user.isSeller) {
      setMessage('Buyer mode required to start a gig.')
      isStartingGigFromChatRef.current = false
      setIsStartingGigFromChat(false)
      return
    }
    if (!selectedThread.gigId) {
      setMessage('This chat is not linked to a gig yet.')
      isStartingGigFromChatRef.current = false
      setIsStartingGigFromChat(false)
      return
    }

    let gig = gigs.find((item) => item.id === selectedThread.gigId) || null
    if (!gig) {
      try {
        const data = await fetchJSON(`/api/gigs/${selectedThread.gigId}`)
        gig = normalizeGig(data?.gig || data)
      } catch (error) {
        setMessage(error.message || 'Unable to load the gig details.')
        isStartingGigFromChatRef.current = false
        setIsStartingGigFromChat(false)
        return
      }
    }

    if (!gig) {
      setMessage('Unable to locate this gig.')
      isStartingGigFromChatRef.current = false
      setIsStartingGigFromChat(false)
      return
    }

    const existingOrder = buyerOrders.find(
      (order) => order.gigId === gig.id && order.status !== 'cancelled',
    )
    if (existingOrder) {
      setMessage('An order for this gig is already in progress.')
      isStartingGigFromChatRef.current = false
      setIsStartingGigFromChat(false)
      return
    }

    try {
      await handleCreateOrder(gig, { notes: '' })
    } finally {
      isStartingGigFromChatRef.current = false
      setIsStartingGigFromChat(false)
    }
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
    if (isSendingChatMessageRef.current) return
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
    const signature = JSON.stringify({
      threadId: selectedThread.id,
      text,
      files: composerFiles.map((file) => `${file.name}|${file.size || 0}|${file.type || ''}`),
    })
    const now = Date.now()
    if (
      lastChatSendSignatureRef.current.signature === signature &&
      now - lastChatSendSignatureRef.current.at < 3000
    ) {
      setMessage('Please wait before sending the same message again.')
      return
    }
    lastChatSendSignatureRef.current = { signature, at: now }
    isSendingChatMessageRef.current = true
    setIsSendingChatMessage(true)

    const uploadChatFiles = async (files) =>
      Promise.all(
        files.map(async (file) => {
          const fallback = {
            ...file,
            uploadedUrl: file.url || file.previewUrl || '',
            uploadedType: file.type || 'file',
          }
          if (!file?.file) return fallback
          try {
            const formData = new FormData()
            formData.append('file', file.file)
            const data = await authedFetch('/api/uploads/media', {
              method: 'POST',
              body: formData,
            })
            return {
              ...file,
              uploadedUrl: data?.url || file.previewUrl || '',
              uploadedType: file.type || data?.type || 'file',
            }
          } catch (error) {
            return fallback
          }
        }),
      )

    let uploadedFiles = []
    if (composerFiles.length > 0) {
      uploadedFiles = await uploadChatFiles(composerFiles)
      if (uploadedFiles.some((file) => !file.uploadedUrl)) {
        setMessage('Some attachments could not be uploaded. Sending preview only.')
      }
    }

    const currentUserId = user?._id || user?.id || ''
    const payloadSellerId =
      selectedThread.sellerUserId ||
      selectedGig?.sellerUserId ||
      selectedGig?.owner ||
      selectedGig?.sellerId ||
      ''
    const payloadBuyerId =
      selectedThread.buyerUserId ||
      (payloadSellerId && currentUserId !== payloadSellerId ? currentUserId : '')

    const payload = {
      text,
      files: uploadedFiles.map((file) => ({
        name: file.name,
        type: file.type || file.uploadedType || 'file',
        size: file.size || 0,
        url: file.uploadedUrl || '',
      })),
      gigId: selectedThread.gigId || selectedGig?.id || '',
      gigTitle: selectedThread.gigTitle || selectedGig?.title || '',
      sellerId: payloadSellerId,
      buyerId: payloadBuyerId || currentUserId,
      sellerName: selectedThread.sellerName || selectedGig?.seller || 'Seller',
      buyerName:
        selectedThread.buyerName ||
        (payloadBuyerId && payloadBuyerId === currentUserId ? user.name || 'Buyer' : 'Buyer'),
      participantIds: [payloadSellerId, payloadBuyerId].filter(Boolean),
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
            attachments: uploadedFiles.map((file) => ({
              id: file.id,
              name: file.name,
              type: file.type || file.uploadedType || 'file',
              sizeLabel: file.sizeLabel,
              previewUrl: file.previewUrl || file.uploadedUrl,
              url: file.uploadedUrl || file.previewUrl,
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
    } finally {
      isSendingChatMessageRef.current = false
      setIsSendingChatMessage(false)
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
    const gigId = gig.id || gig._id || ''
    const userId = user?._id || user?.id
    const isOwner =
      (gig.owner && userId && gig.owner === userId) ||
      (gig.sellerId && mySellerProfileId && gig.sellerId === mySellerProfileId) ||
      (gig.sellerId && userSellerId && gig.sellerId === userSellerId)
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
    if (gigId) {
      setChattingGigStates((prev) => ({ ...prev, [gigId]: true }))
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
    } finally {
      if (gigId) {
        setChattingGigStates((prev) => ({ ...prev, [gigId]: false }))
      }
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
    if (isAuthLoading) return
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
    if (!PASSWORD_REQUIREMENTS_REGEX.test(password)) {
      setFormErrors((prev) => ({ ...prev, signup: PASSWORD_REQUIREMENTS_MESSAGE }))
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
        setStoredVerificationEmail(emailValue)
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
      setStoredVerificationEmail(emailValue)
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
        setStoredVerificationEmail(email.trim().toLowerCase())
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
      const existingMedia = Array.isArray(gigMedia) ? gigMedia : []
      let imageCount = existingMedia.filter((item) => item.type !== 'video').length
      let videoCount = existingMedia.filter((item) => item.type === 'video').length
      let skippedImages = 0
      let skippedVideos = 0

      const accepted = uploads.filter((item) => {
        if (item.type === 'video') {
          if (videoCount >= GIG_VIDEO_LIMIT) {
            skippedVideos += 1
            return false
          }
          videoCount += 1
          return true
        }
        if (imageCount >= GIG_IMAGE_LIMIT) {
          skippedImages += 1
          return false
        }
        imageCount += 1
        return true
      })

      if (accepted.length > 0) {
        setGigMedia((prev) => [...accepted, ...prev])
      }

      const skippedParts = []
      if (skippedImages > 0) skippedParts.push(`${skippedImages} image${skippedImages === 1 ? '' : 's'}`)
      if (skippedVideos > 0) skippedParts.push(`${skippedVideos} video${skippedVideos === 1 ? '' : 's'}`)

      if (skippedParts.length > 0) {
        const skippedText = skippedParts.join(' and ')
        if (accepted.length > 0) {
          setMessage(
            `Uploaded ${accepted.length} file${accepted.length === 1 ? '' : 's'}. Skipped ${skippedText} (limit: ${GIG_IMAGE_LIMIT} images and ${GIG_VIDEO_LIMIT} videos).`,
          )
        } else {
          setMessage(
            `Upload limit reached. You can add up to ${GIG_IMAGE_LIMIT} images and ${GIG_VIDEO_LIMIT} videos.`,
          )
        }
      } else {
        setMessage('Media uploaded. Finish your gig details and submit.')
      }
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
    const imageMediaCount = gigMedia.filter((item) => item.type !== 'video').length
    const videoMediaCount = gigMedia.filter((item) => item.type === 'video').length

    if (imageMediaCount > GIG_IMAGE_LIMIT || videoMediaCount > GIG_VIDEO_LIMIT) {
      setMessage(
        `You can attach up to ${GIG_IMAGE_LIMIT} images and ${GIG_VIDEO_LIMIT} videos per gig.`,
      )
      return
    }

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
      const isEditingGig = Boolean(editingGigId)
      const endpoint = isEditingGig ? `/api/gigs/${editingGigId}` : '/api/gigs'
      const method = isEditingGig ? 'PUT' : 'POST'
      const data = await authedFetch(endpoint, {
        method,
        body: payload,
      })
      if (data?.gig) {
        const normalized = normalizeGig(data.gig)
        setGigs((prev) =>
          isEditingGig
            ? prev.map((entry) => (entry.id === normalized.id ? normalized : entry))
            : [normalized, ...prev],
        )
        ensureSellerProfile(normalized.sellerId, normalized.seller)
        setSelectedGigId(normalized.id)
        if (normalized.sellerId) setSelectedSellerId(normalized.sellerId)
        navigate(`/gig/${normalized.id}`)
      }
      setNewGig({ ...EMPTY_GIG_FORM })
      setEditingGigId('')
      setGigErrors({ title: '', category: '', price: '', packages: '' })
      setGigMedia([])
      setMessage(
        isEditingGig
          ? 'Gig updated.'
          : 'Gig published and visible on your dashboard.',
      )
    } catch (error) {
      const message =
        error.message ||
        (editingGigId
          ? 'Unable to update gig.'
          : 'Unable to create gig. Make sure your seller profile is saved.')
      setMessage(message)
    }
  }

  const handleEditGig = async (gig) => {
    if (!gig?.id) return
    if (!user || !authToken) {
      setMessage('Log in as a seller to edit gigs.')
      return
    }
    if (!user.isSeller) {
      setMessage('Switch to seller mode to edit gigs.')
      return
    }
    if (!isGigOwner(gig)) {
      setMessage('You can only edit your own gigs.')
      return
    }
    setEditingGigId(gig.id)
    setNewGig({
      title: gig.title || '',
      category: gig.category || '',
      price: gig.price ? String(gig.price) : '',
      description: gig.description || '',
      packages: Array.isArray(gig.packages)
        ? gig.packages.map((pkg, index) => ({
            id: `pkg-${gig.id}-${index}-${Math.random().toString(16).slice(2)}`,
            name: pkg.name || '',
            description: pkg.description || '',
            price: pkg.price === 0 ? '0' : String(pkg.price || ''),
          }))
        : [],
    })
    setGigMedia(
      (gig.media || []).map((item, index) => ({
        id: `media-${gig.id}-${index}-${Math.random().toString(16).slice(2)}`,
        url: item.url,
        type: item.type === 'video' ? 'video' : 'image',
        name: `${gig.title || 'gig'}-${index + 1}`,
        thumbnailUrl: item.thumbnailUrl || '',
      })),
    )
    setGigErrors({ title: '', category: '', price: '', packages: '' })
    setMessage('Edit mode opened. Update fields and save your changes.')
    navigate('/seller-tools#create-gig')
  }

  const handleDeleteGig = async (gig) => {
    if (!gig?.id) return
    if (!user || !authToken) {
      setMessage('Log in as a seller to delete gigs.')
      return
    }
    if (!user.isSeller) {
      setMessage('Switch to seller mode to delete gigs.')
      return
    }
    if (!isGigOwner(gig)) {
      setMessage('You can only delete your own gigs.')
      return
    }
    const confirmed = window.confirm(`Delete "${gig.title || 'this gig'}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await authedFetch(`/api/gigs/${gig.id}`, { method: 'DELETE' })
      setGigs((prev) => prev.filter((entry) => entry.id !== gig.id))
      if (editingGigId === gig.id) {
        setEditingGigId('')
        setNewGig({ ...EMPTY_GIG_FORM })
        setGigErrors({ title: '', category: '', price: '', packages: '' })
        setGigMedia([])
      }
      if (selectedGigId === gig.id) {
        setSelectedGigId('')
      }
      setMessage('Gig deleted.')
    } catch (error) {
      setMessage(error.message || 'Unable to delete gig.')
    }
  }

  const handleCancelEditGig = () => {
    const targetGigId = editingGigId || selectedGigId
    setEditingGigId('')
    setNewGig({ ...EMPTY_GIG_FORM })
    setGigErrors({ title: '', category: '', price: '', packages: '' })
    setGigMedia([])
    if (targetGigId) {
      setSelectedGigId(targetGigId)
      navigate(`/gig/${targetGigId}`)
    } else {
      navigate('/seller-tools#create-gig')
    }
    setMessage('Edit cancelled.')
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
  const email =
    verifyForm.email.trim().toLowerCase() || getStoredVerificationEmail().trim().toLowerCase()
  const token = verifyForm.token.trim()
  if (!token) {
    setMessage('Add the 6-digit verification code.')
    return
  }
  if (!/^\d{6}$/.test(token)) {
    setMessage('Enter the 6-digit verification code.')
    return
  }
  if (!email) {
    setMessage('Please sign in again to resend a verification code.')
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
      setVerifyForm({ email: '', token: '' })
      setStoredVerificationEmail('')
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
  const email =
    verifyForm.email.trim().toLowerCase() ||
    getStoredVerificationEmail().trim().toLowerCase() ||
    forms.signup.email ||
    forms.login.email
  if (!email) {
    setMessage('Please sign in again to resend a verification code.')
    return
  }
  try {
    setIsVerifySubmitting(true)
    await fetchJSON('/api/auth/resend-verification', {
      method: 'POST',
      body: { email },
    })
    setStoredVerificationEmail(email)
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
  if (!PASSWORD_REQUIREMENTS_REGEX.test(password)) {
    setMessage(PASSWORD_REQUIREMENTS_MESSAGE)
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
    if (field === 'country') {
      setSellerForm((prev) => ({
        ...prev,
        country: value,
        otherCountry: value === 'Others' ? prev.otherCountry : '',
      }))
      return
    }
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

  const normalizePhoneNumber = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return null
    if (/^\+\d{7,15}$/.test(raw)) return raw
    const digits = raw.replace(/\D/g, '')
    if (digits.length >= 7 && digits.length <= 15) return `+${digits}`
    return null
  }

  const handleSellerUpgrade = async (event) => {
    event.preventDefault()
    if (!user || !authToken) {
      setSellerError('Please sign in before becoming a seller.')
      return
    }
    const { fullName, displayName, description, phone, skills, languages } = sellerForm
    if (!fullName || !displayName || !description || !phone || !sellerForm.country) {
      setSellerError('Complete your name, display details, description, phone number, and country.')
      return
    }
    const selectedCountry =
      sellerForm.country === 'Others' ? sellerForm.otherCountry.trim() : sellerForm.country.trim()
    if (!selectedCountry) {
      setSellerError('Enter a country when selecting Others.')
      return
    }
    const normalizedPhone = normalizePhoneNumber(phone)
    if (!normalizedPhone) {
      setSellerError('Enter a valid phone number in international format (for example, +6591234567).')
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
      otherSocialUrl: sellerForm.otherSocial.trim(),
      phone: normalizedPhone,
      location: selectedCountry,
    }
    try {
      setSellerError('')
      setIsAuthLoading(true)
      if (sellerForm.profilePicture) {
        try {
          const formData = new FormData()
          formData.append('file', sellerForm.profilePicture)
          const upload = await authedFetch('/api/uploads/image', {
            method: 'POST',
            body: formData,
          })
          if (upload?.url) {
            payload.imageUrl = upload.url
          }
        } catch (error) {
          setSellerError(error.message || 'Unable to upload profile photo.')
        }
      }
      const data = await authedFetch('/api/profiles/me', {
        method: 'POST',
        body: payload,
      })
      if (data?.profile) {
        const normalized = normalizeProfile(data.profile)
      setSellerProfiles((prev) => {
        const others = prev.filter((profile) => {
          if (profile.id === normalized.id) return false
          if (normalized.userId && profile.userId && profile.userId === normalized.userId) return false
          return true
        })
        return [normalized, ...others]
      })
        setSelectedSellerId(normalized.id)
      }
      setUser((prev) => (prev ? { ...prev, isSeller: true, role: 'seller' } : prev))
      setSellerForm(initialSellerForm)
      setView('seller-dashboard')
      navigate('/seller-tools')
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
      setMessage('Buyer mode required to save a brief.')
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
    if (!selectedGig?.id) {
      setMessage('Open a gig listing before leaving a review.')
      return
    }
    if (!user || !authToken) {
      setMessage('Log in as a buyer to leave a review.')
      return
    }
    if (user.isSeller) {
      setMessage('Buyer mode required to leave a review.')
      return
    }
    if (!canLeaveReviewForSelectedGig) {
      setMessage('Complete this gig before leaving a review.')
      return
    }
    const ratingNumber = Number(reviewDraft.rating)
    const text = reviewDraft.text.trim()
    if (!ratingNumber || ratingNumber < 1 || ratingNumber > 5) {
      setMessage('Add a rating between 1 and 5.')
      return
    }
    if (!text) {
      setMessage('Share a quick note for this gig.')
      return
    }
    try {
      const data = await authedFetch(`/api/reviews/gig/${selectedGig.id}`, {
        method: 'POST',
        body: {
          rating: ratingNumber,
          text,
          project: reviewDraft.project.trim() || selectedGig.title || 'Gig',
        },
      })
      const newReview = data?.review
        ? normalizeReview(data.review)
        : {
            id: `rev-${Date.now()}`,
            buyerId: user._id || user.id || '',
            gigId: selectedGig.id,
            gigTitle: selectedGig.title || 'Gig',
            sellerId: selectedGig.sellerId || '',
            reviewerName: user.name || 'Buyer',
            rating: ratingNumber,
            comment: text,
            project: reviewDraft.project.trim() || selectedGig.title || 'Gig',
            createdAt: Date.now(),
          }
      setGigReviews((prev) => ({
        ...prev,
        [selectedGig.id]: [newReview, ...(prev[selectedGig.id] || [])],
      }))
      if (selectedGig.sellerId) {
        setSellerReviews((prev) => ({
          ...prev,
          [selectedGig.sellerId]: [newReview, ...(prev[selectedGig.sellerId] || [])],
        }))
      }
      setReviewDraft({ rating: 5, text: '', project: '' })
      setMessage('Review posted. Thanks for sharing feedback.')
    } catch (error) {
      const message = error.message || 'Unable to post review.'
      setMessage(message)
    }
  }

  const isWorkspaceView = view === 'dashboard' || view === 'login' || view === 'signup'
  const isSearchView = view === 'search-results'
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden">
      <TopBar
        user={user}
        unreadMessageCount={unreadTotal}
        unreadOrderCount={orderNotificationCount}
        notifications={notifications}
        notificationUnreadCount={notificationUnreadCount}
        onDashboard={goToDashboard}
        onMarketplace={goToMarketplace}
        onBecomeSeller={() => handleOpenSellerTools()}
        onLogin={openLoginModal}
        onSignup={openSignupModal}
        onChat={goToChats}
        onOrders={handleOpenBuyerOrders}
        onProfile={handleOpenProfile}
        onSellerCreateGig={handleOpenSellerCreateGig}
        onSellerDashboard={handleOpenSellerDashboard}
        onSellerProfile={handleOpenSellerPrivateProfile}
        onSellerOrders={handleOpenSellerOrders}
        onLogout={handleLogout}
        onSwitchMode={handleSwitchUserMode}
        onOpenNotification={handleOpenNotification}
        onMarkNotificationRead={markNotificationRead}
        onMarkAllNotificationsRead={markAllNotificationsRead}
      />

      {notificationToasts.length > 0 && (
        <div className="fixed right-4 top-20 z-50 space-y-2 sm:right-6">
          {notificationToasts.map((notification) => {
            const elapsed =
              Math.floor((Date.now() - (notification.createdAt || Date.now())) / 1000) +
              toastTick * 0
            const remaining = Math.max(0, 5 - elapsed)
            return (
            <div
              key={notification.id}
              className="w-[min(92vw,360px)] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => handleOpenNotification(notification)}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                    {notification.type === 'order' ? 'Order update' : 'Message'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{notification.title}</p>
                  {notification.body && <p className="mt-1 text-xs text-slate-600">{notification.body}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">Closes in {remaining}s</p>
                </button>
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => dismissNotificationToast(notification.id)}
                  aria-label="Dismiss notification"
                >
                  x
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <TimedAlert
          key={`app-message-${message || 'empty'}`}
          message={message}
          tone="info"
          onClose={() => setMessage('')}
        />
        {reviewPrompt && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-4 text-sm text-amber-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold">
                  Order complete for {reviewPrompt.gigTitle}. Leave a review on the gig listing?
                </div>
                <div className="text-xs opacity-80">Closes in {reviewPromptCountdown}s</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-purple-600 text-white hover:bg-purple-500"
                  onClick={() => {
                    if (reviewPrompt.gigId) {
                      navigate(`/gig/${reviewPrompt.gigId}`)
                    } else if (reviewPrompt.sellerId) {
                      handleOpenSellerProfile(reviewPrompt.sellerId)
                    }
                    setReviewPrompt(null)
                  }}
                >
                  Leave review
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-300 text-amber-900 hover:bg-amber-100"
                  onClick={() => setReviewPrompt(null)}
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        )}
        {showLoadingBanner && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
            Loading the latest marketplace data...
          </div>
        )}
        <TimedAlert
          key={`app-data-error-${dataError || 'empty'}`}
          message={dataError}
          tone="error"
          onClose={() => setDataError('')}
        />

        {isWorkspaceView && (
          <DashboardView
            user={user}
            buyerOrders={buyerOrders}
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
            savingGigStates={savingGigStates}
            chattingGigStates={chattingGigStates}
            onToggleFavoriteGig={handleToggleFavoriteGig}
            onGigFilterChange={handleGigFilterChange}
            onSearchSubmit={handleGigSearchSubmit}
            onClearGigFilters={handleClearGigFilters}
            onOpenBuyerOrders={handleOpenBuyerOrders}
          />
        )}

        {isSearchView && (
          <SearchResultsView
            user={user}
            gigs={gigs}
            totalGigs={totalGigs}
            gigFilters={gigFilters}
            totalPages={totalGigPages}
            formatter={formatter}
            onOpenSellerProfile={handleOpenSellerProfile}
            onOpenChat={handleOpenChatFromGig}
            onOpenGig={handleOpenGigDetail}
            favoriteGigIds={favoriteGigIds}
            savingGigStates={savingGigStates}
            chattingGigStates={chattingGigStates}
            onToggleFavoriteGig={handleToggleFavoriteGig}
            onGigFilterChange={handleGigFilterChange}
            onSearchChange={handleGigSearchChange}
            onSearchSubmit={handleGigSearchSubmit}
            onClearGigFilters={handleClearGigFilters}
          />
        )}

        {view === 'chat' && (
          <ChatView
            chatThreads={chatThreads}
            chatRoleFilter={chatRoleFilter}
            chatThreadCounts={chatThreadCounts}
            onChatRoleFilterChange={setChatRoleFilter}
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
            isStartingGig={isStartingGigFromChat}
            isSendingMessage={isSendingChatMessage}
            pendingOrderId={pendingChatOrder?._id || pendingChatOrder?.id || ''}
            onAcceptGig={handleRequestOrderAccept}
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
            gigReviewList={gigReviewList}
            formatter={formatter}
            onBackToDashboard={goToDashboard}
            onEditGig={handleEditGig}
            onDeleteGig={handleDeleteGig}
            onOpenSellerProfile={handleOpenSellerProfile}
            onOpenChat={handleOpenChatFromGig}
            onOpenRelatedGig={handleOpenGigDetail}
            relatedGigs={relatedGigs}
            isFavorited={selectedGig ? favoriteGigIds.includes(selectedGig.id) : false}
            onToggleFavorite={() => selectedGig && handleToggleFavoriteGig(selectedGig)}
            reviewDraft={reviewDraft}
            canLeaveReview={canLeaveReviewForSelectedGig}
            onReviewDraftChange={handleReviewDraftChange}
            onSubmitReview={handleSubmitReview}
            inquiryDraft={inquiryDraft}
            onInquiryChange={handleInquiryChange}
            onSubmitInquiry={() => handleSubmitInquiry(selectedGig)}
            onCreateOrder={() => handleCreateOrder(selectedGig)}
            user={user}
            userSellerId={mySellerProfileId}
          />
        )}

        {view === 'seller-profile' && (
          <SellerProfileView
            selectedSeller={selectedSeller}
            sellerRatingSummary={sellerRatingSummary}
            sellerReviewList={sellerReviewList}
            sellerPortfolio={sellerPortfolio}
            formatter={formatter}
            timeAgo={timeAgo}
            user={user}
            isOwner={selectedSellerIsOwner}
            savedGigs={savedGigs}
            savedSellers={savedSellers}
            buyerBriefs={buyerBriefs}
            onBackToPrivateProfile={handleOpenSellerPrivateProfile}
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
            buyerOrders={buyerOrders}
            reviewList={myReviewList}
            ratingSummary={myRatingSummary}
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
            onOpenBuyerOrders={handleOpenBuyerOrders}
            onRefreshSellerProfile={handleRefreshMySellerProfile}
            onUpdateSellerProfile={handleUpdateSellerProfile}
            onUpdateBuyerProfile={handleUpdateBuyerProfile}
            competencyLevels={competencyLevels}
            onOpenGigFromSaved={handleOpenGigDetail}
            onOpenSellerProfile={handleOpenSellerProfile}
            onBuyerBriefChange={handleBuyerBriefChange}
            onSubmitBuyerBrief={handleSubmitBuyerBrief}
            profileWorkspace={location.pathname === '/me/seller' ? 'seller' : 'buyer'}
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
            inputClasses={sellerInputClasses}
            categoryOptions={categoryOptions}
            myGigs={myGigs}
            formatter={formatter}
            onOpenProfile={handleOpenProfile}
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
            isEditingGig={Boolean(editingGigId)}
            onCancelEditGig={handleCancelEditGig}
            showCreateGigPanel={location.hash === '#create-gig'}
            showDashboardPanel={location.hash !== '#create-gig'}
          />
        )}

        {view === 'seller-orders' && (
          <SellerOrdersView
            user={user}
            mode="seller"
            buyerOrders={buyerOrders}
            sellerOrders={sellerOrders}
            formatter={formatter}
            onOpenGigFromOrder={handleOpenGigDetail}
            onOpenChatFromOrder={handleOpenChatFromOrder}
            onRequestOrderAccept={handleRequestOrderAccept}
            onRequestOrderCancel={handleRequestOrderCancel}
            onRequestOrderComplete={handleRequestOrderComplete}
            onOpenLogin={openLoginModal}
            onOpenSignup={openSignupModal}
            onStartApplication={startSellerApplication}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {view === 'buyer-orders' && (
          <SellerOrdersView
            user={user}
            mode="buyer"
            buyerOrders={buyerOrders}
            sellerOrders={sellerOrders}
            sellerNameById={sellerNameById}
            formatter={formatter}
            onOpenGigFromOrder={handleOpenGigDetail}
            onOpenChatFromOrder={handleOpenChatFromOrder}
            onRequestOrderCancel={handleRequestOrderCancel}
            onRequestOrderComplete={handleRequestOrderComplete}
            onOpenLogin={openLoginModal}
            onOpenSignup={openSignupModal}
            onStartApplication={startSellerApplication}
            onOpenProfile={handleOpenProfile}
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
                          showBuyerActions={!user?.isSeller}
                          formatter={formatter}
                          isSavingGig={Boolean(savingGigStates[gig.id])}
                          isOpeningChat={Boolean(chattingGigStates[gig.id])}
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
                Enter the 6-digit code from your inbox to activate your account.
              </p>
            </div>
            <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handleVerifySubmit}>
              <input
                className={`${inputClasses} sm:col-span-2`}
                placeholder="6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verifyForm.token}
                onChange={(e) =>
                  setVerifyForm((prev) => ({
                    ...prev,
                    token: e.target.value.replace(/\D/g, '').slice(0, 6),
                  }))
                }
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
