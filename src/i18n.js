import {createI18n} from "vue-i18n";
import en from "../../../../../Downloads/vitalita-frontend/src/locales/en.json";
import es from "../../../../../Downloads/vitalita-frontend/src/locales/es.json";

const LOCALE_STORAGE_KEY = 'vitalita-locale';

/**
 * Reads the language saved by the user. English is used by default.
 * @returns {string} Saved locale or 'en'.
 */
function getSavedLocale() {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    return ['en', 'es'].includes(savedLocale) ? savedLocale : 'en';
}

const i18n = createI18n({
    legacy: false,
    locale: getSavedLocale(),
    fallbackLocale: 'en',
    messages: { en, es }
});

export {LOCALE_STORAGE_KEY};
export default i18n;
