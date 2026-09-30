import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const plansEndpointPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH;
const subscriptionsEndpointPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the Subscriptions and Payment Management context.
 *
 * @class SubscriptionsApi
 * @extends BaseApi
 */
export class SubscriptionsApi extends BaseApi {
    #plansEndpoint;
    #subscriptionsEndpoint;

    constructor() {
        super();
        this.#plansEndpoint = new BaseEndpoint(this, plansEndpointPath);
        this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsEndpointPath);
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
}
