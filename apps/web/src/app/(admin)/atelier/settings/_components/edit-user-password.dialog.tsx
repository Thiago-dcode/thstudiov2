'use client'

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Errors } from "@repo/ui/components/custom/errors";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { updateUserPasswordAction } from "@/modules/users/server-actions/update-user-password.action";
import { UserAuth } from "@/modules/auth/auth.types";
import { KeyRound } from "lucide-react";
import { toast } from "@repo/ui/sonner";

type Props = {
    user: Pick<UserAuth, 'id'>;
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
    }, [success]);

    const handleOpenChange = (value: boolean) => {
        if (isPending) return;
        if (!value) reset();
        setOpen(value);
    };

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
                    <FormComponent.Form onSubmit={handleSubmit} className="pt-2">
                        <FormComponent.LabelInput
                            label="Current Password"
                            id="old_password"
                            name="old_password"
                            type="password"
                            autoComplete="current-password"
                            required
                            autoFocus
                            onChange={() => { if (errors) reset(); }}
                        />

                        <FormComponent.LabelInput
                            label="New Password"
                            id="new_password"
                            name="new_password"
                            type="password"
                            autoComplete="new-password"
                            required
                            extraInfo="8–20 characters, at least one number, no spaces"
                            onChange={() => { if (errors) reset(); }}
                        />

                        <FormComponent.SubmitButton isPending={isPending} disabled={isPending}>
                            Update Password
                        </FormComponent.SubmitButton>

                        {errors && errors.length > 0 && (
                            <Errors errors={errors} />
                        )}
                    </FormComponent.Form>
                </FormComponent.Container>
            </DialogContent>
        </Dialog>
    );
};
