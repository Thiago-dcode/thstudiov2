"use client";

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
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoapifyFeature } from "@/lib/hooks/types/geoapify";
import { useLocationAutocomplete } from "@/lib/hooks/useGetLocation";
import { geoapifyFeatureKey } from "../location-input";

const MIN_SEARCH_CHARS = 3;
const SEARCH_DEBOUNCE_MS = 600;

const inputClassName = cn(
  "w-full min-w-0",
  "[&_[data-slot=input-group-control]]:pl-9",
  "[&_[data-slot=input-group-control]]:text-sm",
  "[&_[data-slot=input-group-addon]_svg]:size-4",
);

const contentClassName = cn(
  "min-w-(--anchor-width) w-(--anchor-width) max-w-(--anchor-width)",
  "border border-border-em shadow-strong",
);

/**
 * Place search over the geocoder — the one picker for anything that needs a location (the
 * user's address, where a media was made).
 *
 * It only reports what was picked; saving is the caller's job, so the address form can submit
 * straight away while the upload dialog just stages the place. `selectedLabel` is the label of
 * the place already set, shown until the user starts a new search.
 */
export function LocationAutocomplete({
  id,
  label,
  placeholder,
  selectedLabel,
  onSelect,
  onClear,
  disabled = false,
  busy = false,
  labelClassName,
  positionerClassName,
}: {
  id: string;
  label: string;
  placeholder: string;
  selectedLabel?: string | null;
  onSelect: (feature: GeoapifyFeature) => void;
  /** Called when the user clears the field. Without it, the field cannot be emptied. */
  onClear?: () => void;
  disabled?: boolean;
  /** The caller is saving the pick; disables the field and marks it busy. */
  busy?: boolean;
  labelClassName?: string;
  /** Lets a picker inside a raised dialog lift its popup above that dialog. */
  positionerClassName?: string;
}) {
  const t = useTranslations("locationSearch");
  const [inputValue, setInputValue] = useState(selectedLabel ?? "");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { search, loading, result } = useLocationAutocomplete();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // Set by a pick so the close that follows it does not revert the text it just wrote.
  const justPickedRef = useRef(false);

  // The text follows the saved place whenever that changes (a pick, a clear, a row arriving).
  // It only changes on those events, so typing a new search is never overwritten.
  useEffect(() => {
    setInputValue(selectedLabel ?? "");
  }, [selectedLabel]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    },
    [],
  );

  const clear = useCallback(() => {
    setSelectedKey(null);
    setInputValue("");
    if (selectedLabel) onClear?.();
  }, [onClear, selectedLabel]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (!value.trim()) {
        if (onClear) clear();
        return;
      }
      debounceTimerRef.current = setTimeout(() => {
        if (value.trim().length >= MIN_SEARCH_CHARS) void search(value);
      }, SEARCH_DEBOUNCE_MS);
    },
    [clear, onClear, search],
  );

  const handleValueChange = useCallback(
    (value: unknown) => {
      const key = value as string | null;
      if (!key) {
        if (onClear) clear();
        return;
      }
      const feature = (result ?? []).find(
        (item) => geoapifyFeatureKey(item) === key,
      );
      if (!feature) return;
      justPickedRef.current = true;
      setSelectedKey(key);
      setInputValue(feature.properties.formatted);
      onSelect(feature);
    },
    [clear, onClear, onSelect, result],
  );

  // Closing without a pick (Escape, clicking away) drops the half-typed search, so the field never
  // shows text that is not the place actually set.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      if (justPickedRef.current) {
        justPickedRef.current = false;
        return;
      }
      setInputValue(selectedLabel ?? "");
    },
    [selectedLabel],
  );

  const features = useMemo(() => result ?? [], [result]);
  const trimmedInput = inputValue.trim();
  const canSearch = trimmedInput.length >= MIN_SEARCH_CHARS;
  const isDisabled = disabled || busy;

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>

      <div className="relative min-w-0">
        <Combobox
          items={features}
          // The geocoder already matched these to the query. Filtering them again against the
          // typed text would hide good hits whose label differs from it — "Lisboa" → "Lisbon".
          filter={null}
          value={selectedKey}
          onValueChange={handleValueChange}
          onOpenChange={handleOpenChange}
          itemToStringLabel={(item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object" && "properties" in item) {
              return (item as GeoapifyFeature).properties?.formatted ?? "";
            }
            return "";
          }}
        >
          <ComboboxInput
            id={id}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            disabled={isDisabled}
            showClear={!isDisabled && trimmedInput.length > 0}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
            aria-busy={loading || busy}
            className={inputClassName}
          />
          <ComboboxContent
            className={contentClassName}
            positionerClassName={positionerClassName}
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
                const subtitle = [props.city, props.state, props.country]
                  .filter(Boolean)
                  .join(", ");
                const key = geoapifyFeatureKey(feature);

                return (
                  <ComboboxItem
                    key={key}
                    value={key}
                    className="cursor-pointer items-start gap-2.5 py-2.5 pl-2 pr-8"
                  >
                    <MapPin
                      className="mt-0.5 size-3.5 shrink-0 text-text-muted"
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="line-clamp-2 text-sm leading-snug text-text">
                        {props.formatted}
                      </span>
                      {subtitle && subtitle !== props.formatted ? (
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

      {!canSearch && trimmedInput.length > 0 && !selectedLabel ? (
        <span className="text-xs text-text-muted">{t("minCharsHint")}</span>
      ) : null}
    </div>
  );
}
