import { Button } from '@/components/ui/button'

function SellerGigCreateView({
  user,
  userGigCount,
  userSellerId,
  inputClasses,
  newGig,
  gigMedia,
  isUploadingMedia,
  myGigs,
  formatter,
  onOpenSellerProfile,
  onOpenLogin,
  onOpenSignup,
  onStartApplication,
  onGigChange,
  onGigFiles,
  onRemoveGigMedia,
  onCreateGig,
}) {
  return (
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h10m-7 5h14" />
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
              onClick={() => onOpenSellerProfile(userSellerId, user.name)}
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
            <Button type="button" className="bg-purple-600 text-white hover:bg-purple-500" onClick={onOpenLogin}>
              Log in
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={onOpenSignup}
            >
              Create account
            </Button>
          </div>
        </div>
      )}

      {user && !user.isSeller && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 px-5 py-4 text-sm text-slate-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready to earn?</p>
            <p className="text-base font-semibold text-slate-900">Switch this account to seller mode.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border border-purple-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-700 hover:bg-purple-50"
            onClick={onStartApplication}
          >
            Start application
          </Button>
        </div>
      )}

      {user?.isSeller && (
        <div className="mt-6 space-y-6">
          <form className="space-y-4" onSubmit={onCreateGig}>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className={inputClasses}
                placeholder="Gig title"
                value={newGig.title}
                onChange={onGigChange('title')}
              />
              <input
                className={inputClasses}
                placeholder="Category"
                value={newGig.category}
                onChange={onGigChange('category')}
              />
            </div>
            <input
              type="number"
              className={inputClasses}
              placeholder="Price (SGD)"
              value={newGig.price}
              onChange={onGigChange('price')}
            />
            <textarea
              rows={4}
              className={`${inputClasses} resize-none`}
              placeholder="Describe your deliverables and timeline."
              value={newGig.description}
              onChange={onGigChange('description')}
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
                    onChange={onGigFiles}
                  />
                  Upload
                </label>
              </div>
              {isUploadingMedia && <p className="text-xs font-semibold text-slate-600">Uploading media…</p>}
              {gigMedia.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {gigMedia.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-xl border border-white/60 bg-white"
                    >
                      {item.type === 'video' ? (
                        <video src={item.url} className="h-36 w-full object-cover" controls muted playsInline />
                      ) : (
                        <img src={item.url} alt={item.name} className="h-36 w-full object-cover" />
                      )}
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-[11px] font-semibold uppercase text-slate-600">{item.type}</span>
                        <button
                          type="button"
                          className="text-xs font-semibold text-rose-600 opacity-0 transition group-hover:opacity-100"
                          onClick={() => onRemoveGigMedia(item.id)}
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
              {myGigs.length === 0 && <p>No gigs yet. Publish your first listing above.</p>}
              {myGigs.map((gig) => (
                <div
                  key={gig.id}
                  className="flex flex-wrap items-center justify-between rounded-xl border border-white/60 bg-white px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{gig.title}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatter.format(gig.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default SellerGigCreateView
