import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ZodSchema } from "zod";

export function useAppForm<T extends Record<string, any>>({
    schema,
    defaultValues,
    onSubmit,
    mode = "onSubmit",
}: {
    schema: ZodSchema<T>;
    defaultValues: Partial<T>;
    onSubmit: SubmitHandler<T>;
    mode?: "onSubmit" | "onChange";
}) {
    const form = useForm<T>({
        mode,
        resolver: zodResolver(schema as any) as any,
        defaultValues: defaultValues as any,
    });

    return {
        // submit
        handleSubmit: form.handleSubmit(onSubmit),

        register: form.register,
        control: form.control,

        // state
        errors: form.formState.errors,
        isSubmitting: form.formState.isSubmitting,
        isValid: form.formState.isValid,
        isDirty: form.formState.isDirty,
        dirtyFields: form.formState.dirtyFields,

        // field utilities
        watch: form.watch,
        setValue: form.setValue,
        getValue: form.getValues,
        clearErrors: form.clearErrors,
        setError: form.setError,

        // form utilities
        reset: form.reset,
        trigger: form.trigger,

        form,
    };
}