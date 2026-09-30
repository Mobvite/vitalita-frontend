/**
 * Subscription aggregate root. It links a user with a plan.
 *
 * @class Subscription
 */
export class Subscription {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Subscription identifier.
     * @param {?number} [params.userId=null] - Owner user.
     * @param {?number} [params.planId=null] - Contracted plan.
     * @param {?string} [params.startDate=null] - Start date.
     * @param {?string} [params.endDate=null] - End date. Null for the free plan.
     * @param {string} [params.status='Active'] - Trial, Active, PastDue, Cancelled or Expired.
     */
    constructor({id = null, userId = null, planId = null, startDate = null, endDate = null, status = 'Active'}) {
        this.id = id;
        this.userId = userId;
        this.planId = planId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
    }

    /** @returns {boolean} True when the subscription can be used today. */
    isActive() {
        const notExpired = this.endDate === null || new Date(this.endDate) > new Date();
        return this.status === 'Active' && notExpired;
    }
}
