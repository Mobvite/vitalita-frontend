import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the IAM bounded context.
 *
 * Important: json-server cannot authenticate users. While we work with the
 * fake API, sign-in looks for a user with the same email and password and
 * builds a fake token. The response keeps the same shape that the Vitalita API
 * will return (TS01), so when the backend is ready only this class changes.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #usersEndpoint;

    /** Creates the endpoint client for users. */
    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    }

    /**
     * Authenticates a user.
     * Temporary version for json-server. With the real API this will be:
     * return this.http.post('/authentication/sign-in', signInCommand);
     * @param {import('../domain/model/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
     * @returns {Promise<{status: number, statusText: string, data: Object|null}>} Response with id, email, role, status and token.
     */
    async signIn(signInCommand) {
        const response = await this.#usersEndpoint.getAll({
            email: signInCommand.email,
            password: signInCommand.password
        });
        const user = response.data[0];
        const data = user ? {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            token: `fake-token-${crypto.randomUUID()}`
        } : null;
        return {status: response.status, statusText: response.statusText, data};
    }

    /**
     * Finds users with a given email. Used to avoid duplicated accounts.
     * @param {string} email - Email to look for.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with the matching users.
     */
    findUsersByEmail(email) {
        return this.#usersEndpoint.getAll({email});
    }

    /**
     * Creates a user account.
     * @param {Object} userResource - User resource.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with the created user.
     */
    createUser(userResource) {
        return this.#usersEndpoint.create(userResource);
    }
}
