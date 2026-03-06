'use client'

import { useCallback, useState } from 'react'

type ShareData = {
    title?: string
    text?: string
    url: string
}

type ShareStatus = 'idle' | 'shared' | 'fallback-copied'

export const useShare = () => {
    const [status, setStatus] = useState<ShareStatus>('idle')

    const share = useCallback(async (data: ShareData) => {
        if (navigator.share) {
            try {
                await navigator.share(data)
                setStatus('shared')
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === 'AbortError') return
                await navigator.clipboard.writeText(data.url)
                setStatus('fallback-copied')
            }
        } else {
            await navigator.clipboard.writeText(data.url)
            setStatus('fallback-copied')
        }

        setTimeout(() => setStatus('idle'), 2000)
    }, [])

    return { share, status, shared: status !== 'idle' } as const
}
