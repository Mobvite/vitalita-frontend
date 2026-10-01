/**
 * Categories of the patient notes. Each note is stored as a CareActivity.
 * @readonly
 * @enum {string}
 */
export const CareActivityType = Object.freeze({
    OBSERVATION: 'Observation',
    MEDICATION: 'Medication',
    FEEDING: 'Feeding',
    SYMPTOM: 'Symptom',
    THERAPY: 'Therapy'
});
