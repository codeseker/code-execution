import axios from "axios";
import { getAccessToken } from "../../utils/cookieService";

type APP_TYPES = "development" | "staging" | "production";

const APP_MODE = import.meta.env.VITE_APP_MODE as APP_TYPES;

const URL: Record<APP_TYPES, string> = {
    development: import.meta.env.VITE_BACKEND_API_URL_DEV,
    staging: import.meta.env.VITE_BACKEND_API_URL_STAGING,
    production: import.meta.env.VITE_BACKEND_API_URL_PROD,
};

export const webApi = axios.create({
    baseURL: URL[APP_MODE],
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