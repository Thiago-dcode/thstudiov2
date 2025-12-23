'use client'

import { createContext, ReactElement, useContext, useState } from "react";


type MainNavContextType = {
    shrinked: boolean,
    setShrinked: (value: boolean) => void
}
const MainNavContext = createContext<MainNavContextType>({
    shrinked: false,
    setShrinked: () => { }
})

export const useMainNav = () => useContext(MainNavContext);

export const MainNavProvider = ({ children, defaultShrinked = false }: {
    children: ReactElement,
    defaultShrinked?: boolean
}) => {
    const [shrinked, setShrinked] = useState<boolean>(defaultShrinked);

    return (
        <MainNavContext.Provider value={{
            shrinked,
            setShrinked
        }}>
            {children}
        </MainNavContext.Provider>
    )

}