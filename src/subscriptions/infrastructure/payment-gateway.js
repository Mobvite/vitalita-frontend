import {PaymentMethod} from "../domain/model/payment-method.js";

const culqiPublicKey = import.meta.env.VITE_CULQI_PUBLIC_KEY;
const CULQI_SCRIPT_URL = 'https://js.culqi.com/checkout-js';
/** Test card of the simulated gateway that is always rejected. */
const SIMULATED_REJECTED_CARD = '4000000000000002';

/**
 * Result returned by any gateway, so the store does not know which one was used.
 * @typedef {Object} GatewayResult
 * @property {boolean} approved - True when the payment was authorized.
 * @property {string} transactionId - Identifier of the token or transaction.
 * @property {string} paymentMethod - Method used.
 */

/**
 * Payment gateway adapter (IPaymentGateway in the class diagram).
 * It works as an anti-corruption layer: Culqi objects never leave this file.
 *
 * Important: the frontend only gets a token. The real charge needs the secret key,
 * so it will be done by the Vitalita API (TS10). With json-server we save the token
 * as the proof of the authorized payment.
 *
 * @class PaymentGateway
 */
export class PaymentGateway {
    /** @returns {boolean} True when the Culqi public key is configured. */
    static isCulqiConfigured() {
        return Boolean(culqiPublicKey);
    }

    /** Loads the Culqi script only once and only when it is needed. */
    static #loadCulqiScript() {
        if (window.CulqiCheckout) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = CULQI_SCRIPT_URL;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Culqi script could not be loaded'));
            document.body.appendChild(script);
        });
    }

    /**
     * Opens the Culqi Custom Checkout and waits for the token.
     * Without an order created by the backend, Culqi only offers card and Yape.
     * @param {Object} params - Checkout data.
     * @param {number} params.amountInCents - Amount in cents.
     * @param {string} params.title - Title shown in the checkout.
     * @param {string} params.email - Email of the customer.
     * @param {string} params.lang - 'es' or 'en'.
     * @returns {Promise<GatewayResult>} Result of the checkout.
     */
    static async payWithCulqi({amountInCents, title, email, lang}) {
        await this.#loadCulqiScript();
        return new Promise((resolve) => {
            const culqi = new window.CulqiCheckout(culqiPublicKey, {
                settings: {title, currency: 'PEN', amount: amountInCents},
                client: {email},
                options: {lang, installments: false, modal: true, paymentMethods: {tarjeta: true, yape: true}},
                appearance: {menuType: 'sidebar', defaultStyle: {bannerColor: '#0F766E', buttonBackground: '#0F766E', priceColor: '#0F766E'}}
            });
            culqi.culqi = () => {
                if (culqi.token) {
                    culqi.close();
                    const isYape = culqi.token.id?.startsWith('ype');
                    resolve({approved: true, transactionId: culqi.token.id, paymentMethod: isYape ? PaymentMethod.YAPE : PaymentMethod.CREDIT_CARD});
                } else {
                    console.error(culqi.error);
                    resolve({approved: false, transactionId: '', paymentMethod: PaymentMethod.CREDIT_CARD});
                }
            };
            culqi.open();
        });
    }

    /**
     * Simulated gateway for demos without a Culqi account.
     * The card 4000 0000 0000 0002 and the Yape code 000000 are always rejected,
     * so the rejected payment scenario can be shown in class (US29, scenario 2).
     * @param {Object} params - Payment data.
     * @param {string} params.paymentMethod - CreditCard, DebitCard or Yape.
     * @param {string} [params.cardNumber=''] - Card number.
     * @param {string} [params.yapeCode=''] - Six digit approval code.
     * @returns {Promise<GatewayResult>} Result after a short delay, like a real gateway.
     */
    static async payWithSimulator({paymentMethod, cardNumber = '', yapeCode = ''}) {
        await new Promise(resolve => setTimeout(resolve, 900));
        const digits = cardNumber.replace(/\s/g, '');
        const rejected = paymentMethod === PaymentMethod.YAPE ? yapeCode === '000000' : digits === SIMULATED_REJECTED_CARD;
        return {
            approved: !rejected,
            transactionId: rejected ? '' : `sim_${crypto.randomUUID().slice(0, 12)}`,
            paymentMethod
        };
    }

    /**
     * Checks a card number with the Luhn algorithm, the same check used by real gateways.
     * @param {string} cardNumber - Card number with or without spaces.
     * @returns {boolean} True when the number is well formed.
     */
    static isValidCardNumber(cardNumber) {
        const digits = cardNumber.replace(/\s/g, '');
        if (!/^\d{16}$/.test(digits)) return false;
        let sum = 0;
        for (let index = 0; index < digits.length; index++) {
            let digit = Number(digits[digits.length - 1 - index]);
            if (index % 2 === 1) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        return sum % 10 === 0;
    }
}
