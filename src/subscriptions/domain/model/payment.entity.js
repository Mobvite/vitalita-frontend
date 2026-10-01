/**
 * Payment entity. It belongs to a subscription and records one transaction.
 *
 * @class Payment
 */
export class Payment {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Payment identifier.
     * @param {?number} [params.subscriptionId=null] - Subscription paid.
     * @param {number} [params.amount=0] - Amount in soles.
     * @param {string} [params.paymentMethod='CreditCard'] - One of the PaymentMethod values.
     * @param {string} [params.transactionId=''] - Identifier returned by the gateway.
     * @param {string} [params.status='Pending'] - Pending, Approved, Rejected or Cancelled.
     * @param {?string} [params.paidAt=null] - Date of the payment.
     */
    constructor({id = null, subscriptionId = null, amount = 0, paymentMethod = 'CreditCard', transactionId = '',
                    status = 'Pending', paidAt = null}) {
        this.id = id;
        this.subscriptionId = subscriptionId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.status = status;
        this.paidAt = paidAt;
    }

    /** @param {string} transactionId - Identifier given by the gateway. */
    markApproved(transactionId) {
        this.transactionId = transactionId;
        this.status = 'Approved';
        this.paidAt = new Date().toISOString();
    }

    markRejected() {
        this.status = 'Rejected';
        this.paidAt = new Date().toISOString();
    }

    /** @returns {boolean} True when the money was received. */
    isApproved() {
        return this.status === 'Approved';
    }
}
