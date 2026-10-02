import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import ConfirmDeleteDialog, { FormField } from "./ConfirmDeleteDialog";
import useAdminProblem from "../../hooks/problems/admin/useAdminProblem";
import { useUpdateProblem } from "../../hooks/problems/admin/useProblemMutations";
import { useDeleteTestCase, useUploadTestCase } from "../../hooks/problems/admin/useTestCaseMutations";
import { DIFFICULTIES, type Difficulty } from "../../types/domain";
import { difficultyLabel, formatKb, formatMs } from "../../lib/format";
import type { AdminProblem } from "../../hooks/problems/types";

type Props = {
    problem: AdminProblem;
    onClose: () => void;
};

/**
 * Editor for `PUT /admin/problems/{id}` plus the testcase endpoints
 * (`GET /admin/problems/{id}`, `POST|DELETE .../testcases`). The dialog owns
 * all of its draft state; the parent only decides when it is open.
 */
export default function ProblemEditorDialog({ problem, onClose }: Props) {
    const [title, setTitle] = useState(problem.title);
    const [description, setDescription] = useState(problem.description ?? "");
    const [statement, setStatement] = useState(problem.problemStatement);
    const [difficulty, setDifficulty] = useState<Difficulty>(problem.difficulty);
    const [tagsDraft, setTagsDraft] = useState(problem.tags.join(", "));
    const [isPublished, setIsPublished] = useState(problem.isPublished);
    const [pendingTestCase, setPendingTestCase] = useState<string | null>(null);
    const [inputFile, setInputFile] = useState<File | null>(null);
    const [outputFile, setOutputFile] = useState<File | null>(null);
    const [isSample, setIsSample] = useState(true);

    const { details, loading } = useAdminProblem(problem._id);
    const { updateProblem, loading: saving } = useUpdateProblem();
    const { uploadTestCase, loading: uploading } = useUploadTestCase();
    const { deleteTestCase, loading: removing } = useDeleteTestCase();

    // Re-sync when the row underneath changes while the dialog is open.
    useEffect(() => {
        setTitle(problem.title);
        setDescription(problem.description ?? "");
        setStatement(problem.problemStatement);
        setDifficulty(problem.difficulty);
        setTagsDraft(problem.tags.join(", "));
        setIsPublished(problem.isPublished);
    }, [problem]);

    const tags = tagsDraft
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

    const upload = async () => {
        if (!inputFile || !outputFile) return;
        try {
            await uploadTestCase({
                id: problem._id,
                payload: { input: inputFile, output: outputFile, isSample },
            });
            setInputFile(null);
            setOutputFile(null);
            setIsSample(true);
        } catch {
            // Toast handled by the hook; keep the selection so a retry is cheap.
        }
    };

    const save = async () => {
        if (!title.trim() || !statement.trim()) return;
        try {
            await updateProblem({
                id: problem._id,
                payload: {
                    title: title.trim(),
                    description: description.trim() || null,
                    problemStatement: statement.trim(),
                    difficulty,
                    tags,
                    isPublished,
                },
            });
        } catch {
            // Toast handled by the hook.
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-background/80 px-4 py-8 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${problem.title}`}
        >
            <div className="flex w-full max-w-3xl flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-lg">
                <header className="flex items-start gap-3">
                    <div className="min-w-0 grow">
                        <h2 className="text-lg font-semibold text-foreground">Edit problem</h2>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{problem.slug} · slug stays stable after creation</p>
                    </div>
                    <Button variant="ghost" size="icon" type="button" className="size-8" aria-label="Close editor" onClick={onClose}>
                        <Icon name="x" size={15} />
                    </Button>
                </header>

                <FormField label="Title" htmlFor="edit-title">
                    <Input id="edit-title" className="h-9" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} />
                </FormField>

                <FormField label="Description" htmlFor="edit-description" hint="One-line summary shown in listings.">
                    <Input id="edit-description" className="h-9" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
                </FormField>

                <FormField label="Problem statement" htmlFor="edit-statement">
                    <Textarea id="edit-statement" rows={10} className="font-mono text-sm" value={statement} onChange={(event) => setStatement(event.target.value)} />
                </FormField>

                <FormField label="Tags" htmlFor="edit-tags" hint="Comma separated.">
                    <Input id="edit-tags" className="h-9" value={tagsDraft} onChange={(event) => setTagsDraft(event.target.value)} />
                </FormField>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1" role="group" aria-label="Difficulty">
                        {DIFFICULTIES.map((option) => (
                            <Button
                                key={option}
                                type="button"
                                size="sm"
                                variant={difficulty === option ? "default" : "outline"}
                                aria-pressed={difficulty === option}
                                onClick={() => setDifficulty(option)}
                            >
                                {difficultyLabel(option)}
                            </Button>
                        ))}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
                        Published
                    </label>
                </div>

                {/* ---- Test cases ---- */}
                <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">Test cases</h3>
                        <Badge variant="outline" className="tabular-nums">{details?.problem.testCaseCount ?? problem.testCaseCount}</Badge>
                    </div>

                    {loading ? (
                        <Skeleton className="h-16 w-full" />
                    ) : (
                        <>
                            <ul className="flex flex-col divide-y divide-border">
                                {(details?.testCases ?? []).map((testCase) => (
                                    <li key={testCase._id} className="flex items-center gap-3 py-2 text-xs">
                                        <Icon name="file" size={14} className="shrink-0 text-muted-foreground" />
                                        <span className="min-w-0 grow truncate font-mono text-muted-foreground">
                                            {testCase.inputFilePath} → {testCase.outputFilePath}
                                        </span>
                                        {testCase.isSample && <Badge variant="secondary">Sample</Badge>}
                                        <span className="shrink-0 tabular-nums text-muted-foreground">
                                            {formatMs(testCase.timeLimitMs)} · {formatKb(testCase.memoryLimitKb)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            className="size-7 shrink-0"
                                            aria-label="Remove test case"
                                            onClick={() => setPendingTestCase(testCase._id)}
                                        >
                                            <Icon name="x" size={13} />
                                        </Button>
                                    </li>
                                ))}
                                {(details?.testCases ?? []).length === 0 && (
                                    <li className="py-2 text-xs text-muted-foreground">No test cases uploaded yet.</li>
                                )}
                            </ul>

                            <div className="flex flex-col gap-2.5">
                                <div className="flex flex-wrap items-center gap-4">
                                    <label className="flex w-fit cursor-pointer flex-col gap-1 text-xs text-muted-foreground">
                                        <span>Input file</span>
                                        <input
                                            type="file"
                                            className="text-xs"
                                            disabled={uploading}
                                            onChange={(event) => setInputFile(event.target.files?.[0] ?? null)}
                                        />
                                    </label>

                                    <label className="flex w-fit cursor-pointer flex-col gap-1 text-xs text-muted-foreground">
                                        <span>Expected output file</span>
                                        <input
                                            type="file"
                                            className="text-xs"
                                            disabled={uploading}
                                            onChange={(event) => setOutputFile(event.target.files?.[0] ?? null)}
                                        />
                                    </label>

                                    <label className="flex items-center gap-2 self-end pb-1 text-xs text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            checked={isSample}
                                            disabled={uploading}
                                            onChange={(event) => setIsSample(event.target.checked)}
                                        />
                                        Sample case
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={uploading || !inputFile || !outputFile}
                                        onClick={() => void upload()}
                                    >
                                        {uploading ? "Uploading…" : "Upload test case"}
                                    </Button>
                                    {(inputFile || outputFile) && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            disabled={uploading}
                                            onClick={() => {
                                                setInputFile(null);
                                                setOutputFile(null);
                                                setIsSample(true);
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    The endpoint takes two separate multipart parts - <code>input</code> and <code>output</code>.
                                </p>
                            </div>
                        </>
                    )}
                </section>

                <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
                    <Button variant="outline" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={saving || !title.trim() || !statement.trim()} onClick={() => void save()}>
                        {saving ? "Saving…" : "Save changes"}
                    </Button>
                </div>
            </div>

            {pendingTestCase && (
                <ConfirmDeleteDialog
                    title="Remove this test case?"
                    description="The test case document and its files are permanently removed."
                    loading={removing}
                    onCancel={() => setPendingTestCase(null)}
                    onConfirm={() => {
                        const target = pendingTestCase;
                        setPendingTestCase(null);
                        void deleteTestCase({ id: problem._id, testCaseId: target });
                    }}
                />
            )}
        </div>
    );
}