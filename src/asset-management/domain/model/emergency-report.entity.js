/**
 * Emergency report aggregate root. It records that a summary was generated,
 * who generated it and its state.
 *
 * @class EmergencyReport
 */
export class EmergencyReport {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Report identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult of the report.
     * @param {?number} [params.generatedByUserId=null] - User that generated it.
     * @param {?string} [params.generatedAt=null] - Generation date.
     * @param {string} [params.fileUrl=''] - Stored file, empty when it was only downloaded.
     * @param {string} [params.status='Pending'] - Pending, Generated or Failed.
     */
    constructor({id = null, olderAdultId = null, generatedByUserId = null, generatedAt = null, fileUrl = '', status = 'Pending'}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.generatedByUserId = generatedByUserId;
        this.generatedAt = generatedAt ?? new Date().toISOString();
        this.fileUrl = fileUrl;
        this.status = status;
    }

    /** @param {string} [fileUrl=''] - Location of the file. */
    markGenerated(fileUrl = '') {
        this.fileUrl = fileUrl;
        this.status = 'Generated';
    }

    markFailed() {
        this.status = 'Failed';
    }
}
