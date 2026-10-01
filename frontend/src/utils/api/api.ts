import axios from "axios";

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