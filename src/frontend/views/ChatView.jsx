import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatChatTime, timeAgo } from '@/frontend/helpers'

const getAvatarFallback = (name = '') =>
  name
    .split(' ')
    .map((part) => part.trim()[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

const isImageFile = (file = {}) => {
  const fileName = (file.name || '').toLowerCase()
  const fileUrl = (file.url || file.previewUrl || '').toLowerCase()
  return (
    file.type?.startsWith?.('image/') ||
    file.type === 'image' ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileName) ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileUrl)
  )
}

const isVideoFile = (file = {}) => {
  const fileName = (file.name || '').toLowerCase()
  const fileUrl = (file.url || file.previewUrl || '').toLowerCase()
  return (
    file.type?.startsWith?.('video/') ||
    file.type === 'video' ||
    /\.(mp4|webm|ogg|mov|m4v|avi)$/i.test(fileName) ||
    /\.(mp4|webm|ogg|mov|m4v|avi)(\?|#|$)/i.test(fileUrl)
  )
}

const formatMessageDate = (timestamp) =>
  new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))

function Avatar({ name = '', src = '', size = 'md', accent = 'purple' }) {
  const sizeClass =
    size === 'sm'
      ? 'h-10 w-10 text-xs'
      : size === 'lg'
        ? 'h-12 w-12 text-sm'
        : 'h-11 w-11 text-sm'
  const accentClass =
    accent === 'slate'
      ? 'bg-slate-200 text-slate-700'
      : 'bg-purple-100 text-purple-700'

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover`} />
  }

  return (
    <div
      className={`${sizeClass} ${accentClass} flex shrink-0 items-center justify-center rounded-full font-semibold`}
      aria-hidden="true"
    >
      {getAvatarFallback(name)}
    </div>
  )
}

function ChatView({
  chatRoleFilter = 'all',
  chatThreadCounts = { all: 0, buyer: 0, seller: 0 },
  onChatRoleFilterChange,
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
  isStartingGig = false,
  isSendingMessage = false,
  pendingOrderId = '',
  activeOrderStatus = '',
  activeOrderId = '',
  onOpenOrder,
  onAcceptGig,
  isOwnGig = false,
  onTyping,
  user,
}) {
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [downloadingAttachmentUrl, setDownloadingAttachmentUrl] = useState('')
  const currentUserId = user?._id || user?.id || ''
  const canUseRoleTabs = user?.role === 'seller'
  const effectiveRoleFilter = canUseRoleTabs ? chatRoleFilter : 'all'
  const activeThreadCount =
    effectiveRoleFilter === 'seller'
      ? chatThreadCounts.seller
      : effectiveRoleFilter === 'buyer'
        ? chatThreadCounts.buyer
        : chatThreadCounts.all

  const inboxDescription =
    effectiveRoleFilter === 'seller'
      ? 'Manage buyer enquiries and project updates in one place.'
      : effectiveRoleFilter === 'buyer' || !canUseRoleTabs
        ? 'Reach sellers, share references, and move projects forward faster.'
        : 'Track every buyer and seller conversation from one inbox.'

  const emptyMessage =
    effectiveRoleFilter === 'seller'
      ? 'No buyer conversations yet. New enquiries will show up here.'
      : effectiveRoleFilter === 'buyer' || !canUseRoleTabs
        ? 'No conversations yet. Open a gig and tap Chat to message the seller.'
        : 'No conversations yet. Start from a gig to begin messaging.'

  const selectedThreadIsBuyer = Boolean(currentUserId && selectedThread?.buyerUserId === currentUserId)
  const shouldPromptBuyerRequirements =
    Boolean(selectedThread) &&
    selectedThreadIsBuyer &&
    !isOwnGig &&
    selectedThread.messages.length === 0
  const activeOrderLabel =
    activeOrderStatus === 'pending'
      ? 'Request sent'
      : activeOrderStatus === 'in_progress'
        ? 'Gig in progress'
        : activeOrderStatus === 'awaiting_completion'
          ? 'Awaiting completion'
          : ''
  const composerPlaceholder = shouldPromptBuyerRequirements
    ? 'Describe your goals, scope, timeline, budget, and references...'
    : 'Type your message here...'

  const selectedCounterpart = useMemo(() => {
    if (!selectedThread) return { name: 'Conversation', avatar: '', role: '' }
    const isSellerPerspective = currentUserId ? selectedThread.sellerUserId === currentUserId : false
    return isSellerPerspective
      ? {
          name: selectedThread.buyerName || 'Buyer',
          avatar: selectedThread.buyerAvatar || '',
          role: 'Buyer',
        }
      : {
          name: selectedThread.sellerName || 'Seller',
          avatar: selectedThread.sellerAvatar || '',
          role: 'Seller',
        }
  }, [currentUserId, selectedThread])

  const datedMessages = useMemo(() => {
    if (!selectedThread?.messages?.length) return []
    let lastDateLabel = ''
    return selectedThread.messages.map((msg) => {
      const nextDateLabel = formatMessageDate(msg.sentAt)
      const showDate = nextDateLabel !== lastDateLabel
      lastDateLabel = nextDateLabel
      return { ...msg, dateLabel: nextDateLabel, showDate }
    })
  }, [selectedThread])

  const hasRecipientSeenMessage = (message) =>
    Boolean(
      currentUserId &&
        message?.readBy?.some((id) => id && id !== currentUserId && id !== message?.senderId),
    )

  const closePreview = () => {
    setPreviewAttachment(null)
    setPreviewZoom(1)
  }

  useEffect(() => {
    if (!previewAttachment) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closePreview()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewAttachment])

  const handleAttachmentDownload = async (file) => {
    const fileUrl = file?.url || file?.previewUrl || ''
    if (!fileUrl) return
    setDownloadingAttachmentUrl(fileUrl)
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Download failed')
      }
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = file.name || 'attachment'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      const fallbackLink = document.createElement('a')
      fallbackLink.href = fileUrl
      fallbackLink.download = file.name || 'attachment'
      fallbackLink.rel = 'noreferrer'
      fallbackLink.target = '_blank'
      document.body.appendChild(fallbackLink)
      fallbackLink.click()
      fallbackLink.remove()
    } finally {
      setDownloadingAttachmentUrl('')
    }
  }

  const getDeliveryLabel = (message) => {
    if (message?.deliveryStatus === 'uploading') return 'Uploading...'
    if (message?.deliveryStatus === 'sending') return 'Sending...'
    if (message?.deliveryStatus === 'failed') return 'Failed'
    return ''
  }

  return (
    <section className="h-full overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:rounded-none">
      <div className="grid h-full min-h-0 lg:grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr]">
        <aside
          className={`min-h-0 flex-col border-b border-slate-200 bg-slate-50/80 lg:border-b-0 lg:border-r ${
            selectedThread ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="border-b border-slate-200 bg-white px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-600">
                  Inbox
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Chats</h2>
                <p className="mt-1 text-sm text-slate-500">{inboxDescription}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Active</p>
                <p className="text-lg font-semibold text-slate-900">{activeThreadCount}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(canUseRoleTabs
                ? [
                    { id: 'all', label: `All (${chatThreadCounts.all})` },
                    { id: 'buyer', label: `As Buyer (${chatThreadCounts.buyer})` },
                    { id: 'seller', label: `As Seller (${chatThreadCounts.seller})` },
                  ]
                : [{ id: 'all', label: `All (${chatThreadCounts.all})` }]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    effectiveRoleFilter === tab.id
                      ? 'border-purple-500 bg-purple-500 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-700'
                  }`}
                  onClick={() => onChatRoleFilterChange?.(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100"
                placeholder="Search by gig, seller, or buyer"
                value={chatSearch}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {visibleThreads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-2">
                {visibleThreads.map((thread) => {
                  const lastMessage = thread.messages[thread.messages.length - 1]
                  const isSellerPerspective = currentUserId ? thread.sellerUserId === currentUserId : false
                  const counterpartName = isSellerPerspective
                    ? thread.buyerName || 'Buyer'
                    : thread.sellerName || 'Seller'
                  const counterpartAvatar = isSellerPerspective
                    ? thread.buyerAvatar || ''
                    : thread.sellerAvatar || ''
                  const previewText = lastMessage
                    ? lastMessage.text || lastMessage.attachments?.[0]?.name || 'Shared an attachment'
                    : 'No messages yet'

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => onSelectThread?.(thread.id)}
                      className={`w-full rounded-[24px] border px-3 py-3 text-left transition ${
                        selectedThreadId === thread.id
                          ? 'border-purple-200 bg-white shadow-sm'
                          : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={counterpartName} src={counterpartAvatar} size="md" />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {counterpartName}
                              </p>
                              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                                {thread.gigTitle}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs text-slate-400">{timeAgo(thread.lastUpdatedAt)}</p>
                              {thread.unreadCount > 0 ? (
                                <span className="mt-2 inline-flex min-w-5 items-center justify-center rounded-full bg-purple-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  {thread.unreadCount}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            {thread.otherTypingStatuses?.length ? (
                              <span className="text-[11px] font-semibold text-purple-600">Typing...</span>
                            ) : (
                              <p className="truncate text-sm text-slate-500">{previewText}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        <div className={`min-h-0 flex-col bg-white ${selectedThread ? 'flex' : 'hidden lg:flex'}`}>
          {selectedThread ? (
            <>
              <header className="border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-purple-200 hover:text-purple-700 lg:hidden"
                      onClick={() => onSelectThread?.('')}
                      aria-label="Back to conversations"
                    >
                      ←
                    </button>
                    <Avatar
                      name={selectedCounterpart.name}
                      src={selectedCounterpart.avatar}
                      size="lg"
                      accent="slate"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold text-slate-900">
                          {selectedCounterpart.name}
                        </h3>
                        {selectedCounterpart.role ? (
                          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                            {selectedCounterpart.role}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-slate-500">{selectedThread.gigTitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-slate-300 text-slate-700 hover:bg-slate-50"
                      onClick={() => onViewGig?.()}
                    >
                      View gig
                    </Button>
                    {pendingOrderId && isOwnGig ? (
                      <Button
                        type="button"
                        className="rounded-full bg-purple-600 text-white hover:bg-purple-500"
                        onClick={() => onAcceptGig?.(pendingOrderId)}
                      >
                        Accept gig
                      </Button>
                    ) : null}
                    {activeOrderId ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => onOpenOrder?.(activeOrderId)}
                      >
                        Open order
                      </Button>
                    ) : null}
                    {!isOwnGig && selectedThreadIsBuyer ? (
                      activeOrderStatus ? (
                        <Button
                          type="button"
                          disabled
                          className="rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50"
                        >
                          {activeOrderLabel}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className="rounded-full bg-purple-600 text-white hover:bg-purple-500"
                          onClick={() => onStartGig?.()}
                          disabled={!selectedThread?.gigId || isStartingGig}
                        >
                          {isStartingGig ? 'Starting...' : 'Start gig'}
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#ffffff_100%)] px-4 py-5 sm:px-6">
                {selectedThread.messages.length === 0 ? (
                  shouldPromptBuyerRequirements ? (
                    <div className="mx-auto max-w-2xl rounded-[28px] border border-purple-100 bg-white px-5 py-5 text-sm text-slate-600 shadow-sm">
                      <p className="font-semibold text-slate-900">Send your project requirements first</p>
                      <p className="mt-2">
                        Start with the scope, goals, timeline, budget, references, and any important deliverables.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-xl rounded-[28px] border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                      Start the conversation with a quick hello or a clear project brief.
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {datedMessages.map((msg) => {
                      const isOwn = currentUserId ? msg.senderId === currentUserId : false
                      return (
                        <div key={msg.id}>
                          {msg.showDate ? (
                            <div className="mb-4 flex justify-center">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                                {msg.dateLabel}
                              </span>
                            </div>
                          ) : null}

                          <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {!isOwn ? (
                              <Avatar
                                name={msg.senderName}
                                src={msg.senderRole === 'seller' ? selectedThread.sellerAvatar : selectedThread.buyerAvatar}
                                size="sm"
                                accent="slate"
                              />
                            ) : null}

                            <div className={`max-w-[82%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div
                                className={`rounded-[24px] px-4 py-3 shadow-sm ${
                                  isOwn
                                    ? 'rounded-br-md bg-purple-600 text-white'
                                    : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                                }`}
                              >
                                {!isOwn ? (
                                  <p className="mb-1 text-xs font-semibold text-slate-500">{msg.senderName}</p>
                                ) : null}
                                {msg.text ? <p className="whitespace-pre-line text-sm leading-6">{msg.text}</p> : null}

                                {msg.attachments?.length > 0 ? (
                                  <div className="mt-3 space-y-2">
                                    {msg.attachments.map((file) => {
                                      const isImage = isImageFile(file)
                                      const isVideo = isVideoFile(file)
                                      const preview = file.previewUrl || file.url || ''
                                      const showPreview = Boolean(preview && (isImage || isVideo))
                                      const showDownload = Boolean(file.url || file.previewUrl)
                                      return (
                                        <div
                                          key={file.id}
                                          className={`overflow-hidden rounded-2xl ${
                                            isOwn ? 'bg-purple-500/40' : 'bg-slate-50'
                                          }`}
                                        >
                                          {isImage && preview ? (
                                            <button
                                              type="button"
                                              className="block w-full text-left"
                                              onClick={() => {
                                                setPreviewZoom(1)
                                                setPreviewAttachment({
                                                  name: file.name,
                                                  url: preview,
                                                  isImage,
                                                  isVideo,
                                                })
                                              }}
                                            >
                                              <img
                                                src={preview}
                                                alt={file.name}
                                                className="max-h-72 w-full object-cover"
                                              />
                                            </button>
                                          ) : null}

                                          <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                                            <div className="min-w-0">
                                              <p className={`truncate font-semibold ${isOwn ? 'text-white' : 'text-slate-700'}`}>
                                                {file.name}
                                              </p>
                                              <p className={isOwn ? 'text-white/80' : 'text-slate-500'}>
                                                {file.sizeLabel}
                                              </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-3">
                                              {showPreview ? (
                                                <button
                                                  type="button"
                                                  className={`font-semibold underline ${
                                                    isOwn ? 'text-white/85' : 'text-slate-500'
                                                  }`}
                                                  onClick={() => {
                                                    setPreviewZoom(1)
                                                    setPreviewAttachment({
                                                      name: file.name,
                                                      url: preview,
                                                      isImage,
                                                      isVideo,
                                                    })
                                                  }}
                                                >
                                                  Preview
                                                </button>
                                              ) : null}
                                              {showDownload ? (
                                                <button
                                                  type="button"
                                                  className={`font-semibold underline ${
                                                    isOwn ? 'text-white/85' : 'text-slate-500'
                                                  }`}
                                                  onClick={() => handleAttachmentDownload(file)}
                                                  disabled={downloadingAttachmentUrl === (file.url || file.previewUrl || '')}
                                                >
                                                  {downloadingAttachmentUrl === (file.url || file.previewUrl || '')
                                                    ? 'Downloading...'
                                                    : 'Download'}
                                                </button>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : null}
                              </div>

                              <div
                                className={`mt-1 flex items-center gap-2 px-1 text-[11px] ${
                                  isOwn ? 'justify-end text-slate-400' : 'justify-start text-slate-400'
                                }`}
                              >
                                <span>{formatChatTime(msg.sentAt)}</span>
                                {getDeliveryLabel(msg) ? <span>{getDeliveryLabel(msg)}</span> : null}
                                {isOwn && !getDeliveryLabel(msg) && hasRecipientSeenMessage(msg) ? <span>Seen</span> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
                <form className="space-y-3" onSubmit={onSendMessage}>
                  {composerFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {composerFiles.map((file) => {
                        const image = isImageFile(file)
                        return (
                          <span
                            key={file.id}
                            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                          >
                            {image && file.previewUrl ? (
                              <img
                                src={file.previewUrl}
                                alt={file.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : null}
                            <span className="max-w-48 truncate">{file.name}</span>
                            <span className="text-slate-400">{file.sizeLabel}</span>
                            <button
                              type="button"
                              className="text-slate-500 transition hover:text-slate-800"
                              onClick={() => onRemoveComposerFile?.(file.id)}
                              aria-label={`Remove ${file.name}`}
                            >
                              x
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  ) : null}

                  <div className="flex items-end gap-3 rounded-[28px] border border-slate-200 bg-slate-50 px-3 py-3 shadow-sm">
                    <label className="mb-1 flex cursor-pointer items-center justify-center rounded-full bg-white p-3 text-slate-500 shadow-sm transition hover:text-slate-700">
                      <span className="text-lg leading-none">+</span>
                      <input type="file" multiple className="sr-only" onChange={onComposerFiles} />
                    </label>

                    <div className="flex-1">
                      <input
                        className="h-11 w-full border-none bg-transparent px-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        placeholder={composerPlaceholder}
                        value={composerText}
                        onChange={(event) => {
                          onComposerChange?.(event.target.value)
                          onTyping?.(event.target.value)
                        }}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="rounded-full bg-purple-600 px-5 text-white hover:bg-purple-500"
                    >
                      {isSendingMessage ? 'Send now' : 'Send'}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.14),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-6">
              <div className="max-w-md rounded-[32px] border border-slate-200 bg-white/90 px-6 py-8 text-center shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-600">
                  Messaging
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Select a conversation</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Pick a thread from the left to review project details, share files, and continue the conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewAttachment ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={closePreview}
                >
                  Back
                </button>
                <p className="text-sm font-semibold text-slate-900">{previewAttachment.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {previewAttachment.isImage ? (
                  <>
                    <button
                      type="button"
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      onClick={() => setPreviewZoom((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))))}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      onClick={() => setPreviewZoom((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}
                    >
                      +
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={closePreview}
                  aria-label="Close preview"
                >
                  x
                </button>
              </div>
            </div>
            <div className="mt-3 max-h-[75vh] overflow-auto rounded-2xl bg-slate-50 p-3">
              {previewAttachment.isImage ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="mx-auto block max-h-[70vh] w-auto rounded-2xl object-contain"
                  style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                />
              ) : previewAttachment.isVideo ? (
                <video
                  src={previewAttachment.url}
                  controls
                  className="mx-auto block max-h-[70vh] w-full rounded-2xl bg-black object-contain"
                />
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                  onClick={() => handleAttachmentDownload(previewAttachment)}
                >
                  {downloadingAttachmentUrl === (previewAttachment.url || '')
                    ? 'Downloading...'
                    : 'Download file'}
                </button>
              )}
            </div>
            {(previewAttachment.isImage || previewAttachment.isVideo) && previewAttachment.url ? (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                  onClick={() => handleAttachmentDownload(previewAttachment)}
                  disabled={downloadingAttachmentUrl === (previewAttachment.url || '')}
                >
                  {downloadingAttachmentUrl === (previewAttachment.url || '')
                    ? 'Downloading...'
                    : 'Download'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ChatView
