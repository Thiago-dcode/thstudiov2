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
import { updateUserAction } from "@/modules/users/server-actions/update-user.action";
import { UserAuth } from "@/modules/auth/auth.types";
import { Pencil } from "lucide-react";
import { toast } from "@repo/ui/sonner";

type Props = {
    user: Pick<UserAuth, 'id' | 'username'>;
};

export const EditUserUsernameDialog = ({ user }: Props) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(user.username ?? '');

    const {
        handleSubmit,
        isPending,
        errors,
        inputErrors,
        success,
        reset,
        deleteInputErrorProperty,
    } = useHandleAction({
        action: async (formData: FormData) => {
            return await updateUserAction(user.id, formData);
        },
    });

    useEffect(() => {
        if (success) {
            toast.success("Username updated successfully!");
            setOpen(false);
            reset();
        }
    }, [success]);

    const handleOpenChange = (next: boolean) => {
        if (isPending) return;
        if (!next) {
            reset();
            setValue(user.username ?? '');
        }
        setOpen(next);
    };

    const isUnchanged = value.trim() === (user.username ?? '');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
                    <Pencil className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Change Username</DialogTitle>
                    <DialogDescription>
                        Choose a new username for your account.
                    </DialogDescription>
                </DialogHeader>

                <FormComponent.Container>
                    <FormComponent.Form onSubmit={handleSubmit} className="pt-2">
                        <FormComponent.LabelInput
                            label="New Username"
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            autoFocus
                            required
                            defaultValue={user.username ?? ''}
                            extraInfo="3–20 characters, letters and numbers only"
                            onChange={(e) => {
                                setValue(e.target.value);
                                deleteInputErrorProperty('username');
                            }}
                            error={inputErrors?.username}
                        />

                        <FormComponent.SubmitButton
                            isPending={isPending}
                            disabled={isPending || isUnchanged}
                        >
                            Update Username
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
