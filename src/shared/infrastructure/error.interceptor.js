/**
 * Axios interceptor for centralized error handling.
 * It turns any HTTP error into a simple Error with a readable message,
 * so the stores do not need to know Axios details.
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
     * @param {import('axios').AxiosError} error - The Axios error.
     * @returns {Promise<never>} A rejected promise with an Error.
     */
    onError: (error) => {
        let message;
        if (error.response) {
            // The server answered with a status code outside the 2xx range
            message = error.response.data?.['message'] || `Error ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
            // The request was sent but the server did not answer
            message = 'No response from the server. Please check your connection.';
        } else {
            message = error.message;
        }
        console.error(message);
        return Promise.reject(new Error(message));
    }
};
