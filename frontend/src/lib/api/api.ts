/**
 * Historical location of the shared axios client. The single instance now
 * lives in `utils/api/api.ts` so every call site picks up the bearer
 * interceptor and the refresh-on-401 handling.
 */
export { webApi, API_ORIGIN, API_VERSION_PREFIX, WS_ENDPOINT } from "../../utils/api/api";