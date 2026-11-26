/**
 * Error raised by the HTTP client. It keeps the RFC 7807 ProblemDetails
 * fields sent by the Vitalita API, so the stores can react to the status
 * and the views can show the localized message.
 *
 * @class ApiError
 * @extends Error
 */
export class ApiError extends Error {
    /**
     * @param {Object} params - Error attributes.
     * @param {string} params.message - Readable message, already localized by the API when possible.
     * @param {?number} [params.status=null] - HTTP status code, or null when there was no response.
     * @param {?string} [params.title=null] - ProblemDetails title.
     * @param {?string} [params.detail=null] - ProblemDetails detail.
     * @param {Object<string, string[]>} [params.errors={}] - Validation errors by field.
     */
    constructor({message, status = null, title = null, detail = null, errors = {}}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.title = title;
        this.detail = detail;
        this.errors = errors;
    }

    /**
     * Builds an error from a ProblemDetails body. The API also adds a "message"
     * extension (detail ?? title); validation errors are appended to it.
     * @param {number} status - HTTP status code.
     * @param {Object|string|null} body - Response body.
     * @param {string} [statusText=''] - HTTP status text, used when the body has no message.
     * @returns {ApiError} The error.
     */
    static fromProblemDetails(status, body, statusText = '') {
        const problem = body && typeof body === 'object' ? body : {};
        const errors = problem.errors && typeof problem.errors === 'object' ? problem.errors : {};
        const fieldMessages = Object.values(errors).flat().filter(Boolean);
        const summary = problem.message || problem.detail || problem.title
            || `Error ${status}${statusText ? `: ${statusText}` : ''}`;
        const message = fieldMessages.length > 0 ? `${summary} ${fieldMessages.join(' ')}` : summary;
        return new ApiError({
            message, status,
            title: problem.title ?? null,
            detail: problem.detail ?? null,
            errors
        });
    }
}
