/**
 * Resource returned after a successful authentication.
 * It has the same shape that the Vitalita API will return.
 *
 * @class SignInResource
 */
export class SignInResource {
    /**
     * @param {Object} params - Resource payload.
     * @param {number} params.id - Authenticated user identifier.
     * @param {string} params.email - Authenticated user email.
     * @param {string} params.role - Authenticated user role.
     * @param {string} params.status - Account status.
     * @param {string} params.token - Bearer token.
     */
    constructor({id, email, role, status, token}) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.status = status;
        this.token = token;
    }
}
