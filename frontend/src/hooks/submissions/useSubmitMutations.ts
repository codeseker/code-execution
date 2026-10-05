import { useMutation } from "@tanstack/react-query";
import { apiPost } from "../../utils/api/methods";
import { ENDPOINTS } from "./endpoints";
import type { RunRequest, SubmitAck, SubmitRequest } from "./types";
import { errorToast } from "../../toast";
import { apiErrorMessage } from "../../utils/api/errors";

/**
 * All three ingestion routes enqueue onto the language Redis queue and answer
 * with the JOB_QUEUED snapshot (submission id + queue position); the result
 * itself arrives over the WebSocket gateway or through `GET /submissions/{id}`.
 * Only the failure toast lives here - success feedback belongs to the caller,
 * which immediately starts watching the returned `submissionId`.
 */
function useQueueSubmission<TRequest extends SubmitRequest | RunRequest>(
    resolveUrl: (id: string) => string,
    fallback: string,
) {
    const { mutateAsync, isPending, error } = useMutation({
        mutationFn: async ({ id, request }: { id: string; request: TRequest }): Promise<SubmitAck> => {
            const response = await apiPost<SubmitAck>(resolveUrl(id), request);
            return response.data;
        },
        onError: (mutationError: unknown) => {
            errorToast(apiErrorMessage(mutationError, fallback));
        },
    });

    return { queue: mutateAsync, loading: isPending, error };
}

/** `POST /problems/{id}/submit` - every hidden and public test case. */
export function useSubmit() {
    const { queue, loading, error } = useQueueSubmission<SubmitRequest>(
        ENDPOINTS.SUBMIT,
        "Unable to queue your submission.",
    );
    return {
        submit: (id: string, request: SubmitRequest) => queue({ id, request }),
        loading,
        error,
    };
}

/**
 * `POST /problems/{id}/example-eval` - the stored sample cases plus the
 * caller's own custom test cases (each with an optional expected output).
 */
export function useExampleEval() {
    const { queue, loading, error } = useQueueSubmission<RunRequest>(
        ENDPOINTS.EXAMPLE_EVAL,
        "Unable to run the sample cases.",
    );
    return {
        exampleEval: (id: string, request: RunRequest) => queue({ id, request }),
        loading,
        error,
    };
}

/** `POST /problems/{id}/run` - samples plus custom cases, nothing compared. */
export function useRun() {
    const { queue, loading, error } = useQueueSubmission<RunRequest>(
        ENDPOINTS.RUN,
        "Unable to run your code.",
    );
    return {
        run: (id: string, request: RunRequest) => queue({ id, request }),
        loading,
        error,
    };
}