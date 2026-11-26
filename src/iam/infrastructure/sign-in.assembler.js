import {SignInResource} from "./sign-in.resource.js";

/**
 * Maps sign-in commands into API resources and authentication responses
 * (AuthenticatedUserResource) into IAM resources.
 *
 * @class SignInAssembler
 */
export class SignInAssembler {
    /**
     * Builds the SignInResource of the API. The role chosen in the form is not sent:
     * the API ignores it and the store compares it with the authenticated role.
     * @param {import('../domain/model/sign-in.command.js').SignInCommand} command - Sign-in command.
     * @returns {{email: string, password: string}} Request body.
     */
    static toResourceFromCommand(command) {
        return {email: command.email, password: command.password};
    }

    /**
     * @param {import('axios').AxiosResponse<Object>} response - HTTP response from the sign-in call.
     * @returns {SignInResource|null} The resource, or null when the response has no token.
     */
    static toResourceFromResponse(response) {
        if (response.status !== 200 || !response.data?.token) {
            console.error(`${response.status}, ${response.statusText}`);
            return null;
        }
        return new SignInResource(response.data);
    }
}
