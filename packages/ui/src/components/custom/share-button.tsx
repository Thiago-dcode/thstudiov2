'use client'

import { Check, Share2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useShare } from '../../hooks/useShare'

export type ShareButtonProps = {
  url?: string
  title: string
  shared?: boolean
  onShare?: () => void
  className?: string
  showLabel?: boolean
  ariaLabel?: string
  fallbackCopy?: boolean
}

export function ShareButton({
  url,
  title,
  shared,
  onShare,
  className,
  showLabel = false,
  ariaLabel,
  fallbackCopy = true,
}: ShareButtonProps) {
  const { share, active } = useShare({ fallbackCopy })
  const isShared = shared ?? active

  const handleClick = () => {
    if (onShare) {
      onShare()
      return
    }

    void share({ url: url ?? window.location.href, title })
  }

  const label = ariaLabel ?? (isShared ? 'Shared' : 'Share')

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'text-text-muted hover:text-text transition-colors cursor-pointer',
        showLabel && 'flex items-center gap-2 text-sm tracking-wider font-medium text-left',
        className,
      )}
      aria-label={label}
    >
      {isShared ? (
        <>
          <Check className="size-4" strokeWidth={2} />
          {showLabel ? <span>Shared</span> : null}
        </>
      ) : (
        <>
          <Share2 className="size-4" strokeWidth={2} />
          {showLabel ? <span>Share</span> : null}
        </>
      )}
    </button>
  )
}
