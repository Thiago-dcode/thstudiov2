"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { Check, Save } from "lucide-react";
import { useCollection } from "@/modules/collections/providers/create-update-collection.provider";

export const SubmitCollectionButton = () => {
 const { canSubmit, isPending, success, currentCollection } = useCollection();

 return (
 <Button
 type="submit"
 variant="outline"
 size="sm"
 disabled={!canSubmit || isPending}
 className="gap-1.5 h-8 px-3 text-xs bg-text text-bg hover:text-text"
 >
 {isPending ? (
 <Spinner className="size-3.5" />
 ) : success ? (
 <Check className="size-3.5" />
 ) : (
 <Save className="size-3.5" />
 )}
 {currentCollection ? "Update" : "Save"}
 </Button>
 );
};
