'use client'
import { useEffect, useMemo, useRef, useState } from "react";
import { useFetchApi } from "@/lib/hooks/useFetchApi";
import { getAllCategoriesAction } from "@/modules/categories/server-actions/categories.action";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { Button } from "@repo/ui/components/shadcn/button";
import FormComponent from "@/components/form-component";
import { ArrowDown } from "lucide-react";
import { ButtonStepBackFunnel, ButtonSubmitFunnel, ContainerFormFunnel, useFunnel } from "./funnel.provider";
import { CategoryBase, CategoryIndexRequest } from "@repo/common-lib/types/category";
import { FadeInDiv } from "@repo/ui/components/custom/fadeInGrid";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { cn } from "@repo/ui/lib/utils";

export function Step3Client({ userCategories }: {
    userCategories: CategoryBase[],
}) {
    const searchRef = useRef<HTMLInputElement>(null);
    const { setCanContinue } = useFunnel();
    const inputCategoryIds = useRef<HTMLInputElement>(null)
    const currentRequest = useRef<CategoryIndexRequest>({
        random: true,
    });
    const idTimeOut = useRef<NodeJS.Timeout>(null)
    const [categoriesSelected, setCategoriesSelected] = useState<{
        [id: number]: CategoryBase
    }>(userCategories.reduce((acc, current) => {
        acc[current.id] = current;
        return acc;
    }, {} as { [id: number]: CategoryBase }));
    const [categories, setCategories] = useState<{
        [id: number]: CategoryBase
    }>({});
    const categoriesValue = useMemo(() => Object.values(categories), [categories]);
    const categoriesSelectedValue = useMemo(() => Object.values(categoriesSelected), [categoriesSelected]);

    useEffect(() => {
        if (inputCategoryIds.current) {
            inputCategoryIds.current.value = '';
            if (categoriesSelectedValue.length > 0) {
                inputCategoryIds.current.value = categoriesSelectedValue.reduce((acc, curr, idx) => {
                    let str = acc + `${curr.id}`
                    if (idx !== categoriesSelectedValue.length - 1) str += ',';
                    return str;
                }, '')
                setCanContinue(true);
            }
            else {
                setCanContinue(false);
            }
        }
    }, [categoriesSelectedValue, setCanContinue]);

    const { data, isLoading, handleFetch, reset } = useFetchApi<CategoryBase[], CategoryIndexRequest>(getAllCategoriesAction, {
        params: currentRequest.current,
        callImmediately: true,
        afterFetchCallback: async (result) => {
            if (!result.error && result.data) {
                setCategories(prev => {
                    if (!result.data) return prev;
                    const newCategories = result.data.reduce((acc, current) => {
                        acc[current.id] = current;
                        return acc;
                    }, {} as { [id: number]: CategoryBase });
                    console.log(newCategories);
                    return { ...prev, ...newCategories };
                })
            }
        }
    })

    const handleOnChange = async () => {
        if (isLoading) return;
        if (idTimeOut.current) clearTimeout(idTimeOut.current)
        idTimeOut.current = setTimeout(() => {
            reset();
            if (categoriesValue.length) setCategories({});
            const search = searchRef.current?.value.trim();
            currentRequest.current.page = 1;
            currentRequest.current.random = !search;
            currentRequest.current.search = search || undefined;
            handleFetch(currentRequest.current);
            if (idTimeOut.current) clearTimeout(idTimeOut.current)
        }, 400);

    }

    return <>


        <div className="flex flex-col items-center justify-center w-full gap-2">
            <div className="flex items-end w-full gap-2">
                <FormComponent.LabelInput
                    ref={searchRef}
                    className="w-full h-12 text-base"
                    inputClassName="text-base"
                    label="Search for a category"
                    type="text"
                    id="search-category"
                    name="search-category"
                    placeholder="design..."
                    autoComplete="given-name"
                    autoFocus
                    onChange={() => {
                        handleOnChange()
                    }}
                />
                {/* <Button type="button"  className="p-2 rounded-md w-20 py-1 h-" onClick={() => {
                  
                }}>{isLoading ? <Spinner className="size-6" /> : <Search className="size-6" />}</Button> */}
            </div>
            <div className="flex flex-col items-start justify-start w-full">

                <FadeInDiv>
                    {categoriesSelectedValue.map((category) => {
                        return <Button
                            onClick={() => {
                                setCategoriesSelected((prev) => {
                                    const { [category.id]: _, ...rest } = prev;
                                    return rest;
                                })
                            }}
                            variant={'primary'}
                            size={'sm'}
                            key={category.id + 'category' + category.name}
                        >
                            {category.translation?.name || category.name}
                        </Button>
                    })}
                </FadeInDiv>
            </div>
            <div className="flex flex-col items-start justify-start gap-1  py-1 px-2 w-full">
                {categoriesValue.length > 0 && <p className="mb-1 text-sm text-text-muted">Click on the categories you want</p>}
                <div className="overflow-scroll max-h-[350p w-full">
                    {categoriesValue.length > 0 ? <>

                        <FadeInDiv dependencies={[categoriesSelectedValue.length]} >
                            {
                                categoriesValue.map((category) => {
                                    const isSelected = categoriesSelected[category.id];
                                    return <Button
                                        type="button"
                                        onClick={() => {
                                            setCategoriesSelected((prev) => {

                                                if (prev[category.id]) {
                                                    const { [category.id]: _, ...rest } = prev;
                                                    return rest;
                                                } else {
                                                    if (categoriesSelectedValue.length >= 5) return prev;
                                                    return { ...prev, [category.id]: category };
                                                }
                                            })
                                        }}
                                        size={'sm'}
                                        variant={'base'}
                                        className={cn(
                                            isSelected && 'scale-90 opacity-60'
                                        )}
                                        key={category.id + 'category' + category.name}
                                    >
                                        {category.translation?.name || category.name}
                                    </Button>
                                })
                            }

                        </FadeInDiv>
                    </> : !isLoading && data ? <p>No results</p> : isLoading ? <div className="w-full flex flex-wrap items-start justify-start gap-2">
                        {Array.from({ length: 15 }).map((_, i) => {

                            return <Skeleton key={`skeleton-${i}`} className="w-28 h-7 rounded-3xl bg-text-muted " />
                        })}
                    </div> : null}
                </div>
            </div>
            {isLoading && <Spinner className="size-6" />}
            {!isLoading && data && data.pagination?.next_page && categoriesValue.length <= 50 && <Button onClick={() => {
                currentRequest.current = {
                    ...currentRequest.current,
                    page: data.pagination?.next_page,
                }
                handleFetch(currentRequest.current)
            }} variant={'ghost'}>more <ArrowDown /></Button>}

        </div>
        <ContainerFormFunnel>
            <input ref={inputCategoryIds} type="text" name="categories" hidden />
            <ButtonSubmitFunnel />
            <ButtonStepBackFunnel />
        </ContainerFormFunnel>


    </>


}