'use client'
import { useEffect, useRef } from "react";
import { useFetchApi } from "@/lib/hooks/useFetchApi";
import { getAllCategoriesAction } from "@/modules/server-actions/categories.action";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { Button } from "@repo/ui/components/shadcn/button";
import FormComponent from "@/components/form-component";
import { Search } from "lucide-react";
import { ButtonStepBackFunnel, ButtonSubmitFunnel, ContainerFormFunnel } from "./funnel.provider";

export default function Step3() {
    const searchRef = useRef<HTMLInputElement>(null)
    // const { user, inputs, setInputs, handleOnChange } = useFunnel();
    const { data, error, isLoading, handleFetch } = useFetchApi(getAllCategoriesAction, {
        callInmediately: false
    })
    useEffect(() => {

        console.log(data)

    }, [data])


    return <>
        <div className="w-full">
            <div className="flex items-end w-full">
                <FormComponent.LabelInput
                    ref={searchRef}
                    className="w-full"
                    label="First Name"
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your first name"
                    autoComplete="given-name"
                    autoFocus
                />
                <Button type="button" variant={'ghost'} onClick={() => {
                    const search = searchRef.current?.value.trim();
                    if (search) handleFetch({
                        search,
                    })

                }}>{isLoading ? <Spinner className="size-6" /> : <Search className="size-6" />}</Button>
            </div>
            <div>
                {
                    data && data.data?.map((category) => {

                        return <p key={category.id}>{category.translation?.name || category.name}</p>
                    })
                }

            </div>

            <ContainerFormFunnel>

                <ButtonSubmitFunnel />
                <ButtonStepBackFunnel />
            </ContainerFormFunnel>
        </div>

    </>


}