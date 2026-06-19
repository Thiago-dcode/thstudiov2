"use client";

import { MAX_PASSWORD_RESET } from "@repo/common-lib/constants/constants";
import type { User } from "@repo/common-lib/types/user";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { toast } from "@repo/ui/sonner";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { updateUserPasswordAction } from "@/modules/users/server-actions/update-user-password.action";

type Props = {
 user: User;
};

export const EditUserPasswordDialog = ({ user }: Props) => {
 const [open, setOpen] = useState(false);

 const { handleSubmit, isPending, errors, success, reset } = useHandleAction({
 action: async (formData: FormData) => {
 return await updateUserPasswordAction(user.id, formData);
 },
 });

 useEffect(() => {
 if (success) {
 toast.success("Password updated successfully!");
 setOpen(false);
 reset();
 }
 }, [success, reset]);

 const handleOpenChange = (value: boolean) => {
 if (isPending) return;
 if (!value) reset();
 setOpen(value);
 };

 const resetDate = user.next_password_reset
 ? new Date(user.next_password_reset as unknown as string)
 : null;
 const periodExpired = resetDate && new Date() >= resetDate;
 const effectiveCount = periodExpired ? 0 : (user.password_reset_count ?? 0);
 const maxResetReached = effectiveCount >= MAX_PASSWORD_RESET;
 const remaining = MAX_PASSWORD_RESET - effectiveCount;

 const resetDateFormatted =
 resetDate && !periodExpired
 ? resetDate.toLocaleDateString("en-US", {
 month: "long",
 day: "numeric",
 year: "numeric",
 })
 : null;

 return (
 <Dialog open={open} onOpenChange={handleOpenChange}>
 <DialogTrigger asChild>
 <Button variant="outline" size="sm" className="gap-2">
 <KeyRound className="size-4" />
 Change Password
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-sm">
 <DialogHeader>
 <DialogTitle>Change Password</DialogTitle>
 <DialogDescription>
 Enter your current password and choose a new one.
 </DialogDescription>
 </DialogHeader>

 <FormComponent.Container>
 {maxResetReached ? (
 <div className=" border border-error/30 bg-error/5 px-4 py-3 text-sm space-y-1">
 <p className="font-medium text-error">Monthly limit reached</p>
 <p className="text-text-muted">
 You've used all {MAX_PASSWORD_RESET} password changes for this
 period.
 {resetDateFormatted && (
 <>
 {" "}
 Available again on{" "}
 <span className="font-medium text-text">
 {resetDateFormatted}
 </span>
 .
 </>
 )}
 </p>
 </div>
 ) : (
 <FormComponent.Form onSubmit={handleSubmit} className="pt-2">
 <FormComponent.LabelInput
 label="Current Password"
 id="old_password"
 name="old_password"
 type="password"
 autoComplete="current-password"
 required
 autoFocus
 onChange={() => {
 if (errors) reset();
 }}
 />

 <FormComponent.LabelInput
 label="New Password"
 id="new_password"
 name="new_password"
 type="password"
 autoComplete="new-password"
 required
 extraInfo="8–20 characters, at least one number, no spaces"
 onChange={() => {
 if (errors) reset();
 }}
 />

 {effectiveCount > 0 && (
 <p className="text-xs text-text-muted">
 {remaining} of {MAX_PASSWORD_RESET} change
 {remaining !== 1 ? "s" : ""} remaining this month
 {resetDateFormatted && <> · resets on {resetDateFormatted}</>}
 </p>
 )}

 <FormComponent.SubmitButton
 isPending={isPending}
 disabled={isPending}
 >
 Update Password
 </FormComponent.SubmitButton>

 {errors && errors.length > 0 && <Errors errors={errors} />}
 </FormComponent.Form>
 )}
 </FormComponent.Container>
 </DialogContent>
 </Dialog>
 );
};
