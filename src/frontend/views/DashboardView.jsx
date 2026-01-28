import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { serviceCategories } from '@/data/static'
import aiIntroVideo from '@/videos/AI_intro_video.mp4'
import GigCard from '@/frontend/components/GigCard'

function DashboardView({
  gigs = [],
  totalGigs = 0,
  gigFilters = {},
  totalPages = 1,
  onGigFilterChange,
  onClearGigFilters,
  favoriteGigIds = [],
  onToggleFavoriteGig,
  formatter,
  onOpenSellerProfile,
  onOpenChat,
  onOpenGig,
}) {
  const categoryItems = serviceCategories.flatMap((group) => group.items)
  const heroCategoryLabel = 'Video Production & Editing'
  const heroGig = gigs.find((gig) => gig.category === heroCategoryLabel)
  const heroVideoSrc = aiIntroVideo
  const heroPoster =
    heroGig?.imageUrl || heroGig?.media?.find((item) => item.type === 'image')?.url || ''
  const [previewImage, setPreviewImage] = useState('')
  const openPreview = (url) => {
    if (url) setPreviewImage(url)
  }
  const closePreview = () => setPreviewImage('')
  const handlePreviewKey = (event, url) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openPreview(url)
    }
  }

  return (
    <>
      <main className="space-y-10">
        <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw]">
          <div className="relative overflow-hidden rounded-none bg-slate-900 text-white shadow-2xl">
            <div className="absolute inset-0">
              {heroVideoSrc ? (
                <video
                  className={`h-full w-full object-cover ${heroPoster ? 'cursor-zoom-in' : ''}`}
                  src={heroVideoSrc}
                  poster={heroPoster || undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden={!heroPoster}
                  aria-label={heroPoster ? 'Open hero image' : undefined}
                  role={heroPoster ? 'button' : undefined}
                  tabIndex={heroPoster ? 0 : undefined}
                  onClick={heroPoster ? () => openPreview(heroPoster) : undefined}
                  onKeyDown={heroPoster ? (event) => handlePreviewKey(event, heroPoster) : undefined}
                />
              ) : heroPoster ? (
                <img
                  className="h-full w-full object-cover cursor-zoom-in"
                  src={heroPoster}
                  alt=""
                  loading="lazy"
                  aria-hidden={false}
                  aria-label="Open hero image"
                  role="button"
                  tabIndex={0}
                  onClick={() => openPreview(heroPoster)}
                  onKeyDown={(event) => handlePreviewKey(event, heroPoster)}
                />
              ) : (
                <div className="h-full w-full bg-slate-900" aria-hidden="true" />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/30" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.35),transparent_45%),radial-gradient(circle_at_75%_20%,rgba(94,234,212,0.3),transparent_45%)]" />
            <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-10 lg:p-14">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
                  GigLah! Marketplace
                </p>
                <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                  We find you the best freelancers.
                </h1>
                <p className="text-sm text-slate-200 sm:text-base">
                  Find video editors, developers, photographers, and service pros across Singapore.
                </p>
              </div>

              <div className="flex w-full max-w-2xl flex-col gap-3">
                <div className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 shadow-lg shadow-slate-950/20 backdrop-blur">
                  <input
                    className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-base"
                    placeholder="Search for any service..."
                    value={gigFilters.search || ''}
                    onChange={(event) => onGigFilterChange?.('search', event.target.value)}
                  />
                  <Button
                    type="button"
                    className="h-11 w-11 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => onGigFilterChange?.('search', gigFilters.search || '')}
                    aria-label="Search"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-3.5-3.5" />
                    </svg>
                  </Button>
                </div>
                <div />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categories
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">Browse by category</h2>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-purple-700 hover:underline"
              onClick={() => onGigFilterChange?.('category', '')}
            >
              View all
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {categoryItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-purple-200 hover:bg-white hover:shadow-sm"
                onClick={() => onGigFilterChange?.('category', item.label)}
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.blurb}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">All gigs</p>
              <h2 className="text-2xl font-semibold text-slate-900">Fresh listings</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{totalGigs} live gigs</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-purple-200 hover:text-purple-700"
                  onClick={() =>
                    onGigFilterChange?.('page', Math.max(1, (gigFilters.page || 1) - 1))
                  }
                  disabled={(gigFilters.page || 1) <= 1}
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-slate-700">
                  Page {gigFilters.page || 1} / {totalPages}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-purple-200 hover:text-purple-700"
                  onClick={() =>
                    onGigFilterChange?.('page', Math.min(totalPages, (gigFilters.page || 1) + 1))
                  }
                  disabled={(gigFilters.page || 1) >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={gigFilters.sort || 'newest'}
                onChange={(event) => onGigFilterChange?.('sort', event.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min price</label>
              <input
                type="number"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={gigFilters.minPrice || ''}
                placeholder="0"
                onChange={(event) => onGigFilterChange?.('minPrice', event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max price</label>
              <input
                type="number"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={gigFilters.maxPrice || ''}
                placeholder="5000"
                onChange={(event) => onGigFilterChange?.('maxPrice', event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={gigFilters.category || ''}
                onChange={(event) => onGigFilterChange?.('category', event.target.value)}
              >
                <option value="">All</option>
                {categoryItems.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              Showing {gigs.length} of {totalGigs} gigs
            </span>
            <button
              type="button"
              className="text-sm font-semibold text-purple-700 hover:underline"
              onClick={() => onClearGigFilters?.()}
            >
              Clear filters
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gigs.length === 0 && (
              <p className="text-sm text-slate-500">No gigs yet. Check back soon.</p>
            )}
            {gigs.map((gig, index) => (
              <GigCard
                key={gig.id}
                gig={gig}
                index={index}
                isFavorited={favoriteGigIds.includes(gig.id)}
                onToggleFavorite={() => onToggleFavoriteGig?.(gig)}
                formatter={formatter}
                onOpenSellerProfile={onOpenSellerProfile}
                onOpenChat={onOpenChat}
                onOpenGig={onOpenGig}
                onPreviewImage={openPreview}
              />
            ))}
          </div>
        </section>
      </main>
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[85vh] max-w-[92vw] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-[92vw] object-contain"
              onClick={(event) => event.stopPropagation()}
            />
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-white"
              onClick={closePreview}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default DashboardView
