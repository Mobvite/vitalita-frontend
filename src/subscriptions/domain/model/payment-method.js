/**
 * Payment methods. Values match the PaymentMethod enum of the class diagram.
 * @readonly
 * @enum {string}
 */
export const PaymentMethod = Object.freeze({
    CREDIT_CARD: 'CreditCard',
    DEBIT_CARD: 'DebitCard',
    YAPE: 'Yape',
    PLIN: 'Plin',
    BANK_TRANSFER: 'BankTransfer',
    CASH_AGENT: 'CashAgent'
});
