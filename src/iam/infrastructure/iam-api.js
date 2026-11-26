import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";
import {SignInAssembler} from "./sign-in.assembler.js";

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;
const signInPath = '/authentication/sign-in';
const currentUserPath = '/authentication/me';

/**
 * Infrastructure gateway for the IAM bounded context.
 * Sign-in and the current user use the authentication endpoints of the Vitalita API.
 * Sign-up still uses the users resource until it is migrated.
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
     * Authenticates a user with POST /authentication/sign-in.
     * A 401 here means wrong credentials, so it never triggers a token refresh.
     * @param {import('../domain/model/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the AuthenticatedUserResource (id, email, role, status and token).
     */
    signIn(signInCommand) {
        return this.http.post(signInPath, SignInAssembler.toResourceFromCommand(signInCommand), {skipAuthRefresh: true});
    }

    /**
     * Gets the user of the current bearer token with GET /authentication/me.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the UserResource.
     */
    getCurrentUser() {
        return this.http.get(currentUserPath);
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
