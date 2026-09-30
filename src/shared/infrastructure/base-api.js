import axios from "axios";
import {iamInterceptor} from "../../iam/infrastructure/iam.interceptor.js";
import {errorInterceptor} from "./error.interceptor.js";

const platformApi = import.meta.env.VITE_VITALITA_API_URL;

/**
 * Shared infrastructure base class that configures the HTTP client.
 * Every bounded context API extends this class, so all of them share
 * the same base URL, the auth header and the error handling.
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
        this.#http.interceptors.request.use(iamInterceptor);
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
