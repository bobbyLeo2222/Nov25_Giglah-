import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { serviceCategories } from '@/data/static'
import GigCard from '@/frontend/components/GigCard'

function SearchResultsView({
  user,
  gigs = [],
  totalGigs = 0,
  gigFilters = {},
  totalPages = 1,
  onGigFilterChange,
  onClearGigFilters,
  favoriteGigIds = [],
  onToggleFavoriteGig,
  savingGigStates = {},
  chattingGigStates = {},
  formatter,
  onOpenSellerProfile,
  onOpenChat,
  onOpenGig,
  onSearchSubmit,
}) {
  const categoryItems = serviceCategories.flatMap((group) => group.items)
  const [previewImage, setPreviewImage] = useState('')
  const [searchInput, setSearchInput] = useState(gigFilters.search || '')
  const openPreview = (url) => {
    if (url) setPreviewImage(url)
  }
  const closePreview = () => setPreviewImage('')
  const searchLabel = (gigFilters.search || '').trim()

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    onSearchSubmit?.(searchInput)
  }
  const handleSearchSubmit = () => {
    onSearchSubmit?.(searchInput)
  }

  useEffect(() => {
    setSearchInput(gigFilters.search || '')
  }, [gigFilters.search])

  return (
    <>
      <main className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search results
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                {searchLabel ? `Results for \"${searchLabel}\"` : 'Search gigs'}
              </h1>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-purple-700 hover:underline"
              onClick={() => onClearGigFilters?.()}
            >
              Clear filters
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-full bg-slate-100 px-4 py-3">
            <input
              className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-base"
              placeholder="Search for any service..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <Button
              type="button"
              className="h-11 w-11 rounded-full bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleSearchSubmit}
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

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              Showing {gigs.length} of {totalGigs} gigs
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                Filter results
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">Gigs</h2>
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gigs.length === 0 && (
              <p className="text-sm text-slate-500">No gigs match this search yet.</p>
            )}
            {gigs.map((gig, index) => (
              <GigCard
                key={gig.id}
                gig={gig}
                index={index}
                showBuyerActions={!user?.isSeller}
                isFavorited={favoriteGigIds.includes(gig.id)}
                isSavingGig={Boolean(savingGigStates[gig.id])}
                isOpeningChat={Boolean(chattingGigStates[gig.id])}
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

export default SearchResultsView
