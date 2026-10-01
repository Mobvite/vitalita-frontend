/**
 * Notification aggregate root. It tells a user about a relevant update (US24).
 *
 * @class Notification
 */
export class Notification {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Notification identifier.
     * @param {?number} [params.recipientUserId=null] - User that receives it.
     * @param {?number} [params.olderAdultId=null] - Older adult related.
     * @param {string} [params.type='HealthUpdate'] - HealthUpdate, AppointmentUpdate, ExamUpdate, Emergency or Invitation.
     * @param {string} [params.title=''] - Short title.
     * @param {string} [params.message=''] - Detail.
     * @param {string} [params.status='Sent'] - Pending, Sent, Read or Failed.
     * @param {?string} [params.createdAt=null] - Creation date.
     * @param {?string} [params.readAt=null] - Reading date.
     */
    constructor({id = null, recipientUserId = null, olderAdultId = null, type = 'HealthUpdate', title = '', message = '',
                    status = 'Sent', createdAt = null, readAt = null}) {
        this.id = id;
        this.recipientUserId = recipientUserId;
        this.olderAdultId = olderAdultId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt ?? new Date().toISOString();
        this.readAt = readAt;
    }

    /** @returns {boolean} True when the user has not opened it. */
    isUnread() {
        return this.status !== 'Read';
    }

    markRead() {
        this.status = 'Read';
        this.readAt = new Date().toISOString();
    }
}
