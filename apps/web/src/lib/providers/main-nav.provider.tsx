'use client'

import { createContext, ReactElement, useContext, useState } from "react";

type MainNavContextType = {
    shrinked: boolean,
    setShrinked: (value: boolean) => void,
    toggleShrinked: () => void,
    mobileOpen: boolean,
    setMobileOpen: (value: boolean) => void,
    toggleMobile: () => void
}

const MainNavContext = createContext<MainNavContextType>({
    shrinked: false,
    setShrinked: () => { },
    toggleShrinked: () => { },
    mobileOpen: false,
    setMobileOpen: () => { },
    toggleMobile: () => { }
})

export const useMainNav = () => useContext(MainNavContext);

export const MainNavProvider = ({ children, defaultShrinked = false }: {
    children: ReactElement,
    defaultShrinked?: boolean
}) => {
    const [shrinked, setShrinked] = useState<boolean>(defaultShrinked);
    const [mobileOpen, setMobileOpen] = useState(false);
    const toggleShrinked = () => setShrinked(prev => !prev);
    const toggleMobile = () => setMobileOpen(prev => !prev);

    return (
        <MainNavContext.Provider value={{
            shrinked,
            setShrinked,
            toggleShrinked,
            mobileOpen,
            setMobileOpen,
            toggleMobile
        }}>
            {children}
        </MainNavContext.Provider>
    )
}