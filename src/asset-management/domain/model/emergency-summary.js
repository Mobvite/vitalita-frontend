/**
 * Value object with the clinical information that a clinic needs in an emergency (US26).
 * It is built with data from other contexts and it is never stored.
 * Empty sections stay as empty arrays, so the PDF can say "No records"
 * instead of hiding the section (US37).
 */
export class EmergencySummary {
    /**
     * @param {Object} params - Summary data.
     * @param {Object} params.patient - Name, age, DNI, blood type and birth date.
     * @param {string[]} [params.allergies=[]] - Known allergies.
     * @param {string[]} [params.chronicConditions=[]] - Chronic diseases.
     * @param {Array<{name: string, dosage: string, schedule: string}>} [params.medications=[]] - Current medication.
     * @param {Array<{type: string, value: string, unit: string, measuredAt: string}>} [params.vitalSigns=[]] - Latest vital signs.
     * @param {Array<{examType: string, performedAt: string, result: string}>} [params.recentExams=[]] - Latest exams.
     * @param {Object} [params.emergencyContact={}] - Contact to call.
     * @param {Object} [params.caregiver={}] - Caregiver in charge.
     * @param {string} [params.observations=''] - Care observations.
     */
    constructor({patient, allergies = [], chronicConditions = [], medications = [], vitalSigns = [], recentExams = [],
                    emergencyContact = {}, caregiver = {}, observations = ''}) {
        this.patient = patient;
        this.allergies = allergies;
        this.chronicConditions = chronicConditions;
        this.medications = medications;
        this.vitalSigns = vitalSigns;
        this.recentExams = recentExams;
        this.emergencyContact = emergencyContact;
        this.caregiver = caregiver;
        this.observations = observations;
        this.generatedAt = new Date().toISOString();
        Object.freeze(this);
    }
}
