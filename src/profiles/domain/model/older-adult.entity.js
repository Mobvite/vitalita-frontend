import {EmergencyContact} from "./emergency-contact.js";

/**
 * Older adult aggregate root. It is the center of the care follow-up.
 *
 * @class OlderAdult
 */
export class OlderAdult {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Older adult identifier.
     * @param {?number} [params.caregiverId=null] - Caregiver profile in charge.
     * @param {string} [params.firstName=''] - First name.
     * @param {string} [params.lastName=''] - Last name.
     * @param {?string} [params.birthDate=null] - Birth date in yyyy-mm-dd format.
     * @param {string} [params.documentNumber=''] - National ID (DNI).
     * @param {string} [params.bloodType=''] - Blood type, for example O+.
     * @param {string[]} [params.allergies=[]] - Known allergies.
     * @param {string[]} [params.chronicConditions=[]] - Chronic diseases.
     * @param {Object|EmergencyContact} [params.emergencyContact] - Contact for emergencies.
     * @param {string} [params.observations=''] - Care observations.
     * @param {string} [params.status='Active'] - Active, Inactive or Archived.
     */
    constructor({id = null, caregiverId = null, firstName = '', lastName = '', birthDate = null, documentNumber = '',
                    bloodType = '', allergies = [], chronicConditions = [], emergencyContact = {}, observations = '',
                    status = 'Active'}) {
        this.id = id;
        this.caregiverId = caregiverId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthDate = birthDate;
        this.documentNumber = documentNumber;
        this.bloodType = bloodType;
        this.allergies = [...allergies];
        this.chronicConditions = [...chronicConditions];
        this.emergencyContact = emergencyContact instanceof EmergencyContact ? emergencyContact : new EmergencyContact(emergencyContact);
        this.observations = observations;
        this.status = status;
    }

    /** @returns {string} First name and last name. */
    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    /** @returns {string} Two letters for the avatar. */
    get initials() {
        return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
    }

    /** @returns {?number} Age in years, or null when the birth date is missing. */
    get age() {
        if (!this.birthDate) return null;
        const birth = new Date(this.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const birthdayNotReached = today.getMonth() < birth.getMonth() ||
            (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
        if (birthdayNotReached) age--;
        return age;
    }

    /** @returns {boolean} True when the mandatory data is complete (US07). */
    hasRequiredData() {
        return this.firstName.trim() !== '' && this.lastName.trim() !== '' && this.birthDate !== null;
    }

    /** @returns {boolean} True when the older adult is followed today. */
    isActive() {
        return this.status === 'Active';
    }
}
