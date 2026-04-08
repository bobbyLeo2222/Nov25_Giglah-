function GlobeIcon({ className = '', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 0 0 18 15 15 0 0 0 0-18Z" />
    </svg>
  )
}

function InstagramIcon({ className = '', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="currentColor" />
    </svg>
  )
}

function ChatBubbleIcon({ className = '', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5V13a3.5 3.5 0 0 1-3.5 3.5H11l-4.5 4V6.5Z" />
      <path d="M9 9h6M9 12h3" />
    </svg>
  )
}

export { ChatBubbleIcon, GlobeIcon, InstagramIcon }
