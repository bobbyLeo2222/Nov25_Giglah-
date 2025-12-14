import { Button } from '@/components/ui/button'
import RatingStars from '@/frontend/components/RatingStars'

function GigDetailView({
  gig,
  seller,
  sellerRatingSummary,
  sellerReviewList,
  formatter,
  onBackToDashboard,
  onOpenSellerProfile,
  onOpenChat,
  onOpenRelatedGig,
  relatedGigs = [],
}) {
  if (!gig) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">Gig not found</p>
          <p className="text-sm text-slate-600">
            Pick a listing from the marketplace to view its details.
          </p>
          <Button type="button" className="bg-purple-600 text-white hover:bg-purple-500" onClick={onBackToDashboard}>
            Back to marketplace
          </Button>
        </div>
      </section>
    )
  }

  const primaryImage =
    gig.imageUrl || gig.media?.find((item) => item.type === 'image')?.url || ''
  const primaryVideo =
    !primaryImage && gig.media ? gig.media.find((item) => item.type === 'video') : null

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Gig listing</p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{gig.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">{gig.category || 'General'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{gig.status || 'Published'}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="text-slate-700" onClick={onBackToDashboard}>
            Back
          </Button>
          <Button
            type="button"
            className="bg-purple-600 text-white hover:bg-purple-500"
            onClick={() => onOpenChat?.(gig)}
          >
            Message seller
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            <div className="relative h-72 w-full overflow-hidden rounded-2xl sm:h-96">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={gig.title}
                  className="h-full w-full object-cover"
                />
              ) : primaryVideo ? (
                <video
                  src={primaryVideo.url}
                  poster={primaryVideo.thumbnailUrl || undefined}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 via-slate-50 to-amber-50 text-sm font-semibold text-slate-500">
                  Media preview
                </div>
              )}
              <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
                {formatter.format(gig.price || 0)}
              </div>
            </div>
            {gig.media?.length > 1 && (
              <div className="grid gap-3 border-t border-slate-100 bg-white p-4 sm:grid-cols-3">
                {gig.media.slice(0, 3).map((item, index) => (
                  <div key={`${item.url}-${index}`} className="overflow-hidden rounded-xl border border-slate-100">
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        poster={item.thumbnailUrl || undefined}
                        className="h-28 w-full object-cover"
                        controls
                        playsInline
                      />
                    ) : (
                      <img src={item.url} alt={`${gig.title} ${index + 1}`} className="h-28 w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Gig overview</p>
              <span className="text-xs text-slate-500">Listing ID: {gig.id}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
              {gig.description || 'Describe what buyers get, scope, timelines, and deliverables for this gig.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
              {gig.instagramUrl && (
                <a
                  href={gig.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 px-3 py-1 transition hover:border-purple-200 hover:text-purple-700"
                >
                  Instagram
                </a>
              )}
              {gig.websiteUrl && (
                <a
                  href={gig.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 px-3 py-1 transition hover:border-purple-200 hover:text-purple-700"
                >
                  Website
                </a>
              )}
            </div>
          </div>

          {relatedGigs.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Similar gigs</p>
                  <p className="text-sm font-semibold text-slate-900">More in {gig.category}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {relatedGigs.length} recommendation{relatedGigs.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {relatedGigs.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.seller}</p>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-700">
                      {item.description || 'Click to view details.'}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3 text-sm font-semibold text-slate-900">
                      <span>{item.price ? formatter.format(item.price) : 'Ask for quote'}</span>
                      <button
                        type="button"
                        className="text-purple-700 underline-offset-4 hover:underline"
                        onClick={() => onOpenRelatedGig?.(item)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Seller</p>
                <p className="text-lg font-semibold text-slate-900">{gig.seller}</p>
                <p className="text-xs text-slate-500">{seller?.location || 'Location not set'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <RatingStars rating={sellerRatingSummary.average} />
                  <span className="font-semibold text-slate-900">
                    {sellerRatingSummary.average ? `${sellerRatingSummary.average}/5` : 'No reviews yet'}
                  </span>
                  <span className="text-slate-500">
                    ({sellerRatingSummary.count} review{sellerRatingSummary.count === 1 ? '' : 's'})
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => onOpenSellerProfile?.(gig.sellerId || gig.owner || '', gig.seller)}
              >
                View seller profile
              </Button>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              {seller?.about || 'Share more about your expertise so buyers know what you offer.'}
            </p>
            {seller?.languages?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                {seller.languages.map((language) => (
                  <span key={language} className="rounded-full bg-slate-100 px-3 py-1">
                    {language}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Reviews for this seller</p>
            <div className="mt-3 space-y-3">
              {sellerReviewList.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                  This seller has no reviews yet. Be the first to leave feedback after a job.
                </p>
              )}
              {sellerReviewList.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
                      {review.project && <p className="text-xs text-slate-500">{review.project}</p>}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{review.rating}/5</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GigDetailView
