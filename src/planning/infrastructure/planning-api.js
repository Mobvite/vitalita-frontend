import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const env = import.meta.env;

/**
 * Infrastructure gateway for the Service Design and Planning context.
 *
 * @class PlanningApi
 * @extends BaseApi
 */
export class PlanningApi extends BaseApi {
    #reminders;
    #notifications;

    constructor() {
        super();
        this.#reminders = new BaseEndpoint(this, env.VITE_REMINDERS_ENDPOINT_PATH);
        this.#notifications = new BaseEndpoint(this, env.VITE_NOTIFICATIONS_ENDPOINT_PATH);
    }

    getReminders(olderAdultId) { return this.#reminders.getAll({olderAdultId}); }
    createReminder(resource) { return this.#reminders.create(resource); }
    updateReminder(resource) { return this.#reminders.update(resource.id, resource); }

    getNotifications(recipientUserId) { return this.#notifications.getAll({recipientUserId}); }
    createNotification(resource) { return this.#notifications.create(resource); }
    updateNotification(resource) { return this.#notifications.update(resource.id, resource); }
}
