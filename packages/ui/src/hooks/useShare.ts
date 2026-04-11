'use client'

import { useCallback, useState } from 'react'

type ShareData = {
    title?: string
    text?: string
    url: string
}

type ShareStatus = 'idle' | 'shared' | 'copied'

export const useShare = (options?: { fallbackCopy?: boolean }) => {
    const [status, setStatus] = useState<ShareStatus>('idle')
    const [supported] = useState(
        () => typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare,
    )

    const resetAfterDelay = useCallback(() => {
        setTimeout(() => setStatus('idle'), 2000)
    }, [])

    const share = useCallback(async (data: ShareData) => {
        if (navigator.share && navigator.canShare?.({ url: data.url })) {
            try {
                await navigator.share(data)
                setStatus('shared')
                resetAfterDelay()
            } catch {
                // User dismissed the dialog or share failed
            }
            return
        }

        if (options?.fallbackCopy) {
            await navigator.clipboard.writeText(data.url)
            setStatus('copied')
            resetAfterDelay()
        }
    }, [options?.fallbackCopy, resetAfterDelay])

    return { share, status, active: status !== 'idle', supported } as const
}
