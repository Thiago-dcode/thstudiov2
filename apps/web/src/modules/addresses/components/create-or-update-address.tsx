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
import { Label } from "@repo/ui/components/shadcn/label";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { Loader2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoapifyFeature } from "@/lib/hooks/types/geoapify";
import { useLocationAutocomplete } from "@/lib/hooks/useGetLocation";
import { createOrUpdateAddressAction } from "@/modules/addresses/server-actions/create-or-update-address.action";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";

const ADDRESS_INPUT_ID = "address-search";

const addressComboboxInputClassName = cn(
  "w-full min-w-0",
  "[&_[data-slot=input-group-control]]:pl-9",
  "[&_[data-slot=input-group-control]]:text-sm",
  "[&_[data-slot=input-group-addon]_svg]:size-4",
);

const addressComboboxContentClassName = cn(
  "min-w-(--anchor-width) w-(--anchor-width) max-w-(--anchor-width)",
  "border border-border-em shadow-strong",
);

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
  const t = useTranslations("addressForm");
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
  const trimmedInput = inputValue.trim();
  const canSearch = trimmedInput.length > 2;
  const showHint = !canSearch && trimmedInput.length > 0;
  const showSaving = isPending;

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <Label
        htmlFor={ADDRESS_INPUT_ID}
        className="text-xs tracking-wide text-text-muted"
      >
        {t("label")}
      </Label>

      <div className="relative min-w-0">
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
            id={ADDRESS_INPUT_ID}
            name="address-search"
            placeholder={t("searchPlaceholder")}
            value={inputValue}
            onChange={handleInputChange}
            disabled={isLoading}
            showClear={!isLoading && trimmedInput.length > 0}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
            aria-busy={isLoading}
            className={addressComboboxInputClassName}
          />
          <ComboboxContent
            className={addressComboboxContentClassName}
            sideOffset={4}
          >
            <ComboboxEmpty className="flex-col gap-2 px-3 py-4 text-xs">
              {loading ? (
                <>
                  <Spinner className="size-4" />
                  <span>{t("searching")}</span>
                </>
              ) : canSearch ? (
                t("noLocations")
              ) : (
                t("minCharsHint")
              )}
            </ComboboxEmpty>
            <ComboboxList className="p-1">
              {(feature: GeoapifyFeature) => {
                const props = feature.properties;
                const subtitle =
                  props.city && props.state
                    ? `${props.city}, ${props.state}, ${props.country}`
                    : props.country;

                return (
                  <ComboboxItem
                    key={getFeatureKey(feature)}
                    value={getFeatureKey(feature)}
                    className="cursor-pointer items-start gap-2.5 py-2.5 pl-2 pr-8"
                  >
                    <MapPin
                      className="mt-0.5 size-3.5 shrink-0 text-text-muted"
                      aria-hidden
                    />
                    <span className="min-w-0 flex flex-1 flex-col gap-0.5">
                      <span className="line-clamp-2 text-sm leading-snug text-text">
                        {props.formatted}
                      </span>
                      {subtitle ? (
                        <span className="line-clamp-1 text-xs text-text-muted">
                          {subtitle}
                        </span>
                      ) : null}
                    </span>
                  </ComboboxItem>
                );
              }}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <MapPin
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
      </div>

      {showSaving ? (
        <p
          className="flex items-center gap-2 text-xs text-text-muted"
          aria-live="polite"
        >
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          {t("saving")}
        </p>
      ) : showHint ? (
        <p className="text-xs text-text-muted">{t("minCharsHint")}</p>
      ) : null}

      <Errors errors={errors || []} />
    </div>
  );
};
