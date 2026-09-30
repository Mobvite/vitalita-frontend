import {Reminder} from "../domain/model/reminder.entity.js";
import {Notification} from "../domain/model/notification.entity.js";

/**
 * Builds entities from an HTTP response with a collection.
 * @param {import('axios').AxiosResponse} response - HTTP response.
 * @param {Function} EntityClass - Entity constructor.
 * @returns {Object[]} Entities.
 */
function toEntities(response, EntityClass) {
    if (response.status !== 200) {
        console.error(`${response.status}, ${response.statusText}`);
        return [];
    }
    return (response.data instanceof Array ? response.data : []).map(resource => new EntityClass({...resource}));
}

/**
 * Maps planning resources into entities and entities into resources.
 *
 * @class PlanningAssembler
 */
export class PlanningAssembler {
    static toReminders(response) { return toEntities(response, Reminder); }
    static toNotifications(response) { return toEntities(response, Notification); }

    static toEntity(EntityClass, response) {
        return new EntityClass({...response.data});
    }

    /**
     * @param {Object} entity - Reminder or notification.
     * @returns {Object} Resource ready to send, without a null id.
     */
    static toResource(entity) {
        const resource = {...entity};
        if (resource.id === null) delete resource.id;
        return resource;
    }
}
