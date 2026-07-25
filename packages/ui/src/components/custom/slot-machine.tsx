'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { cn } from "../../lib/utils"

/* -------------------------------------------------------------------------- */
/*  Global, tweakable defaults for the slot-machine effect.                   */
/*  Override any of them per-instance through props.                          */
/* -------------------------------------------------------------------------- */

/** Milliseconds a single spin takes to complete (bigger = slower). */
const DEFAULT_SPIN_DURATION = 1200
/** Full loops through the list before landing on the target (bigger = faster/longer spin). */
const DEFAULT_EXTRA_SPINS = 3
/** Height of a single row / the visible window. Number = px, or any CSS length (e.g. "1.1em"). */
const DEFAULT_ITEM_HEIGHT = 48
/** Milliseconds to rest on a word before spinning to the next one (auto-play). */
const DEFAULT_INTERVAL = 2500
/** Easing used while the reel settles — a snappy start with a soft landing. */
const DEFAULT_EASING = "cubic-bezier(0.15, 0.85, 0.3, 1)"

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
    typeof document !== "undefined" ? useLayoutEffect : useEffect

type SlotMachineProps = {
    /** The words the reel cycles through. */
    texts: string[]
    /** Duration of a single spin in ms. @default 1200 */
    spinDuration?: number
    /** Full loops through the list before landing. @default 3 */
    extraSpins?: number
    /** Row height. A number is treated as px; a string is any CSS length (e.g. "1.1em"). @default 48 */
    itemHeight?: number | string
    /** Rest time between automatic spins in ms. @default 2500 */
    interval?: number
    /** CSS easing for the settle. */
    easing?: string
    /** Spin automatically on an interval. @default true */
    autoPlay?: boolean
    /**
     * Shrink the window to the width of the current word (animated in sync with
     * the spin) instead of holding the width of the widest word. @default false
     */
    fitWidth?: boolean
    /** Extra classes for the outer window. */
    className?: string
    /** Extra classes for each word row. */
    itemClassName?: string
    /** Fired every time the reel settles on a word. */
    onLand?: (text: string, index: number) => void
}

/**
 * A vertical slot-machine text reel. It spins through `texts` and eases to a
 * stop on each one, then repeats. Inspired by the classic CSS slot machine, the
 * reel only ever travels in one direction: after every spin the offset is
 * silently normalised back into range (the row shown is identical), so the
 * loop is seamless no matter how many words there are.
 *
 * `itemHeight` accepts a CSS length, so passing e.g. "1.1em" lets the reel
 * scale with the inherited font size — handy inside responsive headings.
 *
 * With `fitWidth`, the window measures each word and animates its width to the
 * current one as it lands, so surrounding text hugs the word instead of the
 * widest entry. Words that are wider than the window during a spin are clipped
 * symmetrically (the reel is centred), reading like a slot mask.
 */
export const SlotMachine = ({
    texts,
    spinDuration = DEFAULT_SPIN_DURATION,
    extraSpins = DEFAULT_EXTRA_SPINS,
    itemHeight = DEFAULT_ITEM_HEIGHT,
    interval = DEFAULT_INTERVAL,
    easing = DEFAULT_EASING,
    autoPlay = true,
    fitWidth = false,
    className,
    itemClassName,
    onLand,
}: SlotMachineProps) => {
    const len = texts.length
    // Normalise the row height to a CSS length usable inside calc().
    const rowSize = typeof itemHeight === "number" ? `${itemHeight}px` : itemHeight

    // `position` is a monotonically increasing row index; it never resets mid-spin.
    const [position, setPosition] = useState(0)
    const [target, setTarget] = useState(0)
    const [withTransition, setWithTransition] = useState(false)
    const [isSpinning, setIsSpinning] = useState(false)

    // Measured per-word widths, used only when `fitWidth` is on.
    const sizerRef = useRef<HTMLSpanElement>(null)
    const [widths, setWidths] = useState<number[]>([])

    // Enough copies so the strip always covers the furthest row a spin can reach.
    const copies = extraSpins + 3
    const strip = Array.from({ length: copies }, () => texts).flat()

    const spinTo = useCallback((toIndex: number) => {
        if (len <= 1) return
        setTarget(toIndex)
        setWithTransition(true)
        setIsSpinning(true)
        setPosition((prev) => {
            const current = prev % len
            const delta = (toIndex - current + len) % len
            // Always move at least one full loop, even when landing on the same word.
            const advance = extraSpins * len + (delta === 0 ? len : delta)
            return prev + advance
        })
    }, [len, extraSpins])

    // When a spin ends, fire the callback and fold the offset back into range.
    const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
        if (e.propertyName !== "transform") return
        setIsSpinning(false)
        setWithTransition(false)
        setPosition((prev) => prev % len)
        onLand?.(texts[target], target)
    }, [len, texts, target, onLand])

    // Auto-play: once the reel is at rest, schedule the next spin.
    useEffect(() => {
        if (!autoPlay || isSpinning || len <= 1) return
        const id = setTimeout(() => {
            spinTo((target + 1) % len)
        }, interval)
        return () => clearTimeout(id)
    }, [autoPlay, isSpinning, interval, len, target, spinTo])

    // Measure each word's width (pre-paint) and keep it fresh across font / size
    // changes. Only relevant when `fitWidth` is on.
    useIsomorphicLayoutEffect(() => {
        if (!fitWidth) return
        const el = sizerRef.current
        if (!el) return

        const measure = () => {
            const next = Array.from(el.children).map(
                (c) => (c as HTMLElement).getBoundingClientRect().width,
            )
            setWidths((prev) =>
                prev.length === next.length && prev.every((w, i) => w === next[i])
                    ? prev
                    : next,
            )
        }

        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(el)
        // Re-measure once webfonts have swapped in (metrics change).
        document.fonts?.ready.then(measure).catch(() => { })

        return () => observer.disconnect()
    }, [fitWidth, texts])

    if (len === 0) return null

    const fittedWidth =
        fitWidth && widths.length === len ? `${widths[target]}px` : undefined

    return (
        <span
            className={cn(
                "inline-flex justify-center overflow-hidden align-middle",
                className,
            )}
            style={{
                height: rowSize,
                lineHeight: rowSize,
                width: fittedWidth,
                transition: withTransition
                    ? `width ${spinDuration}ms ${easing}`
                    : "none",
            }}
            aria-live="polite"
            aria-label={texts[target]}
        >
            {/* Hidden sizer used to measure each word for `fitWidth`. */}
            {fitWidth && (
                <span
                    ref={sizerRef}
                    aria-hidden="true"
                    className="pointer-events-none invisible absolute left-0 top-0 flex flex-col items-start"
                >
                    {texts.map((word, i) => (
                        <span
                            key={i}
                            className={cn("whitespace-nowrap", itemClassName)}
                        >
                            {word}
                        </span>
                    ))}
                </span>
            )}

            <span
                className="flex flex-col will-change-transform"
                style={{
                    transform: `translateY(calc(-${position} * ${rowSize}))`,
                    transition: withTransition
                        ? `transform ${spinDuration}ms ${easing}`
                        : "none",
                    filter: isSpinning ? "blur(0.4px)" : "none",
                }}
                onTransitionEnd={handleTransitionEnd}
            >
                {strip.map((word, i) => {
                    return (<span
                        key={i}
                        className={cn(
                            "flex shrink-0 items-center justify-center whitespace-nowrap",
                            itemClassName,
                        )}
                        style={{ height: rowSize }}
                        aria-hidden={i % len !== position % len}
                    >
                        {word}
                    </span>)
                })}
            </span>
        </span>
    )
}

export default SlotMachine
