import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { EmptyState } from "../ui";
import { cx } from "../ui";
import { formatDateTime, formatMs, initialsOf, languageLabel, relativeTime, roleLabel, statusLabel, statusToneClass, submissionTypeLabel, userStatusLabel } from "../../lib/format";
import type { AdminUser } from "../../hooks/admin/types";
import type { SubmissionSummary } from "../../hooks/submissions/types";

/** `GET /admin/users` rows. */
export function UserTable({ users, loading }: { users: AdminUser[]; loading: boolean }) {
    if (loading) {
        return (
            <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading users">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-11 w-full" />
                ))}
            </div>
        );
    }

    if (users.length === 0) {
        return <EmptyState icon="users" title="No users found" hint="Adjust the search or status filter." />;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="pl-5">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="pr-5">Last updated</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user._id}>
                        <TableCell className="pl-5">
                                <span className="flex items-center gap-3">
                                    <span className="flex size-7 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {initialsOf(user.username)}
                                    </span>
                                    <span className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">{user.username}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </span>
                                </span>
                        </TableCell>
                        <TableCell>
                            <Badge variant={user.roleName === "ADMIN" ? "default" : "secondary"}>{roleLabel(user.roleName)}</Badge>
                        </TableCell>
                        <TableCell>
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className={cx(
                                            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                                            user.isDeleted
                                                ? "bg-destructive/10 text-destructive"
                                                : user.status === "ACTIVE"
                                                  ? "bg-primary/10 text-primary"
                                                  : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {user.isDeleted ? "Deleted" : userStatusLabel(user.status)}
                                    </span>
                                </span>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell" title={formatDateTime(user.createdAt)}>
                            {relativeTime(user.createdAt)}
                        </TableCell>
                        <TableCell className="pr-5 text-xs text-muted-foreground">{relativeTime(user.updatedAt)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

/** Judge throughput rows. */
export function SubmissionStreamTable({
    submissions,
    loading,
}: {
    submissions: SubmissionSummary[];
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading runs">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-11 w-full" />
                ))}
            </div>
        );
    }

    if (submissions.length === 0) {
        return <EmptyState icon="terminal" title="No runs" hint="No submissions match the current filters." />;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="pl-5">ID</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead className="hidden lg:table-cell">Language</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Verdict</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Runtime</TableHead>
                    <TableHead className="pr-5 text-right">Timestamp</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                        <TableCell className="pl-5 font-mono text-xs text-muted-foreground">#{submission.id.slice(-8)}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                            {submission.problemTitle ?? submission.problemId.slice(-8)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary">{languageLabel(submission.language)}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                            {submissionTypeLabel(submission.type)}
                        </TableCell>
                        <TableCell>
                            <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", statusToneClass(submission.status))}>
                                {statusLabel(submission.status)}
                            </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", statusToneClass(submission.verdict ?? submission.status))}>
                                {submission.verdict ?? "—"}
                            </span>
                        </TableCell>
                        <TableCell className="hidden text-right font-mono text-xs tabular-nums text-muted-foreground md:table-cell">
                            {submission.runtimeMs === null ? "—" : formatMs(submission.runtimeMs)}
                        </TableCell>
                        <TableCell className="pr-5 text-right text-xs whitespace-nowrap text-muted-foreground">
                            {relativeTime(submission.createdAt)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}