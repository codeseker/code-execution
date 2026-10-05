import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiPostForm } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import { problemKeys } from "../keys";
import type { AdminTestCase, UploadTestCasePayload } from "../types";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage } from "../../../utils/api/errors";

/** `DELETE /admin/problems/{id}` - soft delete; test cases and files are kept. */
export function useDeleteProblem() {
    const queryClient = useQueryClient();

    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await apiDelete<void>(ENDPOINTS.ADMIN_DELETE(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: problemKeys.adminRoot });
            successToast("Problem deleted.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to delete the problem."));
        },
    });

    return { deleteProblem: mutateAsync, loading: isPending, error };
}

/**
 * `POST /admin/problems/{id}/testcases` - the input/output pair travels as
 * multipart parts while `isSample`, `timeLimitMs` and `memoryLimitKb` stay on
 * the query string (see `ProblemController#addTestCase`).
 */
export function useUploadTestCase() {
    const queryClient = useQueryClient();

    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UploadTestCasePayload }): Promise<AdminTestCase> => {
            const form = new FormData();
            form.append("input", payload.input);
            form.append("output", payload.output);
            if (payload.explanation && payload.explanation.trim()) {
                form.append("explanation", payload.explanation.trim());
            }

            const params: Record<string, unknown> = {};
            if (payload.isSample !== undefined) params.isSample = payload.isSample;
            if (payload.timeLimitMs !== undefined) params.timeLimitMs = payload.timeLimitMs;
            if (payload.memoryLimitKb !== undefined) params.memoryLimitKb = payload.memoryLimitKb;

            const response = await apiPostForm<AdminTestCase>(ENDPOINTS.ADMIN_TESTCASES(id), form, params);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: problemKeys.adminDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: problemKeys.adminRoot });
            successToast("Test case added.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to upload the test case."));
        },
    });

    return { uploadTestCase: mutateAsync, loading: isPending, error };
}

/** `DELETE /admin/problems/{id}/testcases/{testCaseId}` - removes doc + files. */
export function useDeleteTestCase() {
    const queryClient = useQueryClient();

    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async ({ id, testCaseId }: { id: string; testCaseId: string }): Promise<void> => {
            await apiDelete<void>(ENDPOINTS.ADMIN_TESTCASE(id, testCaseId));
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: problemKeys.adminDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: problemKeys.adminRoot });
            successToast("Test case removed.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to remove the test case."));
        },
    });

    return { deleteTestCase: mutateAsync, loading: isPending, error };
}