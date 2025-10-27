'use client'

import { createContext, ReactElement, useContext } from "react";
import { BaseUser } from "@repo/common-lib/types/user";


type FunnelContextType = {
    user?: BaseUser,
}
const FunnelContext = createContext<FunnelContextType>({

})

export const useFunnel = () => useContext(FunnelContext);

export const FunnelProvider = ({ children, user }: {
    children: ReactElement,
    user: BaseUser
}) => {
    //TODO:handle funnel logic

    return (
        <FunnelContext.Provider value={{
            user,
        }}>
            {children}
        </FunnelContext.Provider>
    )

}