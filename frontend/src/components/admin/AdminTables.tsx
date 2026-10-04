import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { EmptyState } from "../ui";
import { cx } from "../ui";
import { formatDateTime, initialsOf, languageLabel, relativeTime, roleLabel, statusLabel, statusToneClass, userStatusLabel } from "../../lib/format";
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
        <div className="overflow-x-auto">
            <table className="ntable">
                <thead>
                    <tr>
                        <th className="pl-5">User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th className="hidden md:table-cell">Joined</th>
                        <th className="pr-5">Last updated</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user._id}>
                            <td className="pl-5">
                                <span className="flex items-center gap-3">
                                    <span className="center size-7 flex-none rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {initialsOf(user.username)}
                                    </span>
                                    <span className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">{user.username}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </span>
                                </span>
                            </td>
                            <td>
                                <Badge variant={user.roleName === "ADMIN" ? "default" : "secondary"}>{roleLabel(user.roleName)}</Badge>
                            </td>
                            <td>
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
                            </td>
                            <td className="hidden text-xs text-muted-foreground md:table-cell" title={formatDateTime(user.createdAt)}>
                                {relativeTime(user.createdAt)}
                            </td>
                            <td className="pr-5 text-xs text-muted-foreground">{relativeTime(user.updatedAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
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
        <div className="overflow-x-auto">
            <table className="ntable">
                <thead>
                    <tr>
                        <th className="pl-5">ID</th>
                        <th>Problem</th>
                        <th className="hidden lg:table-cell">Language</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th className="hidden md:table-cell">Verdict</th>
                        <th className="pr-5 text-right">Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((submission) => (
                        <tr key={submission.id}>
                            <td className="pl-5 font-mono text-xs text-muted-foreground">#{submission.id.slice(-8)}</td>
                            <td className="font-mono text-xs text-muted-foreground">{submission.problemId.slice(-8)}</td>
                            <td className="hidden lg:table-cell">
                                <Badge variant="secondary">{languageLabel(submission.language)}</Badge>
                            </td>
                            <td className="text-xs text-muted-foreground">
                                {submission.type === "FULL_SUBMISSION" ? "Submit" : submission.type === "EXAMPLE_EVAL" ? "Samples" : "Run"}
                            </td>
                            <td>
                                <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", statusToneClass(submission.status))}>
                                    {statusLabel(submission.status)}
                                </span>
                            </td>
                            <td className="hidden md:table-cell">
                                <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", statusToneClass(submission.verdict ?? submission.status))}>
                                    {submission.verdict ?? "—"}
                                </span>
                            </td>
                            <td className="pr-5 text-right text-xs whitespace-nowrap text-muted-foreground">
                                {relativeTime(submission.createdAt)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}