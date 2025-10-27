'use client'
import { useFunnel } from "./funnelProvider"

export default function Step1() {

    const {user} = useFunnel();

    return <div>{user?.username + ' Step: ' + user?.funnel_step}</div>
}