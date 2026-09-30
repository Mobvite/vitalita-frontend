/**
 * Medical exam aggregate root (US18).
 *
 * @class MedicalExam
 */
export class MedicalExam {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Exam identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult.
     * @param {string} [params.examType=''] - Name of the exam.
     * @param {string} [params.category='Laboratory'] - Laboratory, MedicalImaging or Report.
     * @param {?string} [params.performedAt=null] - Date of the exam.
     * @param {string} [params.resultSummary=''] - Summary of the result.
     * @param {string} [params.status='Requested'] - Requested, PendingResult or Completed.
     */
    constructor({id = null, olderAdultId = null, examType = '', category = 'Laboratory', performedAt = null,
                    resultSummary = '', status = 'Requested'}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.examType = examType;
        this.category = category;
        this.performedAt = performedAt;
        this.resultSummary = resultSummary;
        this.status = status;
    }

    /** @returns {boolean} True while the result is missing. */
    isPending() {
        return this.status !== 'Completed';
    }

    /**
     * Saves the result and closes the exam.
     * @param {string} resultSummary - Summary of the result.
     */
    registerResult(resultSummary) {
        this.resultSummary = resultSummary;
        this.status = 'Completed';
    }
}
