
'use client'
import { useEffect } from "react"
import { UserAuth } from "../auth.types"
import { deleteUserSession, setUserSession } from "../server-actions/user-session.action"
import { useRouter } from "next/navigation"

export const SetSessionClient = ({ userAuth, redirect }: {
    userAuth: UserAuth,
    redirect: string
}) => {
    const router = useRouter();
    useEffect(() => {
        deleteUserSession().then(() => {
            setUserSession(userAuth).then(() => {
                console.log('setting client session')
                router.push(redirect);
            })
        }).catch(() => {
            router.push(redirect);
        })

    }, [userAuth, redirect])


    return <></>
}