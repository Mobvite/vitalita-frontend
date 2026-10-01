/**
 * Caregiver profile aggregate root. It holds the professional data
 * that family members can see.
 *
 * @class CaregiverProfile
 */
export class CaregiverProfile {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Profile identifier.
     * @param {?number} [params.userId=null] - IAM user identifier.
     * @param {string} [params.firstName=''] - First name.
     * @param {string} [params.lastName=''] - Last name.
     * @param {string} [params.phoneNumber=''] - Phone number.
     * @param {string} [params.professionalTitle=''] - Professional title.
     * @param {string} [params.bio=''] - Short presentation.
     * @param {string} [params.photoUrl=''] - Photo URL.
     * @param {string[]} [params.certifications=[]] - Certifications and courses.
     */
    constructor({id = null, userId = null, firstName = '', lastName = '', phoneNumber = '', professionalTitle = '',
                    bio = '', photoUrl = '', certifications = []}) {
        this.id = id;
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.professionalTitle = professionalTitle;
        this.bio = bio;
        this.photoUrl = photoUrl;
        this.certifications = [...certifications];
    }

    /** @returns {string} First name and last name. */
    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    /** @returns {string} Two letters for the avatar. */
    get initials() {
        return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
    }
}
