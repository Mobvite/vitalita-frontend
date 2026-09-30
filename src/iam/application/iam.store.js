import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {SignInAssembler} from "../infrastructure/sign-in.assembler.js";
import {UserAssembler} from "../infrastructure/user.assembler.js";
import {User} from "../domain/model/user.entity.js";
import {Email} from "../../shared/domain/model/email.js";

const iamApi = new IamApi();
const SESSION_STORAGE_KEY = 'vitalita-session';

/**
 * Reads the saved session, so a page refresh does not sign the user out.
 * @returns {{user: User, token: string}|null} Saved session or null.
 */
function readSavedSession() {
    try {
        const saved = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
        return saved ? {user: new User(saved.user), token: saved.token} : null;
    } catch {
        return null;
    }
}

/**
 * Application service store for the IAM bounded context.
 * Errors are saved as i18n keys, so the views can show them in any language.
 */
const useIamStore = defineStore('iam', () => {
    const savedSession = readSavedSession();

    /** @type {import('vue').Ref<User|null>} Signed-in user. */
    const currentUser = ref(savedSession?.user ?? null);
    /** @type {import('vue').Ref<string|null>} Bearer token. */
    const token = ref(savedSession?.token ?? null);
    /** @type {import('vue').Ref<string[]>} i18n keys of the last errors. */
    const errors = ref([]);
    /** @type {import('vue').Ref<boolean>} True while a request is running. */
    const isLoading = ref(false);

    const isSignedIn = computed(() => currentUser.value !== null && token.value !== null);
    const currentUserId = computed(() => currentUser.value?.id ?? null);
    const currentRole = computed(() => currentUser.value?.role ?? null);
    const isCaregiver = computed(() => currentUser.value?.isCaregiver() ?? false);
    const isFamilyMember = computed(() => currentUser.value?.isFamilyMember() ?? false);

    /**
     * Signs in the user. The role chosen in the form must match the account role.
     * @param {import('../domain/model/sign-in.command.js').SignInCommand} signInCommand - Sign-in command.
     * @param {import('vue-router').Router} router - Router used to go to the next page.
     * @param {string} [redirect='/home'] - Page to open after signing in.
     * @returns {Promise<void>}
     */
    async function signIn(signInCommand, router, redirect = '/home') {
        errors.value = [];
        isLoading.value = true;
        try {
            const response = await iamApi.signIn(signInCommand);
            const resource = SignInAssembler.toResourceFromResponse(response);
            if (!resource) {
                errors.value.push('iam.errors.invalid-credentials');
                return;
            }
            if (resource.role !== signInCommand.role) {
                errors.value.push('iam.errors.role-mismatch');
                return;
            }
            currentUser.value = UserAssembler.toEntityFromResource(resource);
            token.value = resource.token;
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({user: currentUser.value, token: token.value}));
            await router.push(redirect);
        } catch (error) {
            console.error(error);
            errors.value.push('iam.errors.server');
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Registers a caregiver account. Duplicated emails are rejected (US05).
     * @param {import('../domain/model/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
     * @returns {Promise<boolean>} True when the account was created.
     */
    async function signUp(signUpCommand) {
        errors.value = [];
        isLoading.value = true;
        try {
            const email = new Email(signUpCommand.email).value;
            const existing = await iamApi.findUsersByEmail(email);
            if (existing.data.length > 0) {
                errors.value.push('iam.errors.email-in-use');
                return false;
            }
            await iamApi.createUser(UserAssembler.toResourceFromSignUpCommand({...signUpCommand, email}));
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('iam.errors.server');
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Closes the session and removes the saved data.
     * @param {import('vue-router').Router} router - Router used to go to the sign-in page.
     * @returns {Promise<void>}
     */
    async function signOut(router) {
        currentUser.value = null;
        token.value = null;
        errors.value = [];
        localStorage.removeItem(SESSION_STORAGE_KEY);
        await router.push({name: 'iam-sign-in'});
    }

    return {
        currentUser, token, errors, isLoading,
        isSignedIn, currentUserId, currentRole, isCaregiver, isFamilyMember,
        signIn, signUp, signOut
    };
});

export default useIamStore;
