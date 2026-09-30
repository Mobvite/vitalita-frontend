import {AssetType} from "./asset-type.js";

/** Formats accepted for evidences. */
export const ALLOWED_CONTENT_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
/** Max size of one evidence: 5 MB. */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Clinical asset aggregate root. It keeps the metadata of a stored file.
 * The file itself lives in the object storage, not in the database.
 *
 * @class ClinicalAsset
 */
export class ClinicalAsset {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Asset identifier.
     * @param {?number} [params.olderAdultId=null] - Older adult owner of the file.
     * @param {string} [params.fileName=''] - Original file name.
     * @param {string} [params.storageUrl=''] - URL returned by the storage.
     * @param {string} [params.contentType=''] - MIME type.
     * @param {string} [params.assetType='ExamImage'] - One of the AssetType values.
     * @param {?string} [params.uploadedAt=null] - Upload date.
     */
    constructor({id = null, olderAdultId = null, fileName = '', storageUrl = '', contentType = '',
                    assetType = AssetType.EXAM_IMAGE, uploadedAt = null}) {
        this.id = id;
        this.olderAdultId = olderAdultId;
        this.fileName = fileName;
        this.storageUrl = storageUrl;
        this.contentType = contentType;
        this.assetType = assetType;
        this.uploadedAt = uploadedAt ?? new Date().toISOString();
    }

    /** @returns {boolean} True when the file can be shown as an image. */
    isImage() {
        return this.contentType.startsWith('image/');
    }

    /**
     * Checks a file before uploading it (US19).
     * @param {File} file - File selected by the user.
     * @returns {?string} Error key, or null when the file is valid.
     */
    static validateFile(file) {
        if (!ALLOWED_CONTENT_TYPES.includes(file.type)) return 'asset-management.errors.file-type';
        if (file.size > MAX_FILE_SIZE) return 'asset-management.errors.file-size';
        return null;
    }
}
