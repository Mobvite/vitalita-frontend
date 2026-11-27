import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {SignInAssembler} from "./sign-in.assembler.js";

const signUpPath = '/authentication/sign-up';
const signInPath = '/authentication/sign-in';
const currentUserPath = '/authentication/me';

/**
 * Infrastructure gateway for the IAM bounded context.
 * Sign-up, sign-in and the current user use the authentication endpoints of the Vitalita API.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    /**
     * Creates an account with POST /authentication/sign-up.
     * @param {{email: string, password: string, role: string}} signUpResource - SignUpResource of the API.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the created UserResource (201).
     */
    signUp(signUpResource) {
        return this.http.post(signUpPath, signUpResource, {skipAuthRefresh: true});
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
}
