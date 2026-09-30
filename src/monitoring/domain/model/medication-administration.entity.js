/**
 * Entity that records that a scheduled dose was given (US15).
 *
 * @class MedicationAdministration
 */
export class MedicationAdministration {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Record identifier.
     * @param {?number} [params.medicationId=null] - Medication given.
     * @param {?number} [params.olderAdultId=null] - Older adult.
     * @param {string} [params.scheduledTime=''] - Scheduled hour in HH:mm format.
     * @param {?string} [params.administeredAt=null] - Real date and time.
     * @param {string} [params.dosageGiven=''] - Dose given.
     * @param {string} [params.status='Administered'] - Pending, Administered or Skipped.
     */
    constructor({id = null, medicationId = null, olderAdultId = null, scheduledTime = '', administeredAt = null,
                    dosageGiven = '', status = 'Administered'}) {
        this.id = id;
        this.medicationId = medicationId;
        this.olderAdultId = olderAdultId;
        this.scheduledTime = scheduledTime;
        this.administeredAt = administeredAt ?? new Date().toISOString();
        this.dosageGiven = dosageGiven;
        this.status = status;
    }

    /**
     * Two records are the same dose when they share medication, hour and day.
     * This is the rule that avoids duplicated doses.
     * @param {MedicationAdministration} other - Record to compare.
     * @returns {boolean} True when both records are the same dose.
     */
    isSameDoseAs(other) {
        return this.medicationId === other.medicationId
            && this.scheduledTime === other.scheduledTime
            && new Date(this.administeredAt).toDateString() === new Date(other.administeredAt).toDateString();
    }
}
