/**
 * Read model with the summary that a family member sees first (US22).
 * It is not an aggregate: it only projects data from other contexts.
 */
export class FamilyDashboard {
    /**
     * @param {Object} params - Dashboard data.
     * @param {?number} params.olderAdultId - Older adult.
     * @param {string} params.olderAdultName - Full name.
     * @param {?string} params.lastUpdateAt - Date of the newest record.
     * @param {?string} params.latestMood - Mood of the last daily report.
     * @param {?string} params.generalCondition - Condition of the last daily report.
     * @param {?string} params.latestReportText - Observations of the last daily report.
     * @param {number} params.pendingAppointments - Upcoming appointments.
     * @param {number} params.pendingExams - Exams without result.
     * @param {number} params.dosesGivenToday - Doses registered today.
     * @param {number} params.dosesPlannedToday - Doses planned for today.
     */
    constructor({olderAdultId, olderAdultName, lastUpdateAt, latestMood, generalCondition, latestReportText,
                    pendingAppointments, pendingExams, dosesGivenToday, dosesPlannedToday}) {
        Object.assign(this, {
            olderAdultId, olderAdultName, lastUpdateAt, latestMood, generalCondition, latestReportText,
            pendingAppointments, pendingExams, dosesGivenToday, dosesPlannedToday
        });
        Object.freeze(this);
    }
}
