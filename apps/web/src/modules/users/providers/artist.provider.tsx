"use client"

import { useParams } from "next/navigation"
import { createContext, ReactNode, useContext, useEffect, useRef } from "react"
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { getUserCompactedAction } from "@/modules/users/server-actions/get-compacted-user.action"
import { CompactUser } from "@repo/common-lib/types/user"

type ArtistContextType = {
    artist: CompactUser | null
    isLoading: boolean
    isPending: boolean
    refresh: () => Promise<void>
}

const ArtistContext = createContext<ArtistContextType | null>(null)

export const useArtist = () => {
    const context = useContext(ArtistContext)
    if (!context) {
        throw new Error("useArtist must be used within an ArtistProvider")
    }
    return context
}

export const ArtistProvider = ({ children }: { children: ReactNode }) => {
    const params = useParams()
    const username = params.username as string | undefined
    const prevUsernameRef = useRef<string | undefined>(undefined)

    const { result, isPending, handleAction } = useHandleAction({
        action: async () => {
            return await getUserCompactedAction(username!)
        },
    })

    useEffect(() => {
        if (!username) return
        if (username === prevUsernameRef.current) return
        prevUsernameRef.current = username
        handleAction()
    }, [username])

    const artist = result?.data ?? null

    console.log(artist);

    const refresh = async () => {
        if (username) await handleAction()
    }

    const isLoading = !artist && isPending

    return (
        <ArtistContext.Provider value={{ artist, isLoading, isPending, refresh }}>
            {children}
        </ArtistContext.Provider>
    )
}
