import {VitalSignRules, VitalSignType} from "./vital-sign-type.js";

/**
 * Entity that keeps one vital sign measurement.
 *
 * @class VitalSign
 */
export class VitalSign {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Measurement identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult measured.
     * @param {string} [params.type='HeartRate'] - One of the VitalSignType values.
     * @param {?number} [params.value=null] - Main value (systolic for blood pressure).
     * @param {?number} [params.secondaryValue=null] - Diastolic value for blood pressure.
     * @param {string} [params.unit=''] - Unit. It comes from the type when it is empty.
     * @param {?string} [params.measuredAt=null] - Date of the measurement.
     */
    constructor({id = null, olderAdultId = null, type = VitalSignType.HEART_RATE, value = null, secondaryValue = null,
                    unit = '', measuredAt = null}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.type = type;
        this.value = value;
        this.secondaryValue = secondaryValue;
        this.unit = unit || VitalSignRules[type]?.unit || '';
        this.measuredAt = measuredAt ?? new Date().toISOString();
    }

    /** @returns {string} Value ready to show, for example 120/80. */
    get displayValue() {
        return this.type === VitalSignType.BLOOD_PRESSURE ? `${this.value}/${this.secondaryValue}` : `${this.value}`;
    }

    /**
     * Checks that the value has a valid format for its type (US14).
     * @returns {boolean} True when the value can be saved.
     */
    hasValidFormat() {
        const rules = VitalSignRules[this.type];
        if (!rules || typeof this.value !== 'number' || isNaN(this.value)) return false;
        const mainIsValid = this.value >= rules.min && this.value <= rules.max;
        if (this.type !== VitalSignType.BLOOD_PRESSURE) return mainIsValid;
        const secondaryIsValid = typeof this.secondaryValue === 'number'
            && this.secondaryValue >= rules.secondaryMin && this.secondaryValue <= rules.secondaryMax;
        return mainIsValid && secondaryIsValid && this.value > this.secondaryValue;
    }
}
