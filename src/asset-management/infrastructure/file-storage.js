const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
/** Max size for the local fallback. Bigger data URLs make db.json too heavy. */
const LOCAL_FALLBACK_MAX_SIZE = 1024 * 1024;

/**
 * Adapter for the object storage (IFileStorage in the class diagram).
 *
 * With Cloudinary configured, the browser uploads the file with an unsigned
 * upload preset, so no secret key is exposed in the frontend.
 * Without configuration, small files are kept as data URLs, only for local demos.
 * When the Vitalita API is ready, the upload will go through the backend.
 *
 * @class FileStorage
 */
export class FileStorage {
    /** @returns {boolean} True when Cloudinary is configured. */
    static isCloudConfigured() {
        return Boolean(cloudName && uploadPreset);
    }

    /**
     * Uploads a file and returns its public URL.
     * @param {File} file - File to upload.
     * @returns {Promise<string>} URL of the stored file.
     * @throws {Error} When the upload fails or the local file is too big.
     */
    static async upload(file) {
        if (this.isCloudConfigured()) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', 'vitalita/evidences');
            // Cloudinary uses 'auto' to accept images and PDF files in the same endpoint
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {method: 'POST', body: formData});
            if (!response.ok) throw new Error(`Upload failed with status ${response.status}`);
            const data = await response.json();
            return data['secure_url'];
        }
        if (file.size > LOCAL_FALLBACK_MAX_SIZE) {
            throw new Error('File too big for the local demo storage');
        }
        return this.#readAsDataUrl(file);
    }

    /**
     * @param {File} file - File to read.
     * @returns {Promise<string>} Base64 data URL.
     */
    static #readAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
}
