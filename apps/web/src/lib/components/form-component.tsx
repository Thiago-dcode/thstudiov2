import { cn } from "@repo/ui/lib/utils";
import { ReactNode, forwardRef } from "react";
import { Label } from "@repo/ui/components/shadcn/label";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Button, ButtonProps } from "@repo/ui/components/shadcn/button";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@repo/ui/components/shadcn/hover-card";
import { Check, Info } from "lucide-react";


const Container = ({ children, className }: {
    children: ReactNode,
    className?: string
}) => {

    return <div className={cn("w-full h-full flex items-center flex-col gap-4", className)}>{children}</div>
}

const Form = forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(({
    children,
    className,
    ...props
}, ref) => {
    return (
        <form
            ref={ref}
            {...props}
            className={cn("w-full h-full flex flex-col gap-4", className)}
        >
            {children}
        </form>
    );
});

Form.displayName = "Form";

const Field = ({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("space-y-1 w-full", className)}>
            {children}
        </div>
    );
};

const FieldWithIcon = ({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("relative", className)}>
            {children}
        </div>
    );
};

const Actions = ({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("w-full flex items-center flex-col gap-4 mt-6", className)}>
            {children}
        </div>
    );
};

const Errors = ({
    children,
    className
}: {
    children?: ReactNode;
    className?: string;
}) => {
    if (!children) return null;

    return (
        <div className={cn("w-full", className)}>
            {children}
        </div>
    );
};

const CheckboxField = ({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("flex items-center", className)}>
            {children}
        </div>
    );
};

const LabelInput = forwardRef<HTMLInputElement, {
    label: string;
    htmlFor?: string;
    labelClassName?: string;
    inputClassName?: string;
    extraInfo?:string;
    containerClassName?: string;
    error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>>(({
    label,
    htmlFor,
    labelClassName,
    inputClassName,
    containerClassName,
    error,
    extraInfo,
    id,
    ...inputProps
}, ref) => {
    const inputId = htmlFor || id;

    return (
        <Field className={cn(containerClassName)}>
            <div className="flex items-center gap-1.5">
                <Label
                    htmlFor={inputId}
                    className={cn("block", labelClassName)}
                >
                    {label} {inputProps.required ? <span className="span-label text-red-500">*</span> : ''}
                </Label>
                {extraInfo && (
                    <HoverCard openDelay={200}>
                        <HoverCardTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                        </HoverCardTrigger>
                        <HoverCardContent>
                            {extraInfo}
                        </HoverCardContent>
                    </HoverCard>
                )}
            </div>
            <Input
                ref={ref}
                id={inputId}
                className={cn(inputClassName, error && "border-red-500")}
                {...inputProps}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </Field>
    );
});

LabelInput.displayName = "LabelInput";


const LabelTextarea = forwardRef<HTMLTextAreaElement, {
    label: string;
    htmlFor?: string;
    labelClassName?: string;
    textareaClassName?: string;
    containerClassName?: string;
    error?: string;
    extraInfo?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({
    label,
    htmlFor,
    labelClassName,
    textareaClassName,
    containerClassName,
    error,
    extraInfo,
    id,
    ...textareaProps
}, ref) => {
    const textareaId = htmlFor || id;

    return (
        <Field className={cn(containerClassName, textareaProps.required && "input-required")}>
            <div className="flex items-center gap-1.5">
                <Label
                    htmlFor={textareaId}
                    className={cn("block", labelClassName)}
                >
                    {label} {textareaProps.required ? <span className="span-label">*</span> : ''}
                </Label>
                {extraInfo && (
                    <HoverCard openDelay={200}>
                        <HoverCardTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                        </HoverCardTrigger>
                        <HoverCardContent>
                            {extraInfo}
                        </HoverCardContent>
                    </HoverCard>
                )}
            </div>
            <Textarea
                ref={ref}
                id={textareaId}
                className={cn(textareaClassName, error && "border-red-500")}
                {...textareaProps}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </Field>
    );
});

LabelTextarea.displayName = "LabelTextarea";

const SubmitButton = ({
    isPending,
    success,
    children,
    className,
    spinnerClassName,
    variant,
    ...buttonProps
}: {
    isPending?: boolean;
    success?: boolean;
    children: React.ReactNode;
    spinnerClassName?: string;
} & Omit<ButtonProps, 'type' | 'children'>) => {
    return (
        <Button
        disabled={isPending}
            variant={variant || 'default'}
            size={'default'}
            type="submit"
            className={cn("w-full m-auto mt-4 ", className)}
            {...buttonProps}
        >
            {isPending?<Spinner className={cn("size-6", spinnerClassName)} /> :success? <Check className="size-6" /> :children}
        </Button>
    );
};

export default {
    Container,
    Form,
    Field,
    FieldWithIcon,
    Actions,
    Errors,
    CheckboxField,
    LabelInput,
    LabelTextarea,
    SubmitButton
};

