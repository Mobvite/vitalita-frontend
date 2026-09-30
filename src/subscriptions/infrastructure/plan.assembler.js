import {Plan} from "../domain/model/plan.entity.js";

/**
 * Maps plan resources into domain entities.
 *
 * @class PlanAssembler
 */
export class PlanAssembler {
    /**
     * @param {Object} resource - Plan resource.
     * @returns {Plan} Plan entity.
     */
    static toEntityFromResource(resource) {
        return new Plan({...resource});
    }

    /**
     * @param {import('axios').AxiosResponse} response - HTTP response with plan resources.
     * @returns {Plan[]} Plan entities.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['plans'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
