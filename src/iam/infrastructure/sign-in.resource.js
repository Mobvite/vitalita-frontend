/**
 * Resource returned after a successful authentication or token refresh.
 * It matches the AuthenticatedUserResource of the Vitalita API.
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
     * @param {string} params.token - JWT access token (it lasts 15 minutes).
     */
    constructor({id, email, role, status, token}) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.status = status;
        this.token = token;
    }
}
