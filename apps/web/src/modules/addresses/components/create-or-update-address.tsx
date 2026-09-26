import type { Address } from "@repo/common-lib/types/address";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoapifyFeature } from "@/lib/hooks/types/geoapify";
import { createOrUpdateAddressAction } from "@/modules/addresses/server-actions/create-or-update-address.action";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { LocationAutocomplete } from "@/modules/locations/components/location-autocomplete";
import { geoapifyFeatureKey } from "@/modules/locations/location-input";

const ADDRESS_INPUT_ID = "address-search";

export const CreateOrUpdateAddress = ({
  userId,
  defaultAddress,
  onSuccess,
  onSuccessChange,
  onPendingChange,
  requireConfirm = false,
}: {
  userId?: number;
  defaultAddress?: Address;
  onSuccess: (address: Address) => void;
  onSuccessChange?: (success: boolean) => void;
  onPendingChange?: (isPending: boolean) => void;
  /** Stage the picked place and save it only when the user confirms. */
  requireConfirm?: boolean;
}) => {
  const t = useTranslations("addressForm");
  const lastSubmittedKeyRef = useRef<string | null>(null);
  const [pendingFeature, setPendingFeature] = useState<GeoapifyFeature | null>(
    null,
  );
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

  const submitFeature = useCallback(
    (feature: GeoapifyFeature) => {
      const key = geoapifyFeatureKey(feature);
      if (lastSubmittedKeyRef.current === key) return;
      lastSubmittedKeyRef.current = key;

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

      void handleSubmit(formData);
    },
    [handleSubmit, userId],
  );

  // Without `requireConfirm` a pick saves straight away (the onboarding step has no submit);
  // with it, the pick is only staged until the user presses save.
  const handleSelect = useCallback(
    (feature: GeoapifyFeature) => {
      if (requireConfirm) {
        setPendingFeature(feature);
        return;
      }
      submitFeature(feature);
    },
    [requireConfirm, submitFeature],
  );

  const isUnchanged =
    !pendingFeature ||
    pendingFeature.properties.formatted === defaultAddress?.formated_address;

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <LocationAutocomplete
        id={ADDRESS_INPUT_ID}
        label={t("label")}
        labelClassName="text-xs tracking-wide text-text-muted"
        placeholder={t("searchPlaceholder")}
        selectedLabel={defaultAddress?.formated_address}
        onSelect={handleSelect}
        busy={isPending}
      />

      {requireConfirm ? (
        <div className="pt-3">
          <Button
            type="button"
            size="sm"
            disabled={isUnchanged || isPending}
            onClick={() => pendingFeature && submitFeature(pendingFeature)}
          >
            {t("confirm")}
          </Button>
        </div>
      ) : null}

      {isPending ? (
        <p
          className="flex items-center gap-2 text-xs text-text-muted"
          aria-live="polite"
        >
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          {t("saving")}
        </p>
      ) : null}

      <Errors errors={errors || []} />
    </div>
  );
};
