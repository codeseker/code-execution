import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPut } from "../../../utils/api/methods";
import { ENDPOINTS } from "../endpoints";
import { problemKeys } from "../keys";
import type { AdminProblem, CreateProblemPayload, UpdateProblemPayload } from "../types";
import { errorToast, successToast } from "../../../toast";
import { apiErrorMessage } from "../../../utils/api/errors";

/**
 * `POST /admin/problems` (requires `problem:create`) and
 * `PUT /admin/problems/{id}` (requires `problem:update`). Both payloads are
 * full representations - `slug` is generated once and never accepted back.
 */
export function useCreateProblem() {
    const queryClient = useQueryClient();

    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (payload: CreateProblemPayload): Promise<AdminProblem> => {
            const response = await apiPost<AdminProblem>(ENDPOINTS.ADMIN_CREATE, payload);
            return response.data;
        },
        onSuccess: (problem) => {
            queryClient.invalidateQueries({ queryKey: problemKeys.adminRoot });
            successToast(`“${problem.title}” created.`);
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to create the problem."));
        },
    });

    return { createProblem: mutateAsync, loading: isPending, error };
}

export function useUpdateProblem() {
    const queryClient = useQueryClient();

    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateProblemPayload }): Promise<AdminProblem> => {
            const response = await apiPut<AdminProblem>(ENDPOINTS.ADMIN_UPDATE(id), payload);
            return response.data;
        },
        onSuccess: (problem) => {
            queryClient.invalidateQueries({ queryKey: problemKeys.adminRoot });
            queryClient.invalidateQueries({ queryKey: problemKeys.adminDetail(problem._id) });
            successToast(`“${problem.title}” updated.`);
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to update the problem."));
        },
    });

    return { updateProblem: mutateAsync, loading: isPending, error };
}