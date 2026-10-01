/**
 * Value object with the person to call in an emergency.
 */
export class EmergencyContact {
    /**
     * @param {Object} params - Contact data.
     * @param {string} [params.name=''] - Full name.
     * @param {string} [params.phoneNumber=''] - Phone number.
     * @param {string} [params.relationship=''] - Relationship with the older adult.
     */
    constructor({name = '', phoneNumber = '', relationship = ''} = {}) {
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.relationship = relationship;
        Object.freeze(this);
    }

    /** @returns {boolean} True when there is a name and a phone to call. */
    isComplete() {
        return this.name.trim() !== '' && this.phoneNumber.trim() !== '';
    }
}
