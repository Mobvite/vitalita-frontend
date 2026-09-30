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

    /**
     * Days until the end date, or null for the free plan.
     * @returns {?number} Remaining days, never negative.
     */
    get remainingDays() {
        if (!this.endDate) return null;
        const days = Math.ceil((new Date(this.endDate) - new Date()) / (24 * 60 * 60 * 1000));
        return Math.max(days, 0);
    }

    /** @returns {string} Effective status: Expired when the end date already passed. */
    get effectiveStatus() {
        return this.status === 'Active' && this.endDate && new Date(this.endDate) <= new Date() ? 'Expired' : this.status;
    }

    /** Cancels the subscription, for example when the caregiver changes plan. */
    cancel() {
        this.status = 'Cancelled';
    }

    /**
     * Starts a subscription for a plan. Paid plans end after one month or one year;
     * the free plan has no end date.
     * @param {number} userId - Owner user.
     * @param {import('./plan.entity.js').Plan} plan - Chosen plan.
     * @returns {Subscription} New active subscription.
     */
    static start(userId, plan) {
        const startDate = new Date();
        let endDate = null;
        if (plan.price > 0) {
            endDate = new Date(startDate);
            if (plan.billingPeriod === 'Annual') endDate.setFullYear(endDate.getFullYear() + 1);
            else endDate.setMonth(endDate.getMonth() + 1);
        }
        return new Subscription({
            userId, planId: plan.id, startDate: startDate.toISOString(),
            endDate: endDate?.toISOString() ?? null, status: 'Active'
        });
    }

    /** @returns {boolean} True when the subscription can be used today. */
    isActive() {
        const notExpired = this.endDate === null || new Date(this.endDate) > new Date();
        return this.status === 'Active' && notExpired;
    }
}
