import {Mood} from "./mood.js";

/**
 * Daily report aggregate root. It summarizes how the older adult was during the day.
 *
 * @class DailyReport
 */
export class DailyReport {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Report identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult.
     * @param {?number} [params.recordedByUserId=null] - Caregiver that wrote it.
     * @param {?string} [params.reportDate=null] - Date of the report.
     * @param {string} [params.mood='Neutral'] - One of the Mood values.
     * @param {string} [params.generalCondition='Stable'] - Stable, Attention or Critical.
     * @param {string} [params.observations=''] - Free text.
     */
    constructor({id = null, olderAdultId = null, recordedByUserId = null, reportDate = null, mood = Mood.NEUTRAL,
                    generalCondition = 'Stable', observations = ''}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.recordedByUserId = recordedByUserId;
        this.reportDate = reportDate ?? new Date().toISOString();
        this.mood = mood;
        this.generalCondition = generalCondition;
        this.observations = observations;
    }

    /** @returns {boolean} True when the report has the required information (US13). */
    isComplete() {
        return Object.values(Mood).includes(this.mood) && this.observations.trim() !== '';
    }
}
