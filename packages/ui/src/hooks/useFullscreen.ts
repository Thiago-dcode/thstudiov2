'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export const useFullscreen = <T extends HTMLElement = HTMLElement>() => {
    const ref = useRef<T>(null)
    const [fullscreen, setFullscreen] = useState(false)

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            ref.current?.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }, [])

    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement) document.exitFullscreen()
    }, [])

    useEffect(() => {
        const onChange = () => setFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    return { ref, fullscreen, toggleFullscreen, exitFullscreen } as const
}
