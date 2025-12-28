"use client";

import { useFetchApi } from "@/lib/hooks/useFetchApi";
import { CategoryBase, CategoryIndexRequest } from "@repo/common-lib/types/category";
import { SuccessResponse } from "@repo/common-lib/types/response";
import { createContext, useContext, useMemo, useRef, useState, ReactNode } from "react";
import { getAllCategoriesAction } from "../server-actions/categories.action";

type UpdateCategoriesContextType = {
    categoriesResponse: SuccessResponse<CategoryBase[]> | null;
    categories: CategoryBase[];
    categoriesSelected: CategoryBase[];
    setCategoriesSelected: React.Dispatch<React.SetStateAction<{ [id: number]: CategoryBase }>>;
    handleOnChange: () => Promise<void>;
    handleFetch: (params: CategoryIndexRequest) => Promise<void>;
    searchRef: React.RefObject<HTMLInputElement | null>;
    currentRequest: React.RefObject<CategoryIndexRequest>;
    isLoading: boolean;
};

const UpdateCategoriesContext = createContext<UpdateCategoriesContextType | null>(null);

type UpdateCategoriesProviderProps = {
    children: ReactNode;
    userCategories: CategoryBase[];
};

export const UpdateCategoriesProvider = ({ children, userCategories }: UpdateCategoriesProviderProps) => {
    const searchRef = useRef<HTMLInputElement>(null);
    const currentRequest = useRef<CategoryIndexRequest>({
        random: true,
    });
    const idTimeOut = useRef<NodeJS.Timeout>(null);
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
                    return { ...prev, ...newCategories };
                });
            }
        }
    });

    const handleOnChange = async () => {
        if (isLoading) return;
        if (idTimeOut.current) clearTimeout(idTimeOut.current);
        idTimeOut.current = setTimeout(() => {
            reset();
            if (categoriesValue.length) setCategories({});
            const search = searchRef.current?.value.trim();
            currentRequest.current.page = 1;
            currentRequest.current.random = !search;
            currentRequest.current.search = search || undefined;
            handleFetch(currentRequest.current);
            if (idTimeOut.current) clearTimeout(idTimeOut.current);
        }, 400);
    };

    const value: UpdateCategoriesContextType = {
        categoriesResponse: data,
        categories: categoriesValue,
        categoriesSelected: categoriesSelectedValue,
        setCategoriesSelected,
        handleOnChange,
        handleFetch,
        searchRef,
        currentRequest,
        isLoading
    };

    return (
        <UpdateCategoriesContext.Provider value={value}>
            {children}
        </UpdateCategoriesContext.Provider>
    );
};

export const useUpdateCategories = () => {
    const context = useContext(UpdateCategoriesContext);
    if (!context) {
        throw new Error("useUpdateCategories must be used within an UpdateCategoriesProvider");
    }
    return context;
};

