import type { AxiosResponse } from "axios";
import { webApi } from "./api";
import type { SuccessApiResponse } from "../../types/api-response";

type RequestParams = Record<string, unknown> | URLSearchParams;

async function apiGet<T = unknown>(
    url: string,
    params?: RequestParams,
): Promise<SuccessApiResponse<T>> {
    const response: AxiosResponse<SuccessApiResponse<T>> = await webApi.get(url, {
        params,
    });
    return response.data;
}

async function apiPost<T = unknown>(
    url: string,
    data?: unknown,
): Promise<SuccessApiResponse<T>> {
    const response: AxiosResponse<SuccessApiResponse<T>> = await webApi.post(
        url,
        data,
    );
    return response.data;
}

async function apiPostForm<T = unknown>(
    url: string,
    formData: FormData,
): Promise<SuccessApiResponse<T>> {
    const response: AxiosResponse<SuccessApiResponse<T>> = await webApi.post(
        url,
        formData,
        {
            headers: { "Content-Type": "multipart/form-data" },
        },
    );
    return response.data;
}

async function apiPut<T = unknown>(
    url: string,
    data?: unknown,
): Promise<SuccessApiResponse<T>> {
    const response: AxiosResponse<SuccessApiResponse<T>> = await webApi.put(
        url,
        data,
    );
    return response.data;
}

async function apiPutForm<T = unknown>(
    url: string,
    formData: FormData,
): Promise<SuccessApiResponse<T>> {
    const response: AxiosResponse<SuccessApiResponse<T>> = await webApi.put(
        url,
        formData,
        {
            headers: { "Content-Type": "multipart/form-data" },
        },
    );
    return response.data;
}


async function apiPatch<T = unknown>(
    url: string,
    data?: unknown,
): Promise<SuccessApiResponse<T>> {
    const response: AxiosResponse<SuccessApiResponse<T>> = await webApi.patch(
        url,
        data,
    );
    return response.data;
}

async function apiPatchForm<T = unknown>(
    url: string,
    formData: FormData,
): Promise<SuccessApiResponse<T>> {
    const response: AxiosResponse<SuccessApiResponse<T>> = await webApi.patch(
        url,
        formData,
        {
            headers: { "Content-Type": "multipart/form-data" },
        },
    );
    return response.data;
}

async function apiDelete<T = unknown>(
    url: string,
    data?: unknown,
): Promise<SuccessApiResponse<T>> {
    const response: AxiosResponse<SuccessApiResponse<T>> = await webApi.delete(
        url,
        { data },
    );
    return response.data;
}

export type { RequestParams };
export {
    apiGet,
    apiPost,
    apiPostForm,
    apiPut,
    apiPatch,
    apiPatchForm,
    apiDelete,
    apiPutForm
};