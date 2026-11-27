import {AccessStatus} from "./access-status.js";

/**
 * Entity that gives a family member read-only access to an older adult.
 * The invitation exists before the family member has an account,
 * so familyMemberId stays null until the invitation is accepted.
 *
 * @class FamilyAccess
 */
export class FamilyAccess {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Access identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult shared.
     * @param {?number} [params.familyMemberId=null] - Family member profile. Null while pending.
     * @param {string} [params.invitedEmail=''] - Email of the invited person.
     * @param {string} [params.invitationCode=''] - Code used to create the account.
     * @param {string} [params.relationship=''] - Relationship with the older adult.
     * @param {string} [params.status='Pending'] - Pending, Active or Revoked.
     * @param {?string} [params.invitedAt=null] - Invitation date.
     * @param {?string} [params.acceptedAt=null] - Acceptance date.
     * @param {?string} [params.expiresAt=null] - Last day to accept.
     */
    constructor({id = null, olderAdultId = null, familyMemberId = null, invitedEmail = '', invitationCode = '',
                    relationship = '', status = AccessStatus.PENDING, invitedAt = null, acceptedAt = null, expiresAt = null}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.familyMemberId = familyMemberId;
        this.invitedEmail = invitedEmail;
        this.invitationCode = invitationCode;
        this.relationship = relationship;
        this.status = status;
        this.invitedAt = invitedAt;
        this.acceptedAt = acceptedAt;
        this.expiresAt = expiresAt;
    }

    /** @returns {boolean} True when the family member can read the follow-up. */
    isActive() {
        return this.status === AccessStatus.ACTIVE;
    }

    /** @returns {boolean} True when the invitation is still waiting. */
    isPending() {
        return this.status === AccessStatus.PENDING;
    }

    /** @returns {boolean} True when the acceptance date already passed. */
    isExpired() {
        return this.expiresAt !== null && new Date(this.expiresAt) < new Date();
    }

    /** @returns {boolean} True when the invitation can still be used (US31). */
    canBeAccepted() {
        return this.isPending() && !this.isExpired();
    }

    /**
     * Accepts the invitation and links the family member profile.
     * @param {number} familyMemberId - Family member profile identifier.
     * @throws {Error} When the invitation is expired or revoked.
     */
    accept(familyMemberId) {
        if (!this.canBeAccepted()) throw new Error('Invitation is not valid');
        this.familyMemberId = familyMemberId;
        this.status = AccessStatus.ACTIVE;
        this.acceptedAt = new Date().toISOString();
    }

    /** Removes the access of the family member (US32). */
    revoke() {
        this.status = AccessStatus.REVOKED;
    }
}
