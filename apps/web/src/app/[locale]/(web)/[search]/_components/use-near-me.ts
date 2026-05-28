"use client"

import { useCallback, useState } from "react"
import { useFilters } from "./filters.provider"

export const NEAR_ME_RADIUS_KM = 100

export type GeoState = "idle" | "locating" | "denied" | "unavailable"

export function useNearMe() {
    const { add, filters } = useFilters()
    const [geoState, setGeoState] = useState<GeoState>("idle")

    const isLocated = filters.lat != null && filters.lng != null

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGeoState("unavailable")
            return
        }

        setGeoState("locating")

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                add("lat", coords.latitude)
                add("lng", coords.longitude)
                add("radius_km", NEAR_ME_RADIUS_KM)
                setGeoState("idle")
            },
            (err) => {
                setGeoState(
                    err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
                )
            },
            { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
        )
    }, [add])

    return { geoState, isLocated, requestLocation }
}
