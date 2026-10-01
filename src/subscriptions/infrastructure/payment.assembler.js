import {Payment} from "../domain/model/payment.entity.js";

/**
 * Maps payment resources into entities and entities into resources.
 *
 * @class PaymentAssembler
 */
export class PaymentAssembler {
    /**
     * @param {import('axios').AxiosResponse} response - HTTP response with payments.
     * @returns {Payment[]} Payment entities.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        return (response.data instanceof Array ? response.data : []).map(resource => new Payment({...resource}));
    }

    /**
     * @param {Object} entity - Payment or subscription entity.
     * @returns {Object} Resource ready to send, without a null id.
     */
    static toResource(entity) {
        const resource = {...entity};
        if (resource.id === null) delete resource.id;
        return resource;
    }
}
