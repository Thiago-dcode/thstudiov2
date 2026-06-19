"use client";

import { foldLatinDiacriticsForMatch } from "@repo/common-lib/utils/fold-latin-diacritics";
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
import { useEffect, useMemo, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getCitiesAction } from "@/modules/locations/server-actions/get-cities.action";
import { getCountriesAction } from "@/modules/locations/server-actions/get-countries.action";
import { getStatesAction } from "@/modules/locations/server-actions/get-states.action";
import { artistsFilterComboboxInputClassName } from "./artists-filter-combobox-input-class";
import { useFilters } from "./filters.provider";

function locationNamesMatch(
 filterVal: string | undefined,
 entityName: string,
): boolean {
 if (filterVal === undefined || filterVal.trim() === "") return false;
 return (
 foldLatinDiacriticsForMatch(filterVal) ===
 foldLatinDiacriticsForMatch(entityName)
 );
}

type LocationEntity = { id: number; name: string };

function LocationEntityCombobox({
 label,
 items,
 valueId,
 onValueChange,
 disabled,
 pending,
 placeholder,
}: {
 label: string;
 items: LocationEntity[];
 valueId: number | undefined;
 onValueChange: (id: number | undefined) => void;
 disabled: boolean;
 pending: boolean;
 placeholder: string;
}) {
 const selected = useMemo(
 () =>
 valueId !== undefined ? items.find((i) => i.id === valueId) : undefined,
 [items, valueId],
 );

 const [inputValue, setInputValue] = useState(selected?.name ?? "");

 useEffect(() => {
 if (selected) {
 setInputValue(selected.name);
 } else if (valueId === undefined) {
 setInputValue("");
 }
 }, [selected, valueId]);

 const filtered = useMemo(
 () =>
 items.filter((i) =>
 i.name.toLowerCase().includes(inputValue.toLowerCase().trim()),
 ),
 [items, inputValue],
 );

 const busy = disabled || pending;

 return (
 <div className="flex flex-col gap-1 w-full">
 <Label className=" font-medium text-xs! uppercase tracking-[0.12em] leading-none text-text-muted">
 {label}
 </Label>
 <div className="">
 <Combobox
 value={valueId !== undefined ? String(valueId) : null}
 onValueChange={(val) => {
 const id = val ? Number(val) : undefined;
 onValueChange(
 Number.isFinite(id as number) ? (id as number) : undefined,
 );
 }}
 items={items}
 filteredItems={filtered}
 itemToStringLabel={(item) => (item as LocationEntity).name}
 >
 <ComboboxInput
 placeholder={placeholder}
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 disabled={busy}
 showClear={!busy}
 className={artistsFilterComboboxInputClassName}
 />
 <ComboboxContent className={"w-md"}>
 <ComboboxEmpty>
 {pending && items.length === 0 ? (
 <Spinner className="mx-auto size-3" />
 ) : filtered.length === 0 && items.length > 0 ? (
 "No matches."
 ) : items.length === 0 && !pending ? (
 "—"
 ) : null}
 </ComboboxEmpty>
 <ComboboxList className={"w-full"}>
 {filtered.map((item) => (
 <ComboboxItem
 key={item.id}
 value={String(item.id)}
 className="cursor-pointer py-1.5 pl-1.5 pr-6 text-[11px] leading-tight"
 >
 <span className="line-clamp-1">{item.name}</span>
 </ComboboxItem>
 ))}
 </ComboboxList>
 </ComboboxContent>
 </Combobox>
 </div>
 </div>
 );
}

const LocationFilter = () => {
 const { filters, add, delete: deleteFilter } = useFilters();

 const [selectedCountryId, setSelectedCountryId] = useState<
 number | undefined
 >();
 const [selectedStateId, setSelectedStateId] = useState<number | undefined>();
 const [selectedCityId, setSelectedCityId] = useState<number | undefined>();

 const {
 handleAction: loadCountries,
 result: countriesResult,
 isPending: countriesPending,
 errors: countriesErrors,
 } = useHandleAction({
 action: async () => getCountriesAction(),
 });

 const {
 handleAction: loadStates,
 result: statesResult,
 isPending: statesPending,
 errors: statesErrors,
 cleanResult: cleanStatesResult,
 } = useHandleAction({
 action: async () =>
 getStatesAction(
 selectedCountryId ? { country_id: selectedCountryId } : undefined,
 ),
 });

 const {
 handleAction: loadCities,
 result: citiesResult,
 isPending: citiesPending,
 errors: citiesErrors,
 cleanResult: cleanCitiesResult,
 } = useHandleAction({
 action: async () =>
 getCitiesAction(
 selectedStateId !== undefined && selectedCountryId !== undefined
 ? { state_id: selectedStateId, country_id: selectedCountryId }
 : undefined,
 ),
 });

 const countries = countriesResult?.data ?? [];
 const states = statesResult?.data ?? [];
 const cities = citiesResult?.data ?? [];

 useEffect(() => {
 void loadCountries();
 }, [loadCountries]);

 /** Sync country selection from filters (e.g. URL searchParams → FiltersProvider). */
 useEffect(() => {
 const name = filters.country?.trim();
 if (!name) {
 setSelectedCountryId(undefined);
 return;
 }
 if (countries.length === 0) return;
 const match = countries.find((c) => locationNamesMatch(name, c.name));
 setSelectedCountryId(match?.id);
 }, [countries, filters.country]);

 /** Sync state selection once states for the selected country are loaded. */
 useEffect(() => {
 if (!selectedCountryId) {
 setSelectedStateId(undefined);
 return;
 }
 const name = filters.state?.trim();
 if (!name) {
 setSelectedStateId(undefined);
 return;
 }
 if (states.length === 0) return;
 const match = states.find((s) => locationNamesMatch(name, s.name));
 setSelectedStateId(match?.id);
 }, [states, filters.state, selectedCountryId]);

 /** Sync city selection once cities for the selected state are loaded. */
 useEffect(() => {
 if (selectedCountryId === undefined || selectedStateId === undefined) {
 setSelectedCityId(undefined);
 return;
 }
 const name = filters.city?.trim();
 if (!name) {
 setSelectedCityId(undefined);
 return;
 }
 if (cities.length === 0) return;
 const match = cities.find((c) => locationNamesMatch(name, c.name));
 setSelectedCityId(match?.id);
 }, [cities, filters.city, selectedCountryId, selectedStateId]);

 useEffect(() => {
 if (!selectedCountryId) {
 cleanStatesResult();
 return;
 }
 void loadStates();
 }, [selectedCountryId, cleanStatesResult, loadStates]);

 useEffect(() => {
 if (selectedStateId === undefined || selectedCountryId === undefined) {
 cleanCitiesResult();
 return;
 }
 void loadCities();
 }, [selectedStateId, selectedCountryId, cleanCitiesResult, loadCities]);

 const onCountryChange = (id: number | undefined) => {
 setSelectedCountryId(id);
 setSelectedStateId(undefined);
 setSelectedCityId(undefined);
 deleteFilter("state");
 deleteFilter("city");
 cleanStatesResult();
 cleanCitiesResult();

 const country = countries.find((c) => c.id === id);
 if (country) {
 add("country", country.name);
 } else {
 deleteFilter("country");
 }
 };

 const onStateChange = (id: number | undefined) => {
 setSelectedStateId(id);
 setSelectedCityId(undefined);
 deleteFilter("city");
 cleanCitiesResult();

 const state = states.find((s) => s.id === id);
 if (state) {
 add("state", state.name);
 } else {
 deleteFilter("state");
 }
 };

 const onCityChange = (id: number | undefined) => {
 setSelectedCityId(id);

 const city = cities.find((c) => c.id === id);
 if (city) {
 add("city", city.name);
 } else {
 deleteFilter("city");
 }
 };

 const locationError = [countriesErrors, statesErrors, citiesErrors]
 .flatMap((e) => e ?? [])
 .join(" ");

 return (
 <div className="flex w-full max-w-full flex-col gap-4">
 <div
 role="group"
 aria-label="Location filters"
 className="flex flex-col gap-3"
 >
 <LocationEntityCombobox
 label="Country"
 items={countries}
 valueId={selectedCountryId}
 onValueChange={onCountryChange}
 disabled={false}
 pending={countriesPending}
 placeholder="Search…"
 />

 <LocationEntityCombobox
 label="State / region"
 items={states}
 valueId={selectedStateId}
 onValueChange={onStateChange}
 disabled={!selectedCountryId}
 pending={statesPending}
 placeholder={selectedCountryId ? "Search…" : "—"}
 />

 <LocationEntityCombobox
 label="City"
 items={cities}
 valueId={selectedCityId}
 onValueChange={onCityChange}
 disabled={
 selectedCountryId === undefined || selectedStateId === undefined
 }
 pending={citiesPending}
 placeholder={selectedCountryId && selectedStateId ? "Search…" : "—"}
 />
 </div>

 {locationError ? (
 <p className="text-[10px] leading-snug text-error" role="alert">
 {locationError}
 </p>
 ) : null}
 </div>
 );
};

export default LocationFilter;
