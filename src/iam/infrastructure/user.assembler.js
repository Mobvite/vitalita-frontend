import {User} from "../../../../demo/vitalita-frontend/src/iam/domain/model/user.entity.js";

/**
 * Maps IAM resources into domain entities and commands into resources.
 *
 * @class UserAssembler
 */
export class UserAssembler {
    /**
     * @param {Object} resource - User resource payload.
     * @returns {User} User entity. The password is never copied.
     */
    static toEntityFromResource(resource) {
        const {id, email, role, status} = resource;
        return new User({id, email, role, status});
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with user resources.
     * @returns {User[]} User entities.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['users'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * Builds the resource sent to create an account.
     * @param {import('../domain/model/sign-up.command.js').SignUpCommand} command - Sign-up command.
     * @returns {Object} User resource.
     */
    static toResourceFromSignUpCommand(command) {
        return {
            email: command.email,
            password: command.password,
            role: command.role,
            status: 'Active',
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };
    }
}
