'use client'

import { createContext, ReactElement, useContext, useState } from "react";
import { UserAuth } from "../auth.types";


type SessionContextType = {
    session?: UserAuth,
    setSession: (session?: UserAuth) => void
}
const SessionContext = createContext<SessionContextType>({
    setSession: () => { }
})

export const useSession =()=> useContext(SessionContext);

export const SessionProvider = ({ children }: {
    children: ReactElement
}) => {
    const [userSession, setUserSession] = useState<UserAuth | undefined>(undefined);

    const setSession = (session?: UserAuth) => {
        //Do another stuff
        setUserSession(session);
    }

    return (
        <SessionContext.Provider value={{
            session: userSession,
            setSession
        }}>
            {children}
        </SessionContext.Provider>
    )

}