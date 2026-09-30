import {Subscription} from "../domain/model/subscription.entity.js";

/**
 * Maps subscription resources into domain entities.
 *
 * @class SubscriptionAssembler
 */
export class SubscriptionAssembler {
    /**
     * @param {Object} resource - Subscription resource.
     * @returns {Subscription} Subscription entity.
     */
    static toEntityFromResource(resource) {
        return new Subscription({...resource});
    }

    /**
     * @param {import('axios').AxiosResponse} response - HTTP response with subscription resources.
     * @returns {Subscription[]} Subscription entities.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['subscriptions'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
