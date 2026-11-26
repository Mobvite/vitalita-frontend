import useIamStore from "../application/iam.store.js";
import {SignInAssembler} from "./sign-in.assembler.js";

export const REFRESH_TOKEN_PATH = '/authentication/refresh';

/**
 * The API rejects expired tokens, also on the refresh endpoint, so the token
 * is renewed when it is about to expire instead of waiting for a 401.
 */
const REFRESH_MARGIN_MS = 60 * 1000;

/** @type {Promise<string>|null} Refresh in progress, shared by every request that needs it. */
let refreshInProgress = null;

/**
 * Reads the expiration instant of a JWT without validating it.
 * @param {string} token - JWT access token.
 * @returns {number|null} Expiration in milliseconds, or null when it cannot be read.
 */
export function readTokenExpiration(token) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const {exp} = JSON.parse(atob(payload));
        return Number.isFinite(exp) ? exp * 1000 : null;
    } catch {
        return null;
    }
}

/**
 * Requests a new token once, even when several requests need it at the same time.
 * @param {import('axios').AxiosInstance} http - Client used to call the API.
 * @returns {Promise<string>} The new token.
 */
export function refreshToken(http) {
    if (!refreshInProgress) {
        const store = useIamStore();
        refreshInProgress = http.post(REFRESH_TOKEN_PATH, null, {skipAuthRefresh: true})
            .then(response => {
                const resource = SignInAssembler.toResourceFromResponse(response);
                if (!resource) throw new Error('The token refresh did not return a token.');
                store.applyRefreshedToken(resource);
                return resource.token;
            })
            .finally(() => { refreshInProgress = null; });
    }
    return refreshInProgress;
}

/**
 * Builds the request interceptor that adds the bearer token when a user is signed in.
 * The header is always rewritten, so a retried request uses the latest token.
 * When the token expires in less than a minute, it is refreshed first.
 * @param {import('axios').AxiosInstance} http - Client used to refresh the token.
 * @returns {(config: import('axios').InternalAxiosRequestConfig) => Promise<import('axios').InternalAxiosRequestConfig>} Request interceptor.
 */
export function createIamInterceptor(http) {
    return async (config) => {
        const store = useIamStore();
        if (!store.isSignedIn) return config;
        if (!config.skipAuthRefresh) {
            const expiresAt = readTokenExpiration(store.token);
            const now = Date.now();
            if (expiresAt !== null && expiresAt > now && expiresAt - now < REFRESH_MARGIN_MS) {
                // If it fails, the request goes on and the 401 handler decides.
                await refreshToken(http).catch(() => null);
            }
        }
        if (store.isSignedIn) config.headers.Authorization = `Bearer ${store.token}`;
        return config;
    };
}

/**
 * Builds the response error handler for 401 answers. It refreshes the token
 * once and repeats the request; when the refresh fails, the session is closed
 * and the app goes back to the sign-in page.
 * @param {import('axios').AxiosInstance} http - Client that repeats the request.
 * @returns {(error: import('axios').AxiosError) => Promise<import('axios').AxiosResponse>} Error handler.
 */
export function createUnauthorizedInterceptor(http) {
    return async (error) => {
        const config = error.config;
        const store = useIamStore();
        if (error.response?.status !== 401 || !config || config.skipAuthRefresh || config.authRetried
            || !store.isSignedIn) {
            return Promise.reject(error);
        }
        const tokenUsed = config.headers?.Authorization?.replace(/^Bearer /, '');
        try {
            // Another request may have refreshed the token while this one was running.
            if (tokenUsed === store.token) await refreshToken(http);
        } catch {
            store.expireSession();
            return Promise.reject(error);
        }
        return http.request({...config, authRetried: true});
    };
}
