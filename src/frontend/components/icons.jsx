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

function WhatsAppIcon({ className = '', ...props }) {
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
      <path d="M20 12a8 8 0 0 1-11.77 7.05L4 20l1.1-4.1A8 8 0 1 1 20 12Z" />
      <path d="M9.7 8.5c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.4.1-.5.3-.2.2-.7.7-.7 1.7s.8 2 1 2.2c.2.2 1.4 2.2 3.4 3 .5.2.8.3 1.1.4.5.1 1 .1 1.3 0 .4-.1 1.1-.5 1.3-.9.2-.4.2-.8.1-.9-.1-.1-.3-.2-.6-.4l-1.1-.5c-.2-.1-.5 0-.7.2l-.3.4c-.2.2-.4.3-.7.2-.4-.2-1.4-.7-2.1-2-.2-.3 0-.5.1-.7l.3-.3c.1-.2.2-.4.1-.6l-.5-1.2Z" />
    </svg>
  )
}

export { ChatBubbleIcon, GlobeIcon, InstagramIcon, WhatsAppIcon }
