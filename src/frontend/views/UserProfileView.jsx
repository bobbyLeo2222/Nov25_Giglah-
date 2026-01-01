import { Button } from '@/components/ui/button'
import RatingStars from '@/frontend/components/RatingStars'

function UserProfileView({
  user,
  profile,
  myGigs,
  reviewList,
  ratingSummary,
  orders = [],
  formatter,
  timeAgo,
  buyerBrief,
  buyerBriefs = [],
  favoriteGigIds = [],
  favoriteSellerIds = [],
  savedGigs = [],
  savedSellers = [],
  onBackToDashboard,
  onViewPublicProfile,
  onOpenSellerTools,
  onOpenChatFromGig,
  onOpenGigFromOrder,
  onOpenGigFromSaved,
  onOpenSellerProfile,
  onRequestOrderCancel,
  onRequestOrderComplete,
  onBuyerBriefChange,
  onSubmitBuyerBrief,
}) {
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

  const name = profile?.name || user.name || 'Your profile'
  const roleLabel = user.isSeller ? 'Seller' : 'Buyer'
  const about =
    profile?.about ||
    (user.isSeller
      ? 'Tell buyers what you specialise in and how you work.'
      : 'Add a short bio so sellers know what you need.')
  const savedGigCount = favoriteGigIds.length
  const savedSellerCount = favoriteSellerIds.length

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Private profile</p>
            <h2 className="text-3xl font-semibold text-slate-900">{name}</h2>
            <p className="text-base text-slate-600">
              {profile?.headline ||
                (user.isSeller
                  ? 'Your seller snapshot, only visible to you.'
                  : 'Your buyer profile keeps your details in one place.')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
              <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">{roleLabel} mode</span>
              {user.email && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{user.email}</span>
              )}
              {profile?.location && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{profile.location}</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="px-5 text-slate-700" onClick={onBackToDashboard}>
              Dashboard
            </Button>
            {user.isSeller ? (
              <Button type="button" className="px-5 bg-purple-600 text-white hover:bg-purple-500" onClick={onViewPublicProfile}>
                View public profile
              </Button>
            ) : (
              <Button type="button" className="px-5 bg-purple-600 text-white hover:bg-purple-500" onClick={onOpenSellerTools}>
                Become a seller
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5">
              <img
                src={profile?.avatar}
                alt={name}
                className="h-20 w-20 rounded-2xl object-cover shadow-sm"
              />
              <div className="space-y-2">
                <p className="text-base text-slate-700">{about}</p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  {profile?.languages?.length ? (
                    profile.languages.map((language) => (
                      <span key={language} className="rounded-full bg-white px-3 py-1 text-slate-700">
                        {language}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-white px-3 py-1 text-slate-500">
                      Add your languages to help with matching
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Rating</p>
                <div className="mt-2 flex items-center gap-2">
                  <RatingStars rating={ratingSummary.average} />
                  <span className="text-lg font-semibold text-slate-900">
                    {ratingSummary.average ? `${ratingSummary.average}/5` : 'No reviews yet'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {ratingSummary.count} review{ratingSummary.count === 1 ? '' : 's'} received
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Gigs published</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{myGigs.length}</p>
                <p className="text-xs text-slate-500">Listings you created or own</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Mode</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{roleLabel}</p>
                <p className="text-sm text-slate-600">
                  Switch any time - {user.isSeller ? 'build your listings' : 'start selling to add gigs'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Buyer workflows</p>
                  <p className="text-base font-semibold text-slate-900">Briefs and saved lists</p>
                </div>
                {user.isSeller && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                    Switch to buyer mode to submit
                  </span>
                )}
              </div>

              <div className="mt-4">
                <form
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 shadow-sm"
                  onSubmit={onSubmitBuyerBrief}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Project intake brief</p>
                    <span className="text-xs text-slate-500">{buyerBriefs.length} saved</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="Project type (e.g. Brand refresh, 30s video)"
                      value={buyerBrief?.projectType || ''}
                      onChange={onBuyerBriefChange?.('projectType')}
                    />
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="Category"
                      value={buyerBrief?.category || ''}
                      onChange={onBuyerBriefChange?.('category')}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                        placeholder="Budget range"
                        value={buyerBrief?.budget || ''}
                        onChange={onBuyerBriefChange?.('budget')}
                      />
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                        placeholder="Ideal timeline"
                        value={buyerBrief?.timeline || ''}
                        onChange={onBuyerBriefChange?.('timeline')}
                      />
                    </div>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="Goals, success metrics, and must-haves"
                      value={buyerBrief?.goals || ''}
                      onChange={onBuyerBriefChange?.('goals')}
                    />
                    <textarea
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="Notes for the seller (optional)"
                      value={buyerBrief?.notes || ''}
                      onChange={onBuyerBriefChange?.('notes')}
                    />
                    <Button type="submit" className="w-full bg-purple-600 text-white hover:bg-purple-500">
                      Save brief
                    </Button>
                  </div>
                </form>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
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

            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Your gigs</p>
                  <p className="text-base font-semibold text-slate-900">Work you have listed or completed</p>
                </div>
                <span className="text-xs text-slate-500">
                  {myGigs.length} gig{myGigs.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {myGigs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    You haven&apos;t published gigs yet. Create one to showcase your services.
                  </div>
                )}
                {myGigs.map((gig) => (
                  <div
                    key={gig.id}
                    className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{gig.title}</p>
                        <p className="text-sm text-slate-500">{gig.category || 'Uncategorised'}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        {gig.status || 'Published'}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-700">
                      {gig.description || 'Describe what buyers get from this gig.'}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-lg font-semibold text-slate-900">
                        {gig.price ? formatter.format(gig.price) : 'Ask for quote'}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => onOpenChatFromGig(gig)}
                      >
                        Open chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
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
                <Button
                  type="button"
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={user.isSeller ? onViewPublicProfile : onOpenSellerTools}
                >
                  {user.isSeller ? 'Preview public view' : 'Create your first gig'}
                </Button>
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

            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Orders</p>
                  <p className="text-base font-semibold text-slate-900">Your recent orders</p>
                </div>
                <span className="text-xs text-slate-500">
                  {orders.length} order{orders.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {orders.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    No orders yet. Message a seller and place your first order.
                  </p>
                )}
                {orders.map((order) => {
                  const orderId = order._id || order.id
                  const userId = user?._id || user?.id
                  const isBuyer = order.buyer?.toString?.() === userId || order.buyer === userId
                  const isSeller = order.seller?.toString?.() === userId || order.seller === userId
                  const yourCompleted = Boolean(
                    isBuyer ? order.buyerCompletedAt : isSeller ? order.sellerCompletedAt : false,
                  )
                  return (
                    <div
                      key={orderId}
                      className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                    >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{order.gigTitle}</p>
                        <p className="text-xs text-slate-500">Gig ID: {order.gigId}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                      <span>{formatter.format(order.price || 0)}</span>
                      {order.deliveryDate && (
                        <span className="text-xs text-slate-500">
                          Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {order.cancelReason && (
                      <p className="mt-2 text-sm text-rose-700">
                        Cancelled{order.cancelledBy ? ` by ${order.cancelledBy}` : ''}: {order.cancelReason}
                      </p>
                    )}
                    {(order.buyerCompletedAt || order.sellerCompletedAt) &&
                      order.status !== 'complete' &&
                      order.status !== 'cancelled' && (
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          Awaiting other party confirmation.
                        </p>
                      )}
                    {order.notes && <p className="mt-2 text-sm text-slate-700">{order.notes}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-800 hover:bg-slate-50"
                        onClick={() => onOpenGigFromOrder?.({ id: order.gigId })}
                      >
                        View gig
                      </Button>
                      {order.status !== 'complete' && order.status !== 'cancelled' && (
                        <>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onRequestOrderComplete?.(order._id || order.id)}
                        disabled={yourCompleted}
                      >
                        {yourCompleted ? 'Completion recorded' : 'Mark complete'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        onClick={() => onRequestOrderCancel?.(order._id || order.id)}
                        >
                          Cancel
                        </Button>
                        </>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5 shadow-inner">
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
                  <span className="text-slate-500">Role</span>
                  <span className="font-semibold text-slate-900">{roleLabel}</span>
                </div>
                {profile?.location && (
                  <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                    <span className="text-slate-500">Location</span>
                    <span className="font-semibold text-slate-900">{profile.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-amber-50 px-6 py-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Keep your profile fresh
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Add languages, upload a seller profile, and publish gigs so buyers can see what you offer.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={user.isSeller ? onViewPublicProfile : onOpenSellerTools}
                >
                  {user.isSeller ? 'Review public profile' : 'Become a seller'}
                </Button>
                <Button
                  type="button"
                  className="bg-purple-600 text-white hover:bg-purple-500"
                  onClick={onBackToDashboard}
                >
                  Browse marketplace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default UserProfileView
