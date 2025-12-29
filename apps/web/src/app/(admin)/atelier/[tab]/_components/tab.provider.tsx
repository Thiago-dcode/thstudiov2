"use client"

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { getOneUserAction } from "@/modules/users/server-actions/get-one-user.action"
import {getUserCategoriesAction } from "@/modules/users/server-actions/get-user-categories.action"
import { updateUserAction } from "@/modules/users/server-actions/update-user.action"
import { CategoryBase } from "@repo/common-lib/types/category"
import { User } from "@repo/common-lib/types/user"
import { useContext, createContext, ReactNode, useState, FormEvent } from "react"



// Context type
type TabContextType = {
    user: User,
    userCategories:CategoryBase[]
    handleSubmit: (e: FormEvent<HTMLFormElement> | FormData) => Promise<void>,
    isPending: boolean,
    errors?: string[] | null,
    cleanErrors: () => void,
    reset: () => void,
    success: boolean
}

const TabContext = createContext<TabContextType | null>(null)

// Hook to use tab context
export const useTab = () => {
    const context = useContext(TabContext)
    if (!context) {
        throw new Error('useTab must be used within a TabProvider')
    }
    return context
}

// Provider component
export const TabProvider = ({
    children,
    defaultUser,
    defaultUserCategories
}: {
    children: ReactNode,
    defaultUser: User,
    defaultUserCategories: CategoryBase[]
}) => {
    const [user, setUser] = useState(defaultUser);
    const [userCategories, setUserCategories] = useState(defaultUserCategories);
    const { handleSubmit, isPending, errors, cleanErrors, success, cleanResult, reset } = useHandleAction({
        action: async (formData) => {
            return await updateUserAction(user.id, formData)
        },
        afterAction: async (result) => {
            console.log("RESULT TAB",result)
            if (result.data) {
                const userResponse = await getOneUserAction(result.data.id);
                if(result.inputs?.categories){
                    const categoriesResponse = await getUserCategoriesAction(result.data.id)
                    if(categoriesResponse.data){
                        setUserCategories(categoriesResponse.data)
                    }
                }
                if (userResponse.data) {
                    setUser(userResponse.data)
                }
            }
        },
        beforeAction: async () => {
            cleanErrors()
            cleanResult()
        }

    })

    return (
        <TabContext.Provider value={{ user,userCategories, isPending, errors, handleSubmit, cleanErrors, success, reset }}>
            {children}
        </TabContext.Provider>
    )
}

export default TabProvider
