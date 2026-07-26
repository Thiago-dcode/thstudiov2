import { FadeInDiv } from "@repo/ui/components/custom/fadeInGrid";
import { Button } from "@repo/ui/components/shadcn/button";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import FormComponent from "@/lib/components/form-component";
import { useUpdateCategories } from "../providers/categories.provider";

export const UserCategoriesComponent = ({
  title,
  compact = false,
}: {
  title?: string;
  compact?: boolean;
} = {}) => {
  const t = useTranslations("userCategories");
  const {
    searchRef,
    categories,
    categoriesResponse,
    categoriesSelected,
    handleFetch,
    handleOnChange,
    isLoading,
    handleSelectCategory,
    isSelected,
    currentRequest,
  } = useUpdateCategories();

  return (
    <div className="flex flex-col items-center justify-center w-full gap-2">
      {title && (
        <h3 className="w-full text-left text-base font-medium">{title}</h3>
      )}
      <div className="flex items-end w-full gap-2">
        <FormComponent.LabelInput
          ref={searchRef}
          className={cn("w-full text-base", compact ? "h-10 text-sm" : "h-12")}
          inputClassName={cn(compact ? "text-sm" : "text-base")}
          label={t("searchLabel")}
          type="text"
          id="search-category"
          name="search-category"
          placeholder={t("searchPlaceholder")}
          autoComplete="given-name"
          autoFocus
          onChange={() => {
            handleOnChange();
          }}
        />
        {/* <Button type="button" className="p-2 w-20 py-1 h-" onClick={() => {
 
 }}>{isLoading ? <Spinner className="size-6" /> : <Search className="size-6" />}</Button> */}
      </div>
      <div className="pt-2 flex flex-col items-start justify-start w-full">
        <FadeInDiv dependencies={[categoriesSelected.length]}>
          {categoriesSelected.map((category) => {
            return (
              <Button
                onClick={() => {
                  handleSelectCategory(category);
                }}
                variant={"primary"}
                size={"sm"}
                key={`${category.id}category${category.name}`}
              >
                {category.name}
              </Button>
            );
          })}
        </FadeInDiv>
      </div>
      <div className="flex flex-col items-start justify-start gap-1 pt-4 py-1 px-2 w-full">
        {categories.length > 0 && (
          <p className="mb-1 text-sm text-text-muted">{t("clickHint")}</p>
        )}
        <div
          className={cn(
            "overflow-y-auto overflow-x-hidden w-full",
            compact ? "max-h-[140px]" : "max-h-[250px]",
          )}
        >
          {categories.length > 0 ? (
            <FadeInDiv dependencies={[categoriesSelected.length]}>
              {categories.map((category) => {
                return (
                  <Button
                    type="button"
                    onClick={() => {
                      handleSelectCategory(category);
                    }}
                    size={"sm"}
                    variant={"base"}
                    className={cn(
                      isSelected(category) && "scale-90 opacity-60",
                    )}
                    key={`${category.id}category${category.name}`}
                  >
                    {category.name}
                  </Button>
                );
              })}
            </FadeInDiv>
          ) : !isLoading && categoriesResponse ? (
            <p>{t("noResults")}</p>
          ) : isLoading ? (
            <div className="w-full flex flex-wrap items-start justify-start gap-2">
              {Array.from({ length: 15 }).map((_, i) => {
                return (
                  <Skeleton
                    key={`skeleton-${i}`}
                    className="w-28 h-7 bg-text-muted "
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      {isLoading && <Spinner className="size-6" />}
      {!isLoading &&
        categoriesResponse &&
        categoriesResponse.pagination?.next_page &&
        categories.length <= 50 && (
          <Button
            onClick={() => {
              currentRequest.current = {
                ...currentRequest.current,
                page: categoriesResponse.pagination?.next_page,
              };
              handleFetch(currentRequest.current);
            }}
            variant={"ghost"}
          >
            {t("loadMore")} <ArrowDown />
          </Button>
        )}
    </div>
  );
};
