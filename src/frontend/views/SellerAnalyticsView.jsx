import { Button } from '@/components/ui/button'

const formatPercent = (value) => `${Math.round((value || 0) * 100)}%`
const formatHours = (value) => (value ? `${value}h` : '—')

function SellerAnalyticsView({
  user,
  analytics,
  isLoading,
  error,
  rangeDays = 30,
  slaHours = 24,
  onBackToDashboard,
  onOpenProfile,
  onOpenPublicProfile,
  onRefresh,
}) {
  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900">Sign in to view analytics</p>
          <p className="text-sm text-slate-600">
            Analytics are available for sellers once you are signed in.
          </p>
          <Button type="button" className="bg-purple-600 text-white hover:bg-purple-500" onClick={onBackToDashboard}>
            Back to Marketplace
          </Button>
        </div>
      </section>
    )
  }

  const totals = analytics?.totals || {}
  const response = analytics?.response || {}

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Seller analytics</p>
          <h2 className="text-3xl font-semibold text-slate-900">Performance dashboard</h2>
          <p className="text-sm text-slate-600">
            Tracking the last {rangeDays} days. SLA window: {slaHours}h.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="px-5 text-slate-700" onClick={onBackToDashboard}>
            Marketplace
          </Button>
          <Button variant="outline" className="px-5 text-slate-700" onClick={onOpenProfile}>
            Private profile
          </Button>
          <Button variant="outline" className="px-5 text-slate-700" onClick={onOpenPublicProfile}>
            Public profile
          </Button>
          <Button type="button" className="px-5 bg-purple-600 text-white hover:bg-purple-500" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
            Loading seller analytics...
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Views</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.views || 0}</p>
          <p className="text-xs text-slate-500">Gig detail views</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Messages</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.messagesReceived || 0}</p>
          <p className="text-xs text-slate-500">Buyer messages received</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Orders</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.orders || 0}</p>
          <p className="text-xs text-slate-500">Orders created</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Conversion</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatPercent(totals.conversionRate)}
          </p>
          <p className="text-xs text-slate-500">Orders per view</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Response health</p>
              <p className="text-base font-semibold text-slate-900">Buyer response rate</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              SLA {slaHours}h
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold text-slate-500">Response rate</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatPercent(response.responseRate)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold text-slate-500">Avg response</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatHours(response.avgResponseHours)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold text-slate-500">SLA met</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {response.respondedWithinSla || 0}/{response.buyerMessages || 0}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600">
            Replying within {slaHours} hours keeps your response rate high and lifts conversion.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Message flow</p>
          <p className="text-base font-semibold text-slate-900">Inbound vs outbound</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-slate-500">Buyer messages</span>
              <span className="font-semibold text-slate-900">{response.buyerMessages || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-slate-500">Your replies</span>
              <span className="font-semibold text-slate-900">{totals.messagesSent || 0}</span>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600">
            Keep replies consistent to improve your SLA compliance and close rate.
          </div>
        </div>
      </div>
    </section>
  )
}

export default SellerAnalyticsView
