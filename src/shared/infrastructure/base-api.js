import axios from "axios";
import {createIamInterceptor, createUnauthorizedInterceptor} from "../../iam/infrastructure/iam.interceptor.js";
import {errorInterceptor} from "./error.interceptor.js";
import {localeInterceptor} from "./locale.interceptor.js";

const platformApi = import.meta.env.VITE_VITALITA_API_URL;

/**
 * Shared infrastructure base class that configures the HTTP client.
 * Every bounded context API extends this class, so all of them share
 * the same base URL, the language and auth headers and the error handling.
 *
 * @class BaseApi
 */
export class BaseApi {
    /**
     * @private
     * Axios HTTP client instance.
     * @type {import('axios').AxiosInstance}
     */
    #http;

    /**
     * Creates the Axios client with the base URL from the environment variables.
     */
    constructor() {
        this.#http = axios.create({
            baseURL: platformApi,
            headers: {
                'Content-Type': 'application/json'
            },
        });
        this.#http.interceptors.request.use(localeInterceptor);
        this.#http.interceptors.request.use(createIamInterceptor(this.#http));
        // The 401 handler runs before the error interceptor, so it still sees the Axios error.
        this.#http.interceptors.response.use(null, createUnauthorizedInterceptor(this.#http));
        this.#http.interceptors.response.use(errorInterceptor.onResponse, errorInterceptor.onError);
    }

    /**
     * Returns the configured Axios HTTP client.
     * @returns {import('axios').AxiosInstance}
     */
    get http() {
        return this.#http;
    }
}
