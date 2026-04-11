"use client"

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { getOneUserAction } from "@/modules/users/server-actions/get-one-user.action"
import { getUserCategoriesAction } from "@/modules/users/server-actions/get-user-categories.action"
import { updateUserAction } from "@/modules/users/server-actions/update-user.action"
import { Address } from "@repo/common-lib/types/address"
import { CategoryBase } from "@repo/common-lib/types/category"
import { User } from "@repo/common-lib/types/user"
import { useContext, createContext, ReactNode, useState, FormEvent } from "react"



// Context type
type EditUserContextType = {
    user: User,
    address?: Address,
    setAddress: (address: Address | undefined) => void,
    userCategories: CategoryBase[]
    handleSubmit: (e: FormEvent<HTMLFormElement> | FormData) => Promise<void>,
    isPending: boolean,
    errors?: string[] | null,
    inputErrors?: Record<string, string>,
    cleanErrors: () => void,
    deleteInputErrorProperty: (key: string) => void,
    reset: () => void,
    success: boolean
}

const EditUserContext = createContext<EditUserContextType | null>(null)

// Hook to use edit user context
export const useEditUser = () => {
    const context = useContext(EditUserContext)
    if (!context) {
        throw new Error('useEditUser must be used within a EditUserProvider')
    }
    return context
}

// Provider component
export const EditUserProvider = ({
    children,
    defaultUser,
    defaultAddress,
    defaultUserCategories
}: {
    children: ReactNode,
    defaultUser: User,
    defaultAddress?: Address,
    defaultUserCategories: CategoryBase[]
}) => {
    const [user, setUser] = useState(defaultUser);
    const [address, setAddress] = useState(defaultAddress)
    const [userCategories, setUserCategories] = useState(defaultUserCategories);
    const { handleSubmit, isPending, errors, inputErrors, cleanErrors, deleteInputErrorProperty, success, cleanResult, reset } = useHandleAction({
        action: async (formData) => {
            return await updateUserAction(user.id, formData!)
        },
        afterAction: async (result) => {
            if (result.data) {
                const userResponse = await getOneUserAction(result.data.id);
                if (result.inputs?.categories) {
                    const categoriesResponse = await getUserCategoriesAction(result.data.id)
                    if (categoriesResponse.data) {
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

    });
    return (
        <EditUserContext.Provider value={{ user, address, setAddress, userCategories, isPending, errors, inputErrors, handleSubmit, cleanErrors, deleteInputErrorProperty, success, reset }}>
            {children}
        </EditUserContext.Provider>
    )
}

export default EditUserProvider
