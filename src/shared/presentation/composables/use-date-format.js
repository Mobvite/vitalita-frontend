import {useI18n} from "vue-i18n";

/**
 * Formats dates with the language selected by the user.
 * Spanish uses the Peruvian format and English uses the US format.
 * @returns {{formatDate: Function, formatTime: Function, formatDateTime: Function}} Format helpers.
 */
export function useDateFormat() {
    const {locale} = useI18n();
    const culture = () => locale.value === 'es' ? 'es-PE' : 'en-US';

    /**
     * @param {string|Date} value - Date to format.
     * @param {Intl.DateTimeFormatOptions} [options] - Format options.
     * @returns {string} Formatted date, or an empty string when there is no value.
     */
    const formatDate = (value, options = {day: '2-digit', month: 'short', year: 'numeric'}) =>
        value ? new Date(value).toLocaleDateString(culture(), options) : '';

    /** @param {string|Date} value - Date to format. @returns {string} Hour and minutes. */
    const formatTime = (value) =>
        value ? new Date(value).toLocaleTimeString(culture(), {hour: '2-digit', minute: '2-digit'}) : '';

    /** @param {string|Date} value - Date to format. @returns {string} Date with hour. */
    const formatDateTime = (value) => value ? `${formatDate(value)} · ${formatTime(value)}` : '';

    return {formatDate, formatTime, formatDateTime};
}
