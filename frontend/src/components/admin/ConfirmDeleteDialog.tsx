import type { ReactNode } from "react";
import { Button } from "../ui/button";

type Props = {
    title: string;
    description: string;
    confirmLabel?: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

/**
 * Shared confirmation shell for destructive admin actions. Backed by the
 * server behaviour: `DELETE /admin/problems/{id}` is a soft delete, and
 * `DELETE /admin/problems/{id}/testcases/{testCaseId}` really removes the
 * document and its files.
 */
export default function ConfirmDeleteDialog({
    title,
    description,
    confirmLabel = "Delete",
    loading = false,
    onCancel,
    onConfirm,
}: Props) {
    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                <div className="mt-5 flex justify-end gap-2.5">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" type="button" disabled={loading} onClick={onConfirm}>
                        {loading ? "Working…" : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/** Small labelled field used across the admin dialogs. */
export function FormField({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
                {label}
            </label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}