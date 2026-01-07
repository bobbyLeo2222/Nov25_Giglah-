import { Button } from '@/components/ui/button'
import RatingStars from '@/frontend/components/RatingStars'

function SellerProfileView({
  selectedSeller,
  sellerRatingSummary,
  sellerReviewList,
  reviewDraft,
  sellerPortfolio,
  formatter,
  timeAgo,
  user,
  canViewAnalytics = false,
  onOpenAnalytics,
  isOwner = false,
  savedGigs = [],
  savedSellers = [],
  buyerBriefs = [],
  onBackToDashboard,
  onSubmitReview,
  onReviewDraftChange,
  onOpenChatFromGig,
  onOpenGigFromProfile,
  isSellerFavorited = false,
  onToggleFavoriteSeller,
}) {
  if (!selectedSeller) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">Seller not found</p>
          <p className="text-sm text-slate-500">
            Pick a seller from the marketplace to view their profile and reviews.
          </p>
        </div>
      </section>
    )
  }

  const numberFormatter = new Intl.NumberFormat('en-SG')
  const projectsCount = numberFormatter.format(selectedSeller.stats?.projects ?? 0)
  const savedGigCount = savedGigs.length
  const savedSellerCount = savedSellers.length
  const responseTime = selectedSeller.stats?.response || '—'
  const repeatClients = selectedSeller.stats?.repeat || '—'
  const formatLanguage = (entry) => {
    if (!entry) return ''
    if (typeof entry === 'string') return entry
    if (typeof entry === 'object') {
      const name = entry.language || entry.name || ''
      const level = entry.level ? ` (${entry.level})` : ''
      return name ? `${name}${level}` : ''
    }
    return String(entry)
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Seller profile</p>
            <h2 className="text-2xl font-semibold text-slate-900">{selectedSeller.name}</h2>
            <p className="text-sm text-slate-600">{selectedSeller.headline}</p>
            <p className="text-sm text-slate-500">{selectedSeller.location}</p>
            <div className="flex flex-wrap gap-2 sm:hidden">
              <Button variant="outline" className="text-sm text-slate-600" onClick={onBackToDashboard}>
                Back
              </Button>
              {canViewAnalytics && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-sm border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => onOpenAnalytics?.()}
                >
                  Analytics
                </Button>
              )}
              <Button
                variant="outline"
                className={`text-sm ${isSellerFavorited ? 'border-rose-200 text-rose-700' : 'text-slate-700'}`}
                onClick={() => onToggleFavoriteSeller?.()}
              >
                {isSellerFavorited ? 'Saved seller' : 'Save seller'}
              </Button>
              {!isOwner && (
                <Button
                  className="flex-1 bg-purple-600 text-white hover:bg-purple-500"
                  onClick={() =>
                    onOpenChatFromGig(
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
              )}
            </div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <Button variant="outline" className="text-sm text-slate-600" onClick={onBackToDashboard}>
              Back
            </Button>
            {canViewAnalytics && (
              <Button
                type="button"
                variant="outline"
                className="text-sm border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => onOpenAnalytics?.()}
              >
                Analytics
              </Button>
            )}
            <Button
              variant="outline"
              className={`text-sm ${isSellerFavorited ? 'border-rose-200 text-rose-700' : 'text-slate-700'}`}
              onClick={() => onToggleFavoriteSeller?.()}
            >
              {isSellerFavorited ? 'Saved seller' : 'Save seller'}
            </Button>
            {!isOwner && (
              <Button
                type="button"
                className="bg-purple-600 text-white hover:bg-purple-500"
                onClick={() =>
                  onOpenChatFromGig(
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
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <img src={selectedSeller.avatar} alt={selectedSeller.name} className="h-16 w-16 rounded-2xl object-cover" />
              <div className="space-y-2">
                <p className="text-sm text-slate-600">{selectedSeller.about}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {isOwner && (
                    <span className="rounded-full bg-purple-100 px-3 py-1 font-semibold text-purple-700">
                      {selectedSeller.availability}
                    </span>
                  )}
                  {selectedSeller.languages.map((language, index) => {
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Rating</p>
                <div className="mt-2 flex items-center gap-2">
                  <RatingStars rating={sellerRatingSummary.average} />
                  <span className="text-base font-semibold text-slate-900">
                    {sellerRatingSummary.average ? `${sellerRatingSummary.average}/5` : 'No reviews'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {numberFormatter.format(sellerRatingSummary.count)} review{sellerRatingSummary.count === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Projects</p>
                <p className="text-2xl font-semibold text-slate-900">{projectsCount}</p>
                <p className="text-xs text-slate-500">Completed engagements</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Response time</p>
                <p className="text-2xl font-semibold text-slate-900">{responseTime}</p>
                <p className="text-xs text-slate-500">Avg first reply</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Repeat clients</p>
                <p className="text-2xl font-semibold text-slate-900">{repeatClients}</p>
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
                  <span key={item} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-900">Languages</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSeller.languages.map((language, index) => {
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
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-purple-100 via-slate-50 to-white p-5 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Availability</p>
              <p className="mt-2 text-sm text-slate-700">
                {selectedSeller.availability || 'Update availability so buyers can plan with you.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {sellerPortfolio.slice(0, 3).map((gig) => (
                  <span key={gig.id} className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
                    {gig.title}
                  </span>
                ))}
                {sellerPortfolio.length === 0 && (
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-500">
                    No gigs listed yet
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedSeller.socials?.website && (
                  <a
                    href={selectedSeller.socials.website}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-white"
                  >
                    Website
                  </a>
                )}
                {selectedSeller.socials?.instagram && (
                  <a
                    href={selectedSeller.socials.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-white"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Services</p>
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
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-200 text-slate-800 hover:bg-slate-50"
                      onClick={() => onOpenGigFromProfile?.(gig)}
                    >
                      View gig
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => onOpenChatFromGig(gig)}
                    >
                      Enquire
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isOwner && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Your extras</p>
                <p className="text-base font-semibold text-slate-900">Saved items and buyer activity</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                Visible to you only
              </span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">Saved gigs</p>
                  <span className="text-xs text-slate-500">{savedGigCount} saved</span>
                </div>
                <div className="mt-3 space-y-3">
                  {savedGigCount === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                      Save gigs you want to revisit later.
                    </p>
                  )}
                  {savedGigs.map((gig) => (
                    <div
                      key={gig.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{gig.title}</p>
                        <p className="text-xs text-slate-500">{gig.category || 'General'}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {gig.price ? formatter.format(gig.price) : 'Ask for quote'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">Saved sellers</p>
                  <span className="text-xs text-slate-500">{savedSellerCount} saved</span>
                </div>
                <div className="mt-3 space-y-3">
                  {savedSellerCount === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                      Save sellers to keep your shortlist.
                    </p>
                  )}
                  {savedSellers.map((seller) => (
                    <div
                      key={seller.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{seller.name}</p>
                        <p className="text-xs text-slate-500">{seller.headline}</p>
                      </div>
                      <span className="text-xs text-slate-500">{seller.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Recent buyer briefs</p>
                <div className="mt-3 space-y-3">
                  {buyerBriefs.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                      Your saved project briefs will appear here.
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

        <div className="space-y-4 lg:grid lg:grid-cols-[1.5fr_1fr] lg:gap-4 lg:space-y-0">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Reviews</p>
                <div className="flex items-center gap-3">
                  <RatingStars rating={sellerRatingSummary.average} />
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {sellerRatingSummary.average ? `${sellerRatingSummary.average} / 5` : 'No reviews yet'}
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
                onClick={onBackToDashboard}
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
                <div key={review.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
                      {review.project && <p className="text-xs text-slate-500">{review.project}</p>}
                    </div>
                    <span className="text-xs text-slate-400">{review.createdAt ? timeAgo(review.createdAt) : ''}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RatingStars rating={review.rating} />
                    <span className="text-sm font-semibold text-slate-900">{review.rating}/5</span>
                    {review.isVerified && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Verified buyer
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {!isOwner && (
            <form className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm" onSubmit={onSubmitReview}>
              <p className="text-sm font-semibold text-slate-900">Leave a review</p>
              <p className="text-xs text-slate-500">Share a rating and note to help other buyers choose confidently.</p>
              <div className="mt-3 space-y-3">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Rating</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    value={reviewDraft.rating}
                    onChange={onReviewDraftChange('rating')}
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} star{rating === 1 ? '' : 's'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Project or gig</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    placeholder="e.g., AI chatbot rollout"
                    value={reviewDraft.project}
                    onChange={onReviewDraftChange('project')}
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Review</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    placeholder="What went well? How was the communication and delivery?"
                    value={reviewDraft.text}
                    onChange={onReviewDraftChange('text')}
                  />
                </div>
                <Button type="submit" className="w-full bg-purple-600 text-white hover:bg-purple-500">
                  Post review
                </Button>
                {!user && <p className="text-xs font-semibold text-amber-600">Log in to post a review.</p>}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default SellerProfileView
