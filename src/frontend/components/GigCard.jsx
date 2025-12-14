import { gigAccentClasses } from '@/data/static'
import { ChatBubbleIcon, GlobeIcon, InstagramIcon } from '@/frontend/components/icons'

function GigCard({ gig, index = 0, formatter, onOpenSellerProfile, onOpenChat, onOpenGig }) {
  const primaryImage =
    gig.imageUrl || gig.media?.find((item) => item.type === 'image')?.url || ''
  const primaryVideo =
    !primaryImage && gig.media ? gig.media.find((item) => item.type === 'video') : null

  return (
    <article
      className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-sm"
    >
      <div className="relative h-40 overflow-hidden rounded-2xl">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={gig.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : primaryVideo ? (
          <video
            src={primaryVideo.url}
            poster={primaryVideo.thumbnailUrl || undefined}
            className="h-full w-full object-cover"
            controls
            muted
            playsInline
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${
              gigAccentClasses[index % gigAccentClasses.length]
            }`}
          />
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
          {gig.category || 'General'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{gig.title}</h3>
          <button
            type="button"
            className="text-xs font-semibold text-slate-600 underline decoration-slate-300 decoration-2 underline-offset-[6px] transition hover:text-purple-700 hover:decoration-purple-400"
            onClick={() =>
              onOpenSellerProfile?.(gig.sellerId || gig.owner || '', gig.seller)
            }
          >
            {gig.seller}
          </button>
        </div>
        <p className="text-sm text-slate-500">
          {gig.description || 'Set expectations for buyers with a concise overview.'}
        </p>
        <div className="mt-auto space-y-3">
          <div className="text-sm text-slate-500">
            <span className="text-base font-semibold text-slate-900">
              {gig.price ? formatter.format(gig.price) : 'Pricing TBD'}
            </span>
          </div>
          <button
            type="button"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-purple-200 hover:text-purple-700"
            onClick={() => onOpenGig?.(gig)}
          >
            View details
          </button>
          <div className="flex items-center gap-3">
            {gig.websiteUrl && (
              <a
                href={gig.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-purple-200 hover:text-purple-600"
                aria-label={`${gig.title} website`}
              >
                <GlobeIcon className="h-4 w-4" />
              </a>
            )}
            {gig.instagramUrl && (
              <a
                href={gig.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-purple-200 hover:text-purple-600"
                aria-label={`${gig.title} Instagram`}
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-900 transition hover:border-purple-200 hover:text-purple-600"
              onClick={() => onOpenChat?.(gig)}
              aria-label={`Chat with ${gig.seller}`}
            >
              <ChatBubbleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default GigCard
