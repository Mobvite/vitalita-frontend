/**
 * Types of entries in the patient history. Values match the HistoryEntryType enum.
 * @readonly
 * @enum {string}
 */
export const HistoryEntryType = Object.freeze({
    DAILY_REPORT: 'DailyReport',
    VITAL_SIGN: 'VitalSign',
    MEDICATION: 'Medication',
    APPOINTMENT: 'Appointment',
    EXAM: 'Exam',
    CARE_ACTIVITY: 'CareActivity'
});
