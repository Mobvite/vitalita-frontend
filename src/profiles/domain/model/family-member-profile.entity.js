/**
 * Family member profile aggregate root.
 *
 * @class FamilyMemberProfile
 */
export class FamilyMemberProfile {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Profile identifier.
     * @param {?number} [params.userId=null] - IAM user identifier.
     * @param {string} [params.firstName=''] - First name.
     * @param {string} [params.lastName=''] - Last name.
     * @param {string} [params.phoneNumber=''] - Phone number.
     */
    constructor({id = null, userId = null, firstName = '', lastName = '', phoneNumber = ''}) {
        this.id = id;
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
    }

    /** @returns {string} First name and last name. */
    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }
}
