import i18n from "../../i18n.js";

const SUPPORTED_LOCALES = ['en', 'es'];
const DEFAULT_LOCALE = 'en';

/**
 * Sends the active vue-i18n language in the Accept-Language header,
 * so the Vitalita API answers messages and ProblemDetails in the same language.
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request configuration.
 * @returns {import('axios').InternalAxiosRequestConfig} Updated request configuration.
 */
export const localeInterceptor = (config) => {
    const locale = i18n.global.locale.value;
    config.headers['Accept-Language'] = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
    return config;
}
