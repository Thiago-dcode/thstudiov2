import { useCallback, useRef, useState, type PointerEvent, type TransitionEvent } from "react"

const SWIPE_THRESHOLD = 50
const SWIPE_MAX_Y = 100

type SwipeHandlers = {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
}

export function useSwipe({ onSwipeLeft, onSwipeRight }: SwipeHandlers) {
    const startX = useRef(0)
    const startY = useRef(0)
    const tracking = useRef(false)
    const pendingCb = useRef<(() => void) | null>(null)

    const [offsetX, setOffsetX] = useState(0)
    const [animate, setAnimate] = useState(false)
    const [active, setActive] = useState(false)

    const reset = useCallback(() => {
        setOffsetX(0)
        setAnimate(false)
        setActive(false)
    }, [])

    const onPointerDown = useCallback((e: PointerEvent) => {
        if (e.pointerType === "mouse" || pendingCb.current) return
        startX.current = e.clientX
        startY.current = e.clientY
        tracking.current = true
        setAnimate(false)
        setActive(true)
        setOffsetX(0)
    }, [])

    const onPointerMove = useCallback((e: PointerEvent) => {
        if (!tracking.current) return
        const dy = Math.abs(e.clientY - startY.current)
        if (dy > SWIPE_MAX_Y) {
            tracking.current = false
            setAnimate(true)
            setOffsetX(0)
            setActive(false)
            return
        }
        setOffsetX((e.clientX - startX.current) * 0.55)
    }, [])

    const onPointerUp = useCallback((e: PointerEvent) => {
        if (!tracking.current) return
        tracking.current = false

        const dx = e.clientX - startX.current
        if (Math.abs(dx) < SWIPE_THRESHOLD) {
            setAnimate(true)
            setOffsetX(0)
            setActive(false)
            return
        }

        const vw = window.innerWidth
        if (dx < 0) {
            pendingCb.current = onSwipeLeft ?? null
            setAnimate(true)
            setOffsetX(-vw)
        } else {
            pendingCb.current = onSwipeRight ?? null
            setAnimate(true)
            setOffsetX(vw)
        }
    }, [onSwipeLeft, onSwipeRight])

    const onPointerCancel = useCallback(() => {
        tracking.current = false
        setAnimate(true)
        setOffsetX(0)
        setActive(false)
    }, [])

    const onTransitionEnd = useCallback((e: TransitionEvent) => {
        if (e.propertyName !== "transform") return
        const cb = pendingCb.current
        pendingCb.current = null
        cb?.()
        reset()
    }, [reset])

    return {
        offsetX,
        animate,
        active,
        onTransitionEnd,
        handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    }
}
