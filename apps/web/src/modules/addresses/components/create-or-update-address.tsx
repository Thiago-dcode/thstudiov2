import { GeoapifyFeature } from "@/lib/hooks/types/geoapify";
import { useLocationAutocomplete } from "@/lib/hooks/useGetLocation";
import { Address } from "@repo/common-lib/types/address";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem } from "@repo/ui/components/shadcn/combobox";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@repo/ui/components/shadcn/item";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createOrUpdateAddressAction } from "@/modules/addresses/server-actions/create-or-update-address.action";
import { Errors } from "@repo/ui/components/custom/errors";
import { Spinner } from "@repo/ui/components/shadcn/spinner";

export const CreateOrUpdateAddress = ({userId,defaultAddress,onSuccess,onSuccessChange,onPendingChange}:{
    userId?:number,
    defaultAddress?:Address,
    onSuccess: (address:Address)=>void;
    onSuccessChange?: (success: boolean) => void;
    onPendingChange?: (isPending: boolean) => void;
})=>{

    const [selectedLocation, setSelectedLocation] = useState<GeoapifyFeature | null>(null);
    const [inputValue, setInputValue] = useState(defaultAddress?.formated_address || '');
    const { search, loading, result } = useLocationAutocomplete();
    const { isPending, handleSubmit, errors, success } = useHandleAction({
        action: async (formData) => {
            return await createOrUpdateAddressAction(formData, defaultAddress?.id)
        },
        afterAction: async (actionResult) => {
            if (actionResult.data) {
                onSuccess(actionResult.data);
            }
        }
    });

    useEffect(() => {
        if (onSuccessChange) {
            onSuccessChange(success);
        }
    }, [success, onSuccessChange]);

    useEffect(() => {
        if (onPendingChange) {
            onPendingChange(isPending);
        }
    }, [isPending, onPendingChange]);
    const isLoading = loading || isPending;
    const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (value.trim().length > 2) {
                search(value);
            }
        }, 1000);
    }, [search]);
    
    const handleValueChange = useCallback((feature: GeoapifyFeature | null) => {
        console.log("VALUE CHANGING",feature)
        if (feature) {
            setSelectedLocation(feature);
            const {formatted, lat, lon, country_code, country, address_line1, city, state} = feature.properties;
        
            // Convert address to FormData
            const formData = new FormData();
            formData.set('formated_address', formatted || '');
            formData.set('street', address_line1 || '');
            formData.set('city', city || '');
            formData.set('state', state || '');
            formData.set('zip', '');
            formData.set('country', country || '');
            formData.set('country_code', country_code || '');
            if (lat !== null && lat !== undefined) formData.set('latitude', lat.toString());
            if (lon !== null && lon !== undefined) formData.set('longitude', lon.toString());
            if (userId) {
                formData.set('user_id', userId.toString());
            }

            setInputValue(formatted);
            handleSubmit(formData);
        }
    }, [handleSubmit, userId]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const locations = result || [];


    return (
        <>
            <Combobox
                items={locations}
                value={selectedLocation}
                onValueChange={handleValueChange}
            >
                <ComboboxInput
                    placeholder="Search for your address..."
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full h-14"
                />
                <ComboboxContent>
                    <ComboboxEmpty>
                        {loading ? <Spinner/> : inputValue.trim().length > 2 ? 'No locations found.' : 'Type at least 3 characters to search.'}
                    </ComboboxEmpty>
                    <ComboboxList >
                        {(feature: GeoapifyFeature) => {
                            const props = feature.properties;
                            return (
                                <ComboboxItem 
                                    key={`${props.lat}-${props.lon}`} 
                                    value={feature} 
                                    className="cursor-pointer"
                                >
                                    <Item size="sm" className="p-0 pointer-events-none">
                                        <ItemContent>
                                            <ItemTitle className="whitespace-nowrap">
                                                {props.formatted}
                                            </ItemTitle>
                                            <ItemDescription>
                                                {props.city && props.state
                                                    ? `${props.city}, ${props.state}, ${props.country}`
                                                    : props.country}
                                            </ItemDescription>
                                        </ItemContent>
                                    </Item>
                                </ComboboxItem>
                            );
                        }}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
            <Errors errors={errors || []} />
        </>
    )
}