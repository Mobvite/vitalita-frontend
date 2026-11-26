import useIamStore from "../application/iam.store.js";

/**
 * Adds the bearer token to every request when a user is signed in.
 * The header is always rewritten, so a retried request uses the latest token.
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request configuration.
 * @returns {import('axios').InternalAxiosRequestConfig} Updated request configuration.
 */
export const iamInterceptor = (config) => {
    const store = useIamStore();
    if (store.isSignedIn) {
        config.headers.Authorization = `Bearer ${store.token}`;
    }
    return config;
}
