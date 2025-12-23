import { Button } from '@/components/ui/button'
import { serviceCategories } from '@/data/static'
import GigCard from '@/frontend/components/GigCard'

function DashboardView({
  serviceSlides = [],
  currentServiceSlide = 0,
  currentSlide = null,
  onPrevSlide,
  onNextSlide,
  onSelectSlide,
  onSelectCategory,
  onShowAllCategories,
  gigs = [],
  totalGigs = 0,
  gigFilters = {},
  totalPages = 1,
  onGigFilterChange,
  onClearGigFilters,
  formatter,
  onOpenSellerProfile,
  onOpenChat,
  onOpenGig,
}) {
  return (
    <>
      <header className="rounded-3xl border border-purple-100 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
            Find gigs and freelancers instantly.
          </h1>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input
              className="w-full border-none bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              placeholder="Search for categories, freelancers and gigs..."
              value={gigFilters.search || ''}
              onChange={(event) => onGigFilterChange?.('search', event.target.value)}
            />
            <Button
              className="bg-purple-600 text-white hover:bg-purple-500"
              type="button"
              onClick={() => onGigFilterChange?.('search', gigFilters.search || '')}
            >
              Search
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Try:</span>
            {['Digital Marketing', 'AI & Data Science', 'Video Production & Editing'].map((label) => (
              <button
                key={label}
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 hover:border-purple-200 hover:text-purple-600"
                onClick={() => onGigFilterChange?.('category', label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              {serviceCategories.flatMap((group) => group.items).map((item) => (
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
      </header>

      <main className="space-y-6">
        <section className="-mx-4 md:-mx-8 lg:-mx-12">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.25),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(14,165,233,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(248,113,113,0.2),transparent_35%)]" />
            <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-200">
                    Services
                  </p>
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                    Digital & physical offers across Singapore
                  </h2>
                  <p className="text-sm text-slate-200">
                    Swipe or use the arrows to cycle through every category we cover.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:border-white/60 hover:bg-white/20"
                    onClick={() => onPrevSlide?.()}
                    aria-label="Previous service"
                  >
                    <span className="text-xl">ƒ?1</span>
                  </button>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:border-white/60 hover:bg-white/20"
                    onClick={() => onNextSlide?.()}
                    aria-label="Next service"
                  >
                    <span className="text-xl">ƒ?§</span>
                  </button>
                </div>
              </div>

              {currentSlide && (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      {currentSlide.group}
                    </div>
                    <h3 className="text-3xl font-bold leading-tight sm:text-4xl">
                      {currentSlide.label}
                    </h3>
                    <p className="text-lg text-slate-100">{currentSlide.blurb}</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                        onClick={() => onSelectCategory?.(currentSlide.label)}
                      >
                        View category
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/50 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                        onClick={() => onShowAllCategories?.()}
                      >
                        See all services
                      </button>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br p-6 shadow-lg">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br opacity-70 blur-3xl ${currentSlide.palette}`}
                      aria-hidden="true"
                    />
                    <div className="relative flex h-full flex-col justify-between gap-4 text-slate-900">
                      <div className="rounded-2xl bg-white/90 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                          Highlights
                        </p>
                        <p className="text-lg font-bold text-slate-900">{currentSlide.label}</p>
                        <p className="text-sm text-slate-600">{currentSlide.blurb}</p>
                      </div>
                      <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                          Other services in {currentSlide.group}
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                          {serviceCategories
                            .find((group) => group.title === currentSlide.group)
                            ?.items.filter((item) => item.label !== currentSlide.label)
                            .slice(0, 3)
                            .map((item) => (
                              <li key={item.label} className="flex items-center gap-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
                                <button
                                  type="button"
                                  className="text-left text-slate-800 transition hover:text-purple-600"
                                  onClick={() => onSelectCategory?.(item.label)}
                                >
                                  {item.label}
                                </button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {serviceSlides.map((slide, index) => {
                  const isActive = index === currentServiceSlide
                  return (
                    <button
                      key={slide.label}
                      type="button"
                      onClick={() => onSelectSlide?.(index)}
                      className={`h-2.5 rounded-full transition ${
                        isActive ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Go to ${slide.label}`}
                    />
                  )
                })}
              </div>
            </div>
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gigs.length === 0 && (
              <p className="text-sm text-slate-500">No gigs yet. Check back soon.</p>
            )}
            {gigs.map((gig, index) => (
              <GigCard
                key={gig.id}
                gig={gig}
                index={index}
                formatter={formatter}
                onOpenSellerProfile={onOpenSellerProfile}
                onOpenChat={onOpenChat}
                onOpenGig={onOpenGig}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

export default DashboardView
