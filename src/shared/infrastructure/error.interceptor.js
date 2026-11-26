import {ApiError} from "./api-error.js";

/**
 * Axios interceptor for centralized error handling.
 * It turns any HTTP error into an ApiError with a readable message,
 * so the stores do not need to know Axios details. ProblemDetails
 * responses (title, detail, errors) keep their localized text.
 */
export const errorInterceptor = {
    /**
     * Returns successful responses without changes.
     * @param {import('axios').AxiosResponse} response - The Axios response.
     * @returns {import('axios').AxiosResponse} The same response.
     */
    onResponse: (response) => response,

    /**
     * Builds a readable error from a failed request.
     * @param {import('axios').AxiosError|ApiError} error - The Axios error.
     * @returns {Promise<never>} A rejected promise with an ApiError.
     */
    onError: (error) => {
        // A retried request (token refresh) was already converted by its own interceptor chain.
        if (error instanceof ApiError) return Promise.reject(error);
        let apiError;
        if (error.response) {
            // The server answered with a status code outside the 2xx range
            apiError = ApiError.fromProblemDetails(error.response.status, error.response.data, error.response.statusText);
        } else if (error.request) {
            // The request was sent but the server did not answer
            apiError = new ApiError({message: 'No response from the server. Please check your connection.'});
        } else {
            apiError = new ApiError({message: error.message});
        }
        console.error(apiError.message);
        return Promise.reject(apiError);
    }
};
