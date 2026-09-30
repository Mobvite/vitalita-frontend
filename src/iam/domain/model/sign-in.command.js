/**
 * Command used to request authentication.
 *
 * @class SignInCommand
 */
export class SignInCommand {
    /**
     * @param {Object} params - Command attributes.
     * @param {string} params.email - Account email.
     * @param {string} params.password - Account password.
     * @param {string} params.role - Role selected in the sign-in form.
     */
    constructor({email, password, role}) {
        this.email = email;
        this.password = password;
        this.role = role;
    }
}
