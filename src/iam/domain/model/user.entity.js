import {UserRole} from "./user-role.js";

/**
 * IAM user aggregate root as the client sees it.
 * The password never reaches this object.
 *
 * @class User
 */
export class User {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - User identifier.
     * @param {string} [params.email=''] - Account email.
     * @param {string} [params.role=''] - One of the UserRole values.
     * @param {string} [params.status='Active'] - Account status.
     */
    constructor({id = null, email = '', role = '', status = 'Active'}) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.status = status;
    }

    /** @returns {boolean} True when the user takes care of older adults. */
    isCaregiver() {
        return this.role === UserRole.CAREGIVER;
    }

    /** @returns {boolean} True when the user only reads the follow-up. */
    isFamilyMember() {
        return this.role === UserRole.FAMILY_MEMBER;
    }

    /** @returns {boolean} True when the account can be used. */
    isActive() {
        return this.status === 'Active';
    }
}
