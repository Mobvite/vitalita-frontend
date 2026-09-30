const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Value object for an email address.
 * It keeps the email in lower case and rejects invalid formats.
 */
export class Email {
    /** @type {string} */
    #value;

    /**
     * @param {string} value - Email typed by the user.
     * @throws {Error} When the email format is not valid.
     */
    constructor(value) {
        const normalized = (value ?? '').trim().toLowerCase();
        if (!Email.isValid(normalized)) {
            throw new Error('Invalid email');
        }
        this.#value = normalized;
        Object.freeze(this);
    }

    /** @returns {string} The normalized email. */
    get value() {
        return this.#value;
    }

    /**
     * Checks the format without creating the object. Useful in forms.
     * @param {string} value - Email to check.
     * @returns {boolean} True when the format is valid.
     */
    static isValid(value) {
        return EMAIL_PATTERN.test((value ?? '').trim());
    }

    /** @returns {string} The normalized email. */
    toString() {
        return this.#value;
    }
}
