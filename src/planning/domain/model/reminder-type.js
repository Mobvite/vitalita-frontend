/**
 * Types of reminders. Values match the ReminderType enum.
 * @readonly
 * @enum {string}
 */
export const ReminderType = Object.freeze({
    APPOINTMENT: 'Appointment',
    MEDICATION: 'Medication',
    THERAPY: 'Therapy',
    EXAM_RESULT: 'ExamResult',
    OTHER: 'Other'
});
