import { Button } from '@/components/ui/button'
import { formatChatTime, timeAgo } from '@/frontend/helpers'

function ChatView({
  chatThreads = [],
  chatSearch = '',
  onSearchChange,
  visibleThreads = [],
  selectedThreadId = '',
  onSelectThread,
  selectedThread = null,
  composerText = '',
  onComposerChange,
  composerFiles = [],
  onComposerFiles,
  onRemoveComposerFile,
  onSendMessage,
  onViewGig,
  onStartGig,
  pendingOrderId = '',
  onAcceptGig,
  isOwnGig = false,
  onTyping,
  user,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Inbox</p>
        <h2 className="text-2xl font-semibold text-slate-900">Messages with freelancers</h2>
        <p className="text-sm text-slate-500">
          Open a gig card and tap Chat to jump into a conversation with the seller.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex h-[70vh] flex-col rounded-2xl bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Threads</p>
            <span className="text-xs text-slate-500">{chatThreads.length} active</span>
          </div>
          <div className="mt-3">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
              placeholder="Search by gig, seller, or buyer"
              value={chatSearch}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </div>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {visibleThreads.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-3 py-4 text-sm text-slate-500">
                No conversations yet. Open a gig and hit Chat to reach the seller.
              </p>
            )}
            {visibleThreads.map((thread) => {
              const lastMessage = thread.messages[thread.messages.length - 1]
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelectThread?.(thread.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    selectedThreadId === thread.id
                      ? 'border-purple-300 bg-white shadow-sm'
                      : 'border-slate-100 bg-white/70 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{thread.gigTitle}</p>
                      <p className="text-xs text-slate-500">{thread.sellerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {thread.unreadCount > 0 && (
                        <span className="rounded-full bg-purple-600 px-2 py-[2px] text-[10px] font-semibold text-white">
                          {thread.unreadCount}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{timeAgo(thread.lastUpdatedAt)}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {lastMessage
                      ? lastMessage.text ||
                        lastMessage.attachments?.[0]?.name ||
                        'Shared an attachment'
                      : 'No messages yet'}
                  </p>
                  {thread.typingStatuses?.length ? (
                    <p className="mt-1 text-[11px] font-semibold text-purple-600">Typing...</p>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-100 bg-white p-4">
          {selectedThread ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedThread.gigTitle}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedThread.sellerName} &mdash; {selectedThread.buyerName || 'Buyer'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => onViewGig?.()}
                  >
                    View gig
                  </Button>
                  {pendingOrderId && isOwnGig && (
                    <Button
                      type="button"
                      className="bg-emerald-600 text-white hover:bg-emerald-500"
                      onClick={() => onAcceptGig?.(pendingOrderId)}
                    >
                      Accept gig
                    </Button>
                  )}
                  {!isOwnGig && (
                    <Button
                      type="button"
                      className="bg-purple-600 text-white hover:bg-purple-500"
                      onClick={() => onStartGig?.()}
                      disabled={!selectedThread?.gigId}
                    >
                      Start gig
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 px-3 py-3">
                {selectedThread.messages.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Start the conversation with a quick hello or a project brief.
                  </p>
                )}
                {selectedThread.messages.map((msg) => {
                  const currentUserId = user?._id || user?.id
                  const isOwn = currentUserId ? msg.senderId === currentUserId : false
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                          isOwn
                            ? 'border-purple-200 bg-purple-600 text-white'
                            : 'border-slate-100 bg-white text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className={`font-semibold ${isOwn ? 'text-white' : 'text-slate-700'}`}>
                            {msg.senderName}
                          </span>
                          <span className={isOwn ? 'text-white/80' : 'text-slate-400'}>
                            {formatChatTime(msg.sentAt)}
                          </span>
                        </div>
                        {msg.text && <p className="mt-1 whitespace-pre-line">{msg.text}</p>}
                        {msg.attachments?.length > 0 && (
                          <div className="mt-2 space-y-2 text-xs">
                            {msg.attachments.map((file) => {
                              const isImage = file.type?.startsWith?.('image/')
                              const preview = file.previewUrl || file.url || ''
                              return (
                                <div
                                  key={file.id}
                                  className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                                    isOwn ? 'bg-purple-500/40 text-white' : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {isImage && preview ? (
                                    <img
                                      src={preview}
                                      alt={file.name}
                                      className="h-12 w-12 shrink-0 rounded object-cover"
                                    />
                                  ) : null}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate font-semibold">{file.name}</span>
                                      <span className={isOwn ? 'text-white/80' : 'text-slate-500'}>
                                        {file.sizeLabel}
                                      </span>
                                    </div>
                                    {preview ? (
                                      <a
                                        href={preview}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={isOwn ? 'text-white/80 underline' : 'text-slate-500 underline'}
                                      >
                                        View attachment
                                      </a>
                                    ) : null}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {msg.readBy?.length > 0 && isOwn && (
                          <p className="mt-2 text-[10px] font-semibold text-white/80">Seen</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <form className="mt-3 space-y-3" onSubmit={onSendMessage}>
                {composerFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {composerFiles.map((file) => {
                      const isImage = file.type?.startsWith?.('image/')
                      return (
                        <span
                          key={file.id}
                          className="flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {isImage && file.previewUrl ? (
                            <img
                              src={file.previewUrl}
                              alt={file.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : null}
                          {file.name} ({file.sizeLabel})
                          <button
                            type="button"
                            className="text-slate-500 transition hover:text-slate-700"
                            onClick={() => onRemoveComposerFile?.(file.id)}
                            aria-label={`Remove ${file.name}`}
                          >
                            x
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <input
                    className="h-10 flex-1 rounded-full border-none bg-transparent px-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    placeholder="Write a message..."
                    value={composerText}
                    onChange={(event) => {
                      onComposerChange?.(event.target.value)
                      onTyping?.()
                    }}
                  />
                  <label className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
                    <span>Attach</span>
                    <input type="file" multiple className="sr-only" onChange={onComposerFiles} />
                  </label>
                  <Button type="submit" className="bg-purple-600 text-white hover:bg-purple-500">
                    Send
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-500">Select a thread on the left to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ChatView
