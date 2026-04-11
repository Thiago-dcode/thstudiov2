import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { getUserBenefitAction } from "../server-actions/get-user-benefit.action"
import { useEffect } from "react";


const UserBenefitModal = ({userId}:{userId:number})=>{

const {handleAction,result} = useHandleAction({
    action: async ()=>{
        return await getUserBenefitAction(userId);
    }
});

useEffect(()=>{
    if(result)return;
    handleAction();
},[userId,result]);

const userBenefit = result?.data;
if(!userBenefit) return null;



return <Modal></>


}