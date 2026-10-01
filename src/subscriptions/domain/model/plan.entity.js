/**
 * Plan aggregate root of the Subscriptions and Payment Management context.
 *
 * @class Plan
 */
export class Plan {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Plan identifier.
     * @param {string} [params.name=''] - Commercial name.
     * @param {string} [params.type='Freemium'] - Freemium, Pro or Agency.
     * @param {number} [params.price=0] - Price in soles.
     * @param {string} [params.billingPeriod='Monthly'] - Monthly or Annual.
     * @param {number} [params.maxOlderAdults=1] - Older adults allowed.
     * @param {?number} [params.maxFamilyMembers=2] - Family members per older adult. Null means unlimited.
     * @param {number} [params.maxStorageMb=100] - Storage for evidences.
     * @param {boolean} [params.pdfExport=false] - True when the plan can export PDF.
     * @param {boolean} [params.emailReminders=false] - True when the plan sends email reminders.
     * @param {boolean} [params.active=true] - True when the plan can be sold.
     */
    constructor({id = null, name = '', type = 'Freemium', price = 0, billingPeriod = 'Monthly', maxOlderAdults = 1,
                    maxFamilyMembers = 2, maxStorageMb = 100, pdfExport = false, emailReminders = false, active = true}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.price = price;
        this.billingPeriod = billingPeriod;
        this.maxOlderAdults = maxOlderAdults;
        this.maxFamilyMembers = maxFamilyMembers;
        this.maxStorageMb = maxStorageMb;
        this.pdfExport = pdfExport;
        this.emailReminders = emailReminders;
        this.active = active;
    }

    /**
     * Checks if one more older adult fits in this plan.
     * @param {number} currentCount - Older adults already managed.
     * @returns {boolean} True when the limit is not reached.
     */
    allowsAnotherOlderAdult(currentCount) {
        return currentCount < this.maxOlderAdults;
    }

    /**
     * Checks if one more family member fits for an older adult.
     * @param {number} currentCount - Family members already invited.
     * @returns {boolean} True when the limit is not reached.
     */
    allowsAnotherFamilyMember(currentCount) {
        return this.maxFamilyMembers === null || currentCount < this.maxFamilyMembers;
    }

    /** @returns {boolean} True for plans that need a payment. */
    isPaid() {
        return this.price > 0;
    }

    /** @returns {string} Price in soles with two decimals, for example 19.90. */
    get formattedPrice() {
        return this.price.toFixed(2);
    }

    /** @returns {number} Price in cents, the unit that Culqi uses. */
    get priceInCents() {
        return Math.round(this.price * 100);
    }

    /** @returns {Plan} The free plan used when a caregiver has no subscription yet. */
    static freemium() {
        return new Plan({name: 'Freemium', type: 'Freemium'});
    }
}
