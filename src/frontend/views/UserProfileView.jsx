import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import RatingStars from '@/frontend/components/RatingStars'
import { languageOptions, southeastAsiaCountries } from '@/data/static'
import { normalizeOrderStatus, summarizeBuyerOrders } from '@/frontend/orderUtils'

function UserProfileView({
  user,
  profile,
  myGigs,
  buyerOrders = [],
  reviewList,
  ratingSummary,
  formatter,
  timeAgo,
  buyerBrief,
  buyerBriefs = [],
  favoriteGigIds = [],
  favoriteSellerIds = [],
  savedGigs = [],
  savedSellers = [],
  competencyLevels = [],
  onBackToDashboard,
  onViewPublicProfile,
  onOpenSellerTools,
  onOpenBuyerOrders,
  onRefreshSellerProfile,
  onUpdateSellerProfile,
  onOpenGigFromSaved,
  onOpenSellerProfile,
  onBuyerBriefChange,
  onSubmitBuyerBrief,
  profileWorkspace = 'auto',
}) {
  const [isEditingSeller, setIsEditingSeller] = useState(false)
  const [sellerForm, setSellerForm] = useState({
    fullName: '',
    displayName: '',
    description: '',
    country: '',
    otherCountry: '',
    phone: '',
    website: '',
    instagram: '',
    otherSocial: '',
    profilePicture: null,
    profilePictureUrl: '',
    skills: [],
    skillInput: '',
    languages: [],
    languageSelection: '',
    levelSelection: '',
  })
  const [isSavingSeller, setIsSavingSeller] = useState(false)
  const [sellerSaveMessage, setSellerSaveMessage] = useState('')
  const [isLoadingSellerProfile, setIsLoadingSellerProfile] = useState(false)

  const fillSellerForm = (source) => {
    if (!source) return
    const locationText = String(source.location || '').trim()
    let country = ''
    let otherCountry = ''
    if (locationText) {
      if (southeastAsiaCountries.includes(locationText)) {
        country = locationText
      } else {
        const locationParts = locationText
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
        const lastPart = locationParts[locationParts.length - 1] || ''
        if (southeastAsiaCountries.includes(lastPart)) {
          country = lastPart
        } else {
          country = 'Others'
          otherCountry = locationText
        }
      }
    }
    const languagesSource = source.languages && source.languages.length ? source.languages : source.languagesRaw || []
    const parsedLanguages = languagesSource.map((entry) => {
      if (entry && typeof entry === 'object' && entry.language) return entry
      if (typeof entry === 'string') {
        const match = entry.match(/^(.*)\s+\((.*)\)$/)
        if (match) return { language: match[1], level: match[2] }
        return { language: entry, level: '' }
      }
      return null
    }).filter(Boolean)
    setSellerForm({
      fullName: user?.name || source.displayName || source.name || '',
      displayName: source.displayName || source.name || user?.name || '',
      description: source.bio || source.about || source.headline || '',
      country,
      otherCountry,
      phone: source.phone || '',
      website: source.websiteUrl || source.socials?.website || '',
      instagram: source.instagramUrl || source.socials?.instagram || '',
      otherSocial: source.otherSocialUrl || source.socials?.otherSocial || '',
      profilePicture: null,
      profilePictureUrl: source.avatar || '',
      skills: source.skills || source.specialties || [],
      skillInput: '',
      languages: parsedLanguages,
      languageSelection: '',
      levelSelection: '',
    })
  }

  useEffect(() => {
    if (!isEditingSeller) {
      fillSellerForm(profile)
    }
  }, [profile, user, isEditingSeller])

  const selectedPicturePreviewUrl = useMemo(() => {
    if (!sellerForm.profilePicture) return ''
    return URL.createObjectURL(sellerForm.profilePicture)
  }, [sellerForm.profilePicture])

  useEffect(
    () => () => {
      if (selectedPicturePreviewUrl) URL.revokeObjectURL(selectedPicturePreviewUrl)
    },
    [selectedPicturePreviewUrl],
  )

  const handleSellerFormChange = (field) => (event) => {
    if (field === 'country') {
      const value = event.target.value
      setSellerForm((prev) => ({
        ...prev,
        country: value,
        otherCountry: value === 'Others' ? prev.otherCountry : '',
      }))
      return
    }
    setSellerForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSellerPictureChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setSellerForm((prev) => ({ ...prev, profilePicture: file }))
  }

  const handleAddSkill = (event) => {
    event.preventDefault()
    const skill = sellerForm.skillInput.trim()
    if (!skill) return
    if (sellerForm.skills.length >= 5) {
      setSellerSaveMessage('Add up to 5 skills only.')
      return
    }
    if (sellerForm.skills.some((existing) => existing.toLowerCase() === skill.toLowerCase())) {
      setSellerSaveMessage('Skill already added.')
      return
    }
    setSellerForm((prev) => ({
      ...prev,
      skills: [...prev.skills, skill],
      skillInput: '',
    }))
    setSellerSaveMessage('')
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
      setSellerSaveMessage('Select both a language and competency level.')
      return
    }
    if (languages.some((entry) => entry.language === languageSelection)) {
      setSellerSaveMessage('Language already added.')
      return
    }
    setSellerForm((prev) => ({
      ...prev,
      languages: [...prev.languages, { language: languageSelection, level: levelSelection }],
      languageSelection: '',
      levelSelection: '',
    }))
    setSellerSaveMessage('')
  }

  const handleRemoveLanguage = (language) => {
    setSellerForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((item) => item.language !== language),
    }))
  }

  const handleToggleEditSeller = async () => {
    if (isEditingSeller) {
      setIsEditingSeller(false)
      return
    }
    if (onRefreshSellerProfile) {
      setIsLoadingSellerProfile(true)
      const latest = await onRefreshSellerProfile()
      if (latest) fillSellerForm(latest)
      setIsLoadingSellerProfile(false)
    }
    setIsEditingSeller(true)
  }

  const handleSellerSave = async (event) => {
    event.preventDefault()
    if (!onUpdateSellerProfile) return
    const selectedCountry =
      sellerForm.country === 'Others' ? sellerForm.otherCountry.trim() : sellerForm.country.trim()
    setIsSavingSeller(true)
    setSellerSaveMessage('')
    try {
      const payload = {
        displayName: sellerForm.displayName.trim(),
        headline: sellerForm.description.trim(),
        bio: sellerForm.description.trim(),
        phone: sellerForm.phone.trim(),
        websiteUrl: sellerForm.website.trim(),
        instagramUrl: sellerForm.instagram.trim(),
        otherSocialUrl: sellerForm.otherSocial.trim(),
        skills: sellerForm.skills,
        languages: sellerForm.languages.map((entry) =>
          entry.level ? `${entry.language} (${entry.level})` : entry.language,
        ),
      }
      if (selectedCountry) {
        payload.location = selectedCountry
      }
      if (sellerForm.profilePicture) {
        payload.profilePicture = sellerForm.profilePicture
      }
      await onUpdateSellerProfile(payload)
      setSellerSaveMessage('Seller profile updated.')
      setIsEditingSeller(false)
    } catch (error) {
      setSellerSaveMessage(error.message || 'Unable to update seller profile.')
    } finally {
      setIsSavingSeller(false)
    }
  }

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">Sign in to view your profile</p>
          <p className="text-sm text-slate-600">
            This private profile shows your gigs, reviews, and account details once you&apos;re signed in.
          </p>
          <Button type="button" className="bg-purple-600 text-white hover:bg-purple-500" onClick={onBackToDashboard}>
            Back to dashboard
          </Button>
        </div>
      </section>
    )
  }

  const name = profile?.name || user.name || ''
  const roleLabel = user.isSeller ? 'Seller' : 'Buyer'
  const about = profile?.about || ''
  const headline = profile?.headline || ''
  const languages = Array.isArray(profile?.languages) ? profile.languages : []
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'ME'
  const formatLanguage = (entry) => {
    if (!entry) return ''
    if (typeof entry === 'string') return entry
    if (typeof entry === 'object') {
      const label = entry.language || entry.name || ''
      const level = entry.level ? ` (${entry.level})` : ''
      return label ? `${label}${level}` : ''
    }
    return String(entry)
  }
  const savedGigCount = favoriteGigIds.length
  const savedSellerCount = favoriteSellerIds.length
  const buyerOrderStats = useMemo(() => summarizeBuyerOrders(buyerOrders), [buyerOrders])
  const hasSellerAccount = user?.role === 'seller'
  const resolvedWorkspace =
    profileWorkspace === 'seller'
      ? 'seller'
      : profileWorkspace === 'buyer'
        ? 'buyer'
        : (user?.isSeller ? 'seller' : 'buyer')
  const isSellerMode = resolvedWorkspace === 'seller' && hasSellerAccount
  const previewName = isEditingSeller ? sellerForm.displayName.trim() || name : name
  const previewCountry = isEditingSeller
    ? (sellerForm.country === 'Others' ? sellerForm.otherCountry.trim() : sellerForm.country.trim())
    : profile?.location || ''
  const previewAbout = isEditingSeller ? sellerForm.description.trim() : about
  const previewAvatar = isEditingSeller
    ? selectedPicturePreviewUrl || sellerForm.profilePictureUrl || profile?.avatar
    : profile?.avatar
  const previewLanguageEntries = isEditingSeller ? sellerForm.languages : languages
  const sellerDescription = previewAbout || headline || ''
  const sellerSkills = isEditingSeller
    ? sellerForm.skills
    : (Array.isArray(profile?.skills) ? profile.skills : profile?.specialties || [])
  const sellerPhone = isEditingSeller ? sellerForm.phone.trim() : profile?.phone || ''
  const sellerWebsite = isEditingSeller ? sellerForm.website.trim() : profile?.websiteUrl || ''
  const sellerInstagram = isEditingSeller ? sellerForm.instagram.trim() : profile?.instagramUrl || ''
  const sellerOtherSocial = isEditingSeller ? sellerForm.otherSocial.trim() : profile?.otherSocialUrl || ''

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            {isSellerMode && (
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                Seller Private Profile
              </p>
            )}
            <h2 className="text-3xl font-semibold text-slate-900">{name}</h2>
            {isSellerMode && headline && <p className="text-base text-slate-600">{headline}</p>}
            {isSellerMode && profile?.location && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{profile.location}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isSellerMode && !hasSellerAccount ? (
              <Button type="button" className="px-5 bg-purple-600 text-white hover:bg-purple-500" onClick={onOpenSellerTools}>
                Become a seller
              </Button>
            ) : null}
            {isSellerMode && (
              <Button
                type="button"
                variant="outline"
                className="px-5 text-slate-700"
                onClick={handleToggleEditSeller}
                disabled={isLoadingSellerProfile}
              >
                {isLoadingSellerProfile
                  ? 'Loading...'
                  : isEditingSeller
                  ? 'Cancel edit'
                  : 'Edit seller info'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div className="space-y-5">
            {!isSellerMode && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Buyer profile</p>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-3">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={name}
                      className="h-12 w-12 rounded-xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">Buyer workspace</p>
                  </div>
                </div>
              </div>
            )}

            {isSellerMode && isEditingSeller && (
              <form
                className="space-y-5 rounded-2xl border border-purple-100 bg-purple-50/50 px-6 py-6 shadow-sm"
                onSubmit={handleSellerSave}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Seller info</p>
                    <p className="text-sm text-slate-600">Update your public seller details.</p>
                  </div>
                  <Button
                    type="submit"
                    className="bg-purple-600 text-white hover:bg-purple-500"
                    disabled={isSavingSeller}
                  >
                    {isSavingSeller ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile picture</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {selectedPicturePreviewUrl || sellerForm.profilePictureUrl || profile?.avatar ? (
                      <img
                        src={selectedPicturePreviewUrl || sellerForm.profilePictureUrl || profile?.avatar}
                        alt={sellerForm.displayName || name}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-purple-500"
                        onChange={handleSellerPictureChange}
                      />
                      {sellerForm.profilePicture && (
                        <p className="text-xs text-slate-600">Selected: {sellerForm.profilePicture.name}</p>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="Full name (private)"
                  value={sellerForm.fullName}
                  onChange={handleSellerFormChange('fullName')}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="Display name"
                  value={sellerForm.displayName}
                  onChange={handleSellerFormChange('displayName')}
                  required
                />
                <textarea
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="Description"
                  value={sellerForm.description}
                  onChange={handleSellerFormChange('description')}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="Personal website"
                  value={sellerForm.website}
                  onChange={handleSellerFormChange('website')}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="Instagram"
                  value={sellerForm.instagram}
                  onChange={handleSellerFormChange('instagram')}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="Other social media"
                  value={sellerForm.otherSocial}
                  onChange={handleSellerFormChange('otherSocial')}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    placeholder="Phone number"
                    value={sellerForm.phone}
                    onChange={handleSellerFormChange('phone')}
                  />
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    value={sellerForm.country}
                    onChange={handleSellerFormChange('country')}
                  >
                    <option value="">Select country</option>
                    {southeastAsiaCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                </div>
                {sellerForm.country === 'Others' && (
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    placeholder="Enter country"
                    value={sellerForm.otherCountry}
                    onChange={handleSellerFormChange('otherCountry')}
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Skills
                    </label>
                    <span className="text-xs text-slate-400">Add up to 5 skills.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="e.g., Web development"
                      value={sellerForm.skillInput}
                      onChange={handleSellerFormChange('skillInput')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={handleAddSkill}
                    >
                      Add
                    </Button>
                  </div>
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
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Languages
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={handleAddLanguage}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      value={sellerForm.languageSelection}
                      onChange={handleSellerFormChange('languageSelection')}
                    >
                      <option value="">Select language</option>
                      {languageOptions.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      value={sellerForm.levelSelection}
                      onChange={handleSellerFormChange('levelSelection')}
                    >
                      <option value="">Select level</option>
                      {competencyLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sellerForm.languages.map((entry) => (
                      <span
                        key={entry.language}
                        className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {entry.language}
                        {entry.level ? ` (${entry.level})` : ''}
                        <button
                          type="button"
                          className="text-slate-500 hover:text-slate-700"
                          onClick={() => handleRemoveLanguage(entry.language)}
                          aria-label={`Remove ${entry.language}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {sellerSaveMessage && (
                  <p className="text-xs font-semibold text-slate-600">{sellerSaveMessage}</p>
                )}
              </form>
            )}

            {isSellerMode && (
              <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Public preview</p>
                    <p className="text-base font-semibold text-slate-900">
                      {previewName || 'Your public seller profile'}
                    </p>
                    {previewCountry && <p className="text-xs text-slate-500">{previewCountry}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={onViewPublicProfile}
                  >
                    Open public profile
                  </Button>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  {previewAvatar ? (
                    <img
                      src={previewAvatar}
                      alt={previewName || name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-sm font-semibold text-slate-500">
                      {initials}
                    </div>
                  )}
                  <div className="space-y-2">
                    {previewAbout && <p className="text-sm text-slate-700">{previewAbout}</p>}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {previewLanguageEntries.map((language, index) => {
                        const label = formatLanguage(language)
                        if (!label) return null
                        const keyBase =
                          typeof language === 'string' ? language : language.language || language.name || index
                        return (
                          <span
                            key={`${keyBase}-${index}`}
                            className="rounded-full bg-white px-3 py-1 font-semibold text-slate-600"
                          >
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isSellerMode && (
              <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Seller details</p>
                  <span className="text-xs text-slate-500">Live from your private profile editor</span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">Display name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{previewName || 'Not set'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">Country</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{previewCountry || 'Not set'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">Phone</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{sellerPhone || 'Not set'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">Website</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">{sellerWebsite || 'Not set'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">Instagram</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {sellerInstagram || 'Not set'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">Other social</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {sellerOtherSocial || 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold text-slate-500">Description</p>
                  <p className="mt-1 text-sm text-slate-700">{sellerDescription || 'Not set'}</p>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
                  {sellerSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {sellerSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No skills added yet.</p>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Languages</p>
                  {previewLanguageEntries.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {previewLanguageEntries.map((language, index) => {
                        const label = formatLanguage(language)
                        if (!label) return null
                        const keyBase =
                          typeof language === 'string' ? language : language.language || language.name || index
                        return (
                          <span
                            key={`${keyBase}-${index}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No languages added yet.</p>
                  )}
                </div>
              </div>
            )}

            {isSellerMode ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <p className="text-xs font-semibold text-slate-500">Rating</p>
                  {ratingSummary.count > 0 ? (
                    <>
                      <div className="mt-2 flex items-center gap-2">
                        <RatingStars rating={ratingSummary.average} />
                        <span className="text-lg font-semibold text-slate-900">
                          {ratingSummary.average}/5
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {ratingSummary.count} review{ratingSummary.count === 1 ? '' : 's'} received
                      </p>
                    </>
                  ) : (
                    <div className="mt-2 space-y-1">
                      <p className="text-2xl font-semibold text-slate-900">—</p>
                      <p className="text-xs text-slate-500">No reviews yet</p>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <p className="text-xs font-semibold text-slate-500">Gigs published</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{myGigs.length}</p>
                  <p className="text-xs text-slate-500">Listings you created or own</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <p className="text-xs font-semibold text-slate-500">Active orders</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{buyerOrderStats.active}</p>
                  <p className="text-xs text-slate-500">Projects currently in progress</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <p className="text-xs font-semibold text-slate-500">Completed orders</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{buyerOrderStats.completed}</p>
                  <p className="text-xs text-slate-500">Finished with both confirmations</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <p className="text-xs font-semibold text-slate-500">Total orders</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{buyerOrderStats.total}</p>
                  <p className="text-xs text-slate-500">All buyer orders placed</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <p className="text-xs font-semibold text-slate-500">Estimated spend</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {formatter.format(buyerOrderStats.spend)}
                  </p>
                  <p className="text-xs text-slate-500">Based on all non-cancelled buyer orders</p>
                </div>
              </div>
            )}

            {!isSellerMode && (
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Buyer workflows</p>
                  <p className="text-base font-semibold text-slate-900">Briefs and saved lists</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Recent orders</p>
                    <span className="text-xs text-slate-500">{buyerOrderStats.total} total</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {buyerOrderStats.total === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        Your new buyer orders will appear here once you place one.
                      </p>
                    )}
                    {buyerOrders.slice(0, 3).map((order) => {
                      const status = normalizeOrderStatus(order.status)
                      return (
                        <div
                          key={order._id || order.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{order.gigTitle}</p>
                              <p className="text-xs text-slate-500">Gig ID: {order.gigId}</p>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold capitalize text-slate-700">
                              {status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                            <span>{formatter.format(Number(order.price) || 0)}</span>
                            <span>{order.updatedAt ? timeAgo(order.updatedAt) : ''}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={onOpenBuyerOrders}
                  >
                    Open all orders
                  </Button>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Saved gigs</p>
                    <span className="text-xs text-slate-500">{savedGigCount} saved</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {savedGigCount === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        Save gigs from the marketplace to review them here.
                      </p>
                    )}
                    {savedGigs.map((gig) => (
                      <div
                        key={gig.id}
                        className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{gig.title}</p>
                            <p className="text-xs text-slate-500">{gig.category || 'General'}</p>
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {gig.price ? formatter.format(gig.price) : 'Ask for quote'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3 border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => onOpenGigFromSaved?.(gig)}
                        >
                          View gig
                        </Button>
                      </div>
                    ))}
                    {savedGigCount > 0 && savedGigs.length < savedGigCount && (
                      <p className="text-xs text-slate-500">
                        Some saved gigs are outside your current feed. Refresh or search to load more.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Saved sellers</p>
                    <span className="text-xs text-slate-500">{savedSellerCount} saved</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {savedSellerCount === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        Save seller profiles to keep a shortlist.
                      </p>
                    )}
                    {savedSellers.map((seller) => (
                      <div
                        key={seller.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{seller.name}</p>
                          <p className="text-xs text-slate-500">{seller.headline}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => onOpenSellerProfile?.(seller.id, seller.name)}
                        >
                          View profile
                        </Button>
                      </div>
                    ))}
                    {savedSellerCount > 0 && savedSellers.length < savedSellerCount && (
                      <p className="text-xs text-slate-500">
                        Some saved sellers are not loaded yet. Browse the marketplace to see all profiles.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Recent briefs</p>
                  <div className="mt-3 space-y-3">
                    {buyerBriefs.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                        Saved briefs will appear here for quick reuse.
                      </p>
                    )}
                    {buyerBriefs.slice(0, 2).map((brief) => (
                      <div
                        key={brief.id}
                        className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-sm text-slate-700"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{brief.projectType}</p>
                            <p className="text-xs text-slate-500">{brief.category}</p>
                          </div>
                          <span className="text-xs text-slate-400">
                            {brief.createdAt ? timeAgo(brief.createdAt) : ''}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{brief.goals}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            )}

            {isSellerMode && (
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Feedback</p>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={ratingSummary.average} />
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {ratingSummary.average ? `${ratingSummary.average} / 5` : 'No reviews yet'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ratingSummary.count} review{ratingSummary.count === 1 ? '' : 's'} from other users
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {reviewList.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    You have not received any reviews yet. Complete gigs to collect feedback here.
                  </p>
                )}
                {reviewList.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
                        {review.project && <p className="text-xs text-slate-500">{review.project}</p>}
                      </div>
                      <span className="text-xs text-slate-400">
                        {review.createdAt ? timeAgo(review.createdAt) : ''}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <RatingStars rating={review.rating} />
                      <span className="text-sm font-semibold text-slate-900">{review.rating}/5</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                  </div>
                ))}
              </div>
              </div>
            )}

          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-inner sm:px-6 sm:py-5">
              <p className="text-base font-semibold text-slate-900">Account details</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold text-slate-900">{name}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-900">{user.email || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="text-slate-500">Mode</span>
                  <span className="font-semibold text-slate-900">{roleLabel}</span>
                </div>
                {!isSellerMode && (
                  <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                    <span className="text-slate-500">Buyer orders</span>
                    <span className="font-semibold text-slate-900">{buyerOrderStats.total}</span>
                  </div>
                )}
                {!isSellerMode && (
                  <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                    <span className="text-slate-500">Open orders</span>
                    <span className="font-semibold text-slate-900">{buyerOrderStats.active}</span>
                  </div>
                )}
                {isSellerMode && profile?.location && (
                  <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                    <span className="text-slate-500">Location</span>
                    <span className="font-semibold text-slate-900">{profile.location}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default UserProfileView
