/**
 * Medication aggregate root. It keeps the prescription and its schedule.
 *
 * @class Medication
 */
export class Medication {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Medication identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult.
     * @param {string} [params.name=''] - Medication name.
     * @param {string} [params.dosage=''] - Dose, for example 50 mg.
     * @param {string} [params.frequency=''] - How often it is taken.
     * @param {string[]} [params.scheduleTimes=[]] - Hours in HH:mm format.
     * @param {string} [params.instructions=''] - Extra instructions.
     * @param {boolean} [params.active=true] - True while the treatment continues.
     */
    constructor({id = null, olderAdultId = null, name = '', dosage = '', frequency = '', scheduleTimes = [],
                    instructions = '', active = true}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.name = name;
        this.dosage = dosage;
        this.frequency = frequency;
        this.scheduleTimes = [...scheduleTimes].sort();
        this.instructions = instructions;
        this.active = active;
    }

    /** @returns {boolean} True when the medication has the required data. */
    isValid() {
        const validTimes = this.scheduleTimes.every(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time));
        return this.name.trim() !== '' && this.dosage.trim() !== '' && this.scheduleTimes.length > 0 && validTimes;
    }
}
