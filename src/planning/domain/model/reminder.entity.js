import {ReminderType} from "./reminder-type.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * Reminder aggregate root. It warns the caregiver about a pending activity.
 *
 * @class Reminder
 */
export class Reminder {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Reminder identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult.
     * @param {?number} [params.userId=null] - Caregiver that receives it.
     * @param {?number} [params.relatedRecordId=null] - Appointment or exam that created it. Null for personal reminders.
     * @param {string} [params.type='Other'] - One of the ReminderType values.
     * @param {string} [params.message=''] - Text of the reminder.
     * @param {?string} [params.scheduledAt=null] - When it must be shown.
     * @param {string} [params.status='Pending'] - Pending, Sent, Reviewed or Cancelled.
     * @param {?string} [params.reviewedAt=null] - When the caregiver reviewed it.
     */
    constructor({id = null, olderAdultId = null, userId = null, relatedRecordId = null, type = ReminderType.OTHER,
                    message = '', scheduledAt = null, status = 'Pending', reviewedAt = null}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.userId = userId;
        this.relatedRecordId = relatedRecordId;
        this.type = type;
        this.message = message;
        this.scheduledAt = scheduledAt;
        this.status = status;
        this.reviewedAt = reviewedAt;
    }

    /** @returns {boolean} True while the caregiver has not reviewed it. */
    isPending() {
        return this.status === 'Pending' || this.status === 'Sent';
    }

    /** @returns {boolean} True when the time already passed and it is still pending. */
    isOverdue() {
        return this.isPending() && new Date(this.scheduledAt) < new Date();
    }

    /** Marks the reminder as reviewed and keeps the date (US25, scenario 3). */
    markReviewed() {
        this.status = 'Reviewed';
        this.reviewedAt = new Date().toISOString();
    }

    /** Cancels the reminder, for example when its appointment was completed. */
    cancel() {
        this.status = 'Cancelled';
    }

    /**
     * Creates a personal reminder (US34). The date must be in the future.
     * @param {Object} params - Reminder data.
     * @param {number} params.olderAdultId - Older adult.
     * @param {number} params.userId - Caregiver.
     * @param {string} params.message - Text.
     * @param {Date} params.scheduledAt - Date and time.
     * @param {string} [params.type='Other'] - Reminder type.
     * @returns {Reminder} New pending reminder.
     * @throws {Error} When the message is empty or the date is not in the future.
     */
    static createPersonal({olderAdultId, userId, message, scheduledAt, type = ReminderType.OTHER}) {
        if (!message?.trim()) throw new Error('planning.errors.empty-message');
        if (!(scheduledAt instanceof Date) || scheduledAt <= new Date()) throw new Error('planning.errors.past-date');
        return new Reminder({olderAdultId, userId, type, message: message.trim(), scheduledAt: scheduledAt.toISOString()});
    }

    /**
     * Automatic reminder for an appointment: one day before, or now when the
     * appointment is closer than one day.
     * @param {Object} appointment - Appointment of the Monitoring context.
     * @param {number} userId - Caregiver.
     * @returns {Reminder} New pending reminder.
     */
    static forAppointment(appointment, userId) {
        const oneDayBefore = new Date(new Date(appointment.scheduledAt).getTime() - ONE_DAY);
        const scheduledAt = oneDayBefore > new Date() ? oneDayBefore : new Date();
        return new Reminder({
            olderAdultId: appointment.olderAdultId, userId, relatedRecordId: appointment.id,
            type: ReminderType.APPOINTMENT, message: appointment.specialty, scheduledAt: scheduledAt.toISOString()
        });
    }

    /**
     * Automatic reminder for an exam without result, two days after the exam.
     * @param {Object} exam - Exam of the Monitoring context.
     * @param {number} userId - Caregiver.
     * @returns {Reminder} New pending reminder.
     */
    static forPendingExam(exam, userId) {
        const twoDaysAfter = new Date(new Date(exam.performedAt).getTime() + 2 * ONE_DAY);
        const scheduledAt = twoDaysAfter > new Date() ? twoDaysAfter : new Date();
        return new Reminder({
            olderAdultId: exam.olderAdultId, userId, relatedRecordId: exam.id,
            type: ReminderType.EXAM_RESULT, message: exam.examType, scheduledAt: scheduledAt.toISOString()
        });
    }
}
