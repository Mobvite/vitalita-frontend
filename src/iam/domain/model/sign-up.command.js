/**
 * Command used to register a new caregiver account.
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
     */
    constructor({firstName, lastName, email, password}) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
    }
}
