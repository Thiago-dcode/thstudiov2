'use client'
import { useEffect, useRef } from "react";

import { ButtonStepBackFunnel, ButtonSubmitFunnel, ContainerFormFunnel, useFunnel } from "./funnel.provider";

import { UserCategoriesComponent } from "@/modules/categories/components/user-categories.component";
import { useUpdateCategories } from "@/modules/categories/providers/update-user-categories.provider";


export function Step3Client() {
    const {categoriesSelected} =useUpdateCategories()
    const { setCanContinue } = useFunnel();
    const inputCategoryIds = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (inputCategoryIds.current) {
            inputCategoryIds.current.value = '';
            if (categoriesSelected.length > 0) {
                inputCategoryIds.current.value = categoriesSelected.reduce((acc, curr, idx) => {
                    let str = acc + `${curr.id}`
                    if (idx !== categoriesSelected.length - 1) str += ',';
                    return str;
                }, '')
                setCanContinue(true);
            }
            else {
                setCanContinue(false);
            }
        }
    }, [categoriesSelected, setCanContinue]);

    return <>
    <UserCategoriesComponent/>
        <ContainerFormFunnel className="sticky bottom-0 bg-bg p-2">
            <input ref={inputCategoryIds} type="text" name="categories" hidden />
            <ButtonSubmitFunnel />
            <ButtonStepBackFunnel />
        </ContainerFormFunnel>


    </>


}