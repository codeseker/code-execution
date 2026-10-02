import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from "../cookieService";
import type { SuccessApiResponse } from "../../types/api-response";

type APP_TYPES = "development" | "staging" | "production";

const APP_MODE = import.meta.env.VITE_APP_MODE as APP_TYPES;

const URL: Record<APP_TYPES, string> = {
    development: import.meta.env.VITE_BACKEND_API_URL_DEV,
    staging: import.meta.env.VITE_BACKEND_API_URL_STAGING,
    production: import.meta.env.VITE_BACKEND_API_URL_PROD,
};

/**
 * The configured base URL points at the versioned prefix (`.../api/v1`), but
 * the server only mounts `AuthController` there. `PublicProblemController`,
 * `SubmissionController`, `ProblemListController` and `UserStatsController`
 * are registered at the application root, while `ProblemController` and
 * `AdminController` register dual `{ /admin/... , /api/v1/admin/... }`
 * aliases. Stripping the suffix once here lets every endpoint constant
 * express the *real* server path instead of guessing a prefix.
 */
export const API_ORIGIN: string = (URL[APP_MODE] ?? "").replace(/\/api\/v1\/?$/, "");

/** Prefix of the only module that is versioned server-side. */
export const API_VERSION_PREFIX = "/api/v1";

/** Raw WebSocket gateway (`SubmissionWebSocketHandler`) mounted at `/ws`. */
export const WS_ENDPOINT = `${API_ORIGIN.replace(/^http/, "ws")}/ws`;

export const webApi = axios.create({
    baseURL: API_ORIGIN,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
});

webApi.interceptors.request.use((config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

/** Endpoints that must never trigger a refresh attempt. */
const AUTH_FREE_PATHS = [`${API_VERSION_PREFIX}/auth/login`, `${API_VERSION_PREFIX}/auth/refresh`];

/** In-flight refresh, shared so parallel 401s only rotate the pair once. */
let refreshInFlight: Promise<string | null> | null = null;

function isAuthFree(url: string | undefined): boolean {
    if (!url) return true;
    return AUTH_FREE_PATHS.some((path) => url.startsWith(path));
}

/**
 * Rotates the access token with `POST /api/v1/auth/refresh` using a bare
 * axios call: going through `webApi` would re-enter the response interceptor
 * and recurse.
 */
function refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return Promise.resolve(null);

    return axios
        .post<SuccessApiResponse<{ accessToken: string; refreshToken: string }>>(
            `${API_ORIGIN}${API_VERSION_PREFIX}/auth/refresh`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" }, withCredentials: true },
        )
        .then((response) => {
            const tokens = response.data?.data;
            if (!tokens?.accessToken) return null;
            setAuthTokens(tokens.accessToken, tokens.refreshToken);
            return tokens.accessToken as string;
        })
        .catch(() => null);
}

webApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
        const status = error.response?.status;

        if (status !== 401 || !original || original._retried || isAuthFree(original.url)) {
            return Promise.reject(error);
        }

        original._retried = true;
        refreshInFlight ??= refreshAccessToken().finally(() => {
            refreshInFlight = null;
        });

        const accessToken = await refreshInFlight;
        if (!accessToken) {
            clearAuthTokens();
            return Promise.reject(error);
        }

        original.headers.Authorization = `Bearer ${accessToken}`;
        return webApi(original);
    },
);