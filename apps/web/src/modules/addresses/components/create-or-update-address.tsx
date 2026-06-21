import type { Address } from "@repo/common-lib/types/address";
import { Errors } from "@repo/ui/components/custom/errors";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/shadcn/combobox";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@repo/ui/components/shadcn/item";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoapifyFeature } from "@/lib/hooks/types/geoapify";
import { useLocationAutocomplete } from "@/lib/hooks/useGetLocation";
import { createOrUpdateAddressAction } from "@/modules/addresses/server-actions/create-or-update-address.action";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";

const getFeatureKey = (feature: GeoapifyFeature) =>
  `${feature.properties.lat}-${feature.properties.lon}-${feature.properties.formatted}`;

export const CreateOrUpdateAddress = ({
  userId,
  defaultAddress,
  onSuccess,
  onSuccessChange,
  onPendingChange,
}: {
  userId?: number;
  defaultAddress?: Address;
  onSuccess: (address: Address) => void;
  onSuccessChange?: (success: boolean) => void;
  onPendingChange?: (isPending: boolean) => void;
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(() => {
    if (
      defaultAddress?.latitude != null &&
      defaultAddress?.longitude != null &&
      defaultAddress.formated_address
    ) {
      return `${defaultAddress.latitude}-${defaultAddress.longitude}-${defaultAddress.formated_address}`;
    }
    return null;
  });
  const [inputValue, setInputValue] = useState(
    defaultAddress?.formated_address || "",
  );
  const lastSubmittedKeyRef = useRef<string | null>(null);
  const { search, loading, result } = useLocationAutocomplete();
  const { isPending, handleSubmit, errors, success } = useHandleAction({
    action: async (formData) => {
      return await createOrUpdateAddressAction(formData, defaultAddress?.id);
    },
    afterAction: async (actionResult) => {
      if (actionResult.data) {
        onSuccess(actionResult.data);
      }
    },
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

  useEffect(() => {
    if (errors?.length) {
      lastSubmittedKeyRef.current = null;
    }
  }, [errors]);

  const isLoading = loading || isPending;
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [search],
  );

  const handleValueChange = useCallback(
    (value: unknown) => {
      const key = value as string | null;
      if (!key) return;

      const feature = (result ?? []).find(
        (item) => getFeatureKey(item) === key,
      );
      if (!feature) return;
      if (lastSubmittedKeyRef.current === key) return;

      lastSubmittedKeyRef.current = key;
      setSelectedKey(key);

      const {
        formatted,
        lat,
        lon,
        country_code,
        country,
        address_line1,
        city,
        state,
      } = feature.properties;

      const formData = new FormData();
      formData.set("formated_address", formatted || "");
      formData.set("street", address_line1 || "");
      formData.set("city", city || "");
      formData.set("state", state || "");
      formData.set("zip", "");
      formData.set("country", country || "");
      formData.set("country_code", country_code || "");
      if (lat !== null && lat !== undefined)
        formData.set("latitude", lat.toString());
      if (lon !== null && lon !== undefined)
        formData.set("longitude", lon.toString());
      if (userId) {
        formData.set("user_id", userId.toString());
      }

      setInputValue(formatted);
      void handleSubmit(formData);
    },
    [handleSubmit, result, userId],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const locations = useMemo(() => result ?? [], [result]);

  return (
    <>
      <Combobox
        items={locations}
        value={selectedKey}
        onValueChange={handleValueChange}
        itemToStringLabel={(item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "properties" in item) {
            return (item as GeoapifyFeature).properties?.formatted ?? "";
          }
          return "";
        }}
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
            {loading ? (
              <Spinner />
            ) : inputValue.trim().length > 2 ? (
              "No locations found."
            ) : (
              "Type at least 3 characters to search."
            )}
          </ComboboxEmpty>
          <ComboboxList>
            {(feature: GeoapifyFeature) => {
              const props = feature.properties;
              return (
                <ComboboxItem
                  key={getFeatureKey(feature)}
                  value={getFeatureKey(feature)}
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
  );
};
