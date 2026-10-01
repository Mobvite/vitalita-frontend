import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const plansEndpointPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH;
const subscriptionsEndpointPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH;
const paymentsEndpointPath = import.meta.env.VITE_PAYMENTS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the Subscriptions and Payment Management context.
 *
 * @class SubscriptionsApi
 * @extends BaseApi
 */
export class SubscriptionsApi extends BaseApi {
    #plansEndpoint;
    #subscriptionsEndpoint;
    #paymentsEndpoint;

    constructor() {
        super();
        this.#plansEndpoint = new BaseEndpoint(this, plansEndpointPath);
        this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsEndpointPath);
        this.#paymentsEndpoint = new BaseEndpoint(this, paymentsEndpointPath);
    }

    /** @returns {Promise<import('axios').AxiosResponse>} Active plans. */
    getPlans() {
        return this.#plansEndpoint.getAll({active: true});
    }

    /**
     * @param {number} userId - Owner user.
     * @returns {Promise<import('axios').AxiosResponse>} Subscriptions of the user.
     */
    getSubscriptionsByUserId(userId) {
        return this.#subscriptionsEndpoint.getAll({userId});
    }

    createSubscription(resource) {
        return this.#subscriptionsEndpoint.create(resource);
    }

    updateSubscription(resource) {
        return this.#subscriptionsEndpoint.update(resource.id, resource);
    }

    getPaymentsBySubscriptionIds(ids) {
        return this.#paymentsEndpoint.getAll(new URLSearchParams(ids.map(id => ['subscriptionId', String(id)])));
    }

    createPayment(resource) {
        return this.#paymentsEndpoint.create(resource);
    }
}
