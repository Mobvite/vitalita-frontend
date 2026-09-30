/**
 * Medical appointment aggregate root (US16, US17).
 *
 * @class MedicalAppointment
 */
export class MedicalAppointment {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Appointment identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult.
     * @param {string} [params.specialty=''] - Medical specialty.
     * @param {string} [params.doctorName=''] - Doctor name.
     * @param {string} [params.location=''] - Clinic or hospital.
     * @param {?string} [params.scheduledAt=null] - Date and time.
     * @param {string} [params.status='Scheduled'] - Scheduled, Completed or Cancelled.
     * @param {string} [params.result=''] - What the doctor said.
     * @param {string} [params.observations=''] - Indications after the visit.
     */
    constructor({id = null, olderAdultId = null, specialty = '', doctorName = '', location = '', scheduledAt = null,
                    status = 'Scheduled', result = '', observations = ''}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.specialty = specialty;
        this.doctorName = doctorName;
        this.location = location;
        this.scheduledAt = scheduledAt;
        this.status = status;
        this.result = result;
        this.observations = observations;
    }

    /** @returns {boolean} True when the appointment is still ahead. */
    isUpcoming() {
        return this.status === 'Scheduled' && new Date(this.scheduledAt) >= new Date();
    }

    /** @returns {boolean} True when the appointment has the required data. */
    isValid() {
        return this.specialty.trim() !== '' && this.scheduledAt !== null;
    }

    /**
     * Saves the result after the visit (US17).
     * @param {string} result - What the doctor said.
     * @param {string} observations - Indications to follow.
     */
    complete(result, observations) {
        this.result = result;
        this.observations = observations;
        this.status = 'Completed';
    }
}
