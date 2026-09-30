/**
 * Value object that represents a date and time inside the domain.
 * It is immutable and always holds a valid date.
 */
export class DateTime {
    /** @type {Date} */
    #date;

    /**
     * @param {string|Date|number} value - Value used to build the date.
     * @throws {Error} When the value is not a valid date.
     */
    constructor(value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date-time value');
        }
        this.#date = date;
        Object.freeze(this);
    }

    /**
     * Checks if the date is later than the current moment.
     * @returns {boolean} True when the date is in the future.
     */
    isFuture() {
        return this.#date > new Date();
    }

    /**
     * Checks if the date belongs to the same calendar day as another date.
     * @param {Date|DateTime} other - Date to compare.
     * @returns {boolean} True when both dates share year, month and day.
     */
    isSameDay(other) {
        const otherDate = other instanceof DateTime ? other.toDate() : new Date(other);
        return this.#date.toDateString() === otherDate.toDateString();
    }

    /**
     * Formats the date for the user interface.
     * @param {string} [locale='en-US'] - Locale used to format.
     * @param {Intl.DateTimeFormatOptions} [options] - Format options.
     * @returns {string} Formatted date.
     */
    format(locale = 'en-US', options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }) {
        return this.#date.toLocaleString(locale, options);
    }

    /** @returns {Date} A copy of the inner Date object. */
    toDate() {
        return new Date(this.#date.getTime());
    }

    /** @returns {string} ISO representation of the date. */
    toISOString() {
        return this.#date.toISOString();
    }

    /** @returns {number} Timestamp, so two DateTime objects can be compared with < or >. */
    valueOf() {
        return this.#date.getTime();
    }

    /** @returns {DateTime} DateTime for the current moment. */
    static now() {
        return new DateTime(new Date());
    }
}
