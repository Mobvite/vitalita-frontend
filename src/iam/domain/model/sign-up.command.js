import {UserRole} from "../../../../../demo/vitalita-frontend/src/iam/domain/model/user-role.js";

/**
 * Command used to register a new account.
 *
 * @class SignUpCommand
 */
export class SignUpCommand {
    /**
     * @param {Object} params - Command attributes.
     * @param {string} params.firstName - Caregiver first name.
     * @param {string} params.lastName - Caregiver last name.
     * @param {string} params.email - Account email.
     * @param {string} params.password - Account password.
     * @param {string} [params.role] - Caregiver by default. Family members sign up with an invitation.
     */
    constructor({firstName, lastName, email, password, role = UserRole.CAREGIVER}) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.role = role;
    }
}
