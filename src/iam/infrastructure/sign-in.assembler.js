import {SignInResource} from "./sign-in.resource.js";

/**
 * Maps authentication responses into IAM resources.
 *
 * @class SignInAssembler
 */
export class SignInAssembler {
    /**
     * @param {import('axios').AxiosResponse<Object>} response - HTTP response from the sign-in call.
     * @returns {SignInResource|null} The resource, or null when the credentials are wrong.
     */
    static toResourceFromResponse(response) {
        if (response.status !== 200 || !response.data) {
            console.error(`${response.status}, ${response.statusText}`);
            return null;
        }
        return new SignInResource(response.data);
    }
}
