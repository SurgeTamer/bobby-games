import { type ReactNode } from 'react'

/* eslint-disable react-refresh/only-export-components */

export function go(href: string) {
  const next = new URL(href, window.location.origin)
  const dest = next.pathname + next.search + next.hash
  const cur = window.location.pathname + window.location.search + window.location.hash
  if (cur === dest) return
  window.history.pushState({}, '', dest)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function Link({
  href,
  className,
  children,
  onClick,
}: {
  href: string
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        onClick?.()
        go(href)
      }}
    >
      {children}
    </a>
  )
}
