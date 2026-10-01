/**
 * Entity that links a stored file with the exam that created it.
 * An evidence never exists without its exam.
 *
 * @class ExamEvidence
 */
export class ExamEvidence {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Evidence identifier.
     * @param {?number} [params.examId=null] - Exam of the Monitoring context.
     * @param {?number} [params.assetId=null] - Stored file.
     * @param {string} [params.description=''] - Short description.
     */
    constructor({id = null, examId = null, assetId = null, description = ''}) {
        this.id = id;
        this.examId = examId;
        this.assetId = assetId;
        this.description = description;
    }
}
