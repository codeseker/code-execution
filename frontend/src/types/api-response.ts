export type PaginationResponse = {
    page: number;
    limit: number;
    totalElements: number;
    totalPages: number;
};

export type SuccessApiResponse<T> = {
    success: true;
    statusCode: number;
    message: string;
    data: T;
    pagination: PaginationResponse | null;
};

export type ErrorApiResponse<T> = {
    success: false;
    statusCode: number;
    message: string;
    errors?: T;
};