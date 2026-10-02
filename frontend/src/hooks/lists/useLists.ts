import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "../../utils/api/methods";
import { ENDPOINTS } from "./endpoints";
import { listKeys } from "./keys";
import type {
    AddProblemPayload,
    CreateListPayload,
    ListDetail,
    ProblemList,
    ProblemSummary,
    UpdateListPayload,
} from "./types";
import { errorToast, successToast } from "../../toast";
import { apiErrorMessage } from "../../utils/api/errors";

/** Every mutation below touches either a list or the bookmark set. */
function invalidateLists(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: listKeys.root });
}

/** `GET /users/me/lists` */
export function useProblemLists(options: { enabled?: boolean } = {}) {
    const enabled = options.enabled ?? true;

    const result = useQuery({
        queryKey: listKeys.all,
        queryFn: async (): Promise<ProblemList[]> => {
            const response = await apiGet<ProblemList[]>(ENDPOINTS.LISTS);
            return response.data ?? [];
        },
        enabled,
        staleTime: 30_000,
    });

    return { lists: result.data ?? [], loading: result.isPending, error: result.error };
}

/** `GET /users/me/lists/{id}` - metadata plus the hydrated problems. */
export function useProblemList(id: string | undefined) {
    const result = useQuery({
        queryKey: listKeys.detail(id ?? ""),
        queryFn: async (): Promise<ListDetail> => {
            const response = await apiGet<ListDetail>(ENDPOINTS.LIST(id ?? ""));
            return response.data;
        },
        enabled: Boolean(id),
    });

    return {
        list: result.data?.list,
        problems: result.data?.problems ?? [],
        loading: result.isPending,
        error: result.error,
    };
}

/** `POST /users/me/lists` */
export function useCreateList() {
    const queryClient = useQueryClient();
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (payload: CreateListPayload): Promise<ProblemList> => {
            const response = await apiPost<ProblemList>(ENDPOINTS.CREATE, payload);
            return response.data;
        },
        onSuccess: (list) => {
            invalidateLists(queryClient);
            successToast(`“${list.name}” created.`);
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to create the list."));
        },
    });

    return { createList: mutateAsync, loading: isPending, error };
}

/** `PUT /users/me/lists/{id}` - full replace of name and description. */
export function useUpdateList() {
    const queryClient = useQueryClient();
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateListPayload }): Promise<ProblemList> => {
            const response = await apiPut<ProblemList>(ENDPOINTS.UPDATE(id), payload);
            return response.data;
        },
        onSuccess: (list) => {
            invalidateLists(queryClient);
            queryClient.invalidateQueries({ queryKey: listKeys.detail(list._id) });
            successToast(`“${list.name}” renamed.`);
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to rename the list."));
        },
    });

    return { updateList: mutateAsync, loading: isPending, error };
}

/** `DELETE /users/me/lists/{id}` */
export function useDeleteList() {
    const queryClient = useQueryClient();
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await apiDelete<void>(ENDPOINTS.DELETE(id));
        },
        onSuccess: () => {
            invalidateLists(queryClient);
            successToast("List deleted.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to delete the list."));
        },
    });

    return { deleteList: mutateAsync, loading: isPending, error };
}

/** `POST /users/me/lists/{id}/problems` - appends one problem. */
export function useAddProblemToList() {
    const queryClient = useQueryClient();
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: AddProblemPayload }): Promise<ProblemList> => {
            const response = await apiPost<ProblemList>(ENDPOINTS.ADD_PROBLEM(id), payload);
            return response.data;
        },
        onSuccess: (list) => {
            invalidateLists(queryClient);
            queryClient.invalidateQueries({ queryKey: listKeys.detail(list._id) });
            successToast("Problem added to list.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to add the problem."));
        },
    });

    return { addProblem: mutateAsync, loading: isPending, error };
}

/** `DELETE /users/me/lists/{id}/problems/{problemId}` - removes one entry. */
export function useRemoveProblemFromList() {
    const queryClient = useQueryClient();
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async ({ id, problemId }: { id: string; problemId: string }): Promise<ProblemList> => {
            const response = await apiDelete<ProblemList>(ENDPOINTS.REMOVE_PROBLEM(id, problemId));
            return response.data;
        },
        onSuccess: (list) => {
            invalidateLists(queryClient);
            queryClient.invalidateQueries({ queryKey: listKeys.detail(list._id) });
            successToast("Problem removed from list.");
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to remove the problem."));
        },
    });

    return { removeProblem: mutateAsync, loading: isPending, error };
}

/** `GET /users/me/bookmarks` - starred problems in bookmark order. */
export function useBookmarks(options: { enabled?: boolean } = {}) {
    const enabled = options.enabled ?? true;

    const result = useQuery({
        queryKey: listKeys.bookmarks,
        queryFn: async (): Promise<ProblemSummary[]> => {
            const response = await apiGet<ProblemSummary[]>(ENDPOINTS.BOOKMARKS);
            return response.data ?? [];
        },
        enabled,
        staleTime: 30_000,
    });

    const problems = result.data ?? [];
    return {
        bookmarks: problems,
        bookmarkedIds: problems.map((problem) => problem._id),
        loading: result.isPending,
        error: result.error,
    };
}

/** `PUT /users/me/bookmarks/{problemId}` - idempotent star toggle. */
export function useBookmark() {
    const queryClient = useQueryClient();
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (problemId: string): Promise<ProblemList> => {
            const response = await apiPut<ProblemList>(ENDPOINTS.BOOKMARK(problemId));
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: listKeys.bookmarks });
            invalidateLists(queryClient);
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to bookmark the problem."));
        },
    });

    return { bookmark: mutateAsync, loading: isPending, error };
}

/** `DELETE /users/me/bookmarks/{problemId}` - idempotent unstar. */
export function useUnbookmark() {
    const queryClient = useQueryClient();
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async (problemId: string): Promise<void> => {
            await apiDelete<void>(ENDPOINTS.BOOKMARK(problemId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: listKeys.bookmarks });
            invalidateLists(queryClient);
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, "Unable to remove the bookmark."));
        },
    });

    return { unbookmark: mutateAsync, loading: isPending, error };
}