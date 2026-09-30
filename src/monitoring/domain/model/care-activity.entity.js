import {CareActivityType} from "./care-activity-type.js";

/**
 * Entity for a care activity or a patient note (US20).
 *
 * @class CareActivity
 */
export class CareActivity {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Activity identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult.
     * @param {?number} [params.recordedByUserId=null] - Caregiver that wrote it.
     * @param {string} [params.activityType='Observation'] - One of the CareActivityType values.
     * @param {string} [params.description=''] - What happened.
     * @param {?string} [params.performedAt=null] - When it happened.
     * @param {boolean} [params.completed=true] - True when the activity was done.
     */
    constructor({id = null, olderAdultId = null, recordedByUserId = null, activityType = CareActivityType.OBSERVATION,
                    description = '', performedAt = null, completed = true}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.recordedByUserId = recordedByUserId;
        this.activityType = activityType;
        this.description = description;
        this.performedAt = performedAt ?? new Date().toISOString();
        this.completed = completed;
    }

    /** @returns {boolean} True when the note can be saved. */
    isValid() {
        return this.description.trim().length >= 3 && Object.values(CareActivityType).includes(this.activityType);
    }
}
