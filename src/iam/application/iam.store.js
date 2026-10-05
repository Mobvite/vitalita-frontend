import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {SignInAssembler} from "../infrastructure/sign-in.assembler.js";
import {UserAssembler} from "../infrastructure/user.assembler.js";
import {User} from "../domain/model/user.entity.js";
import {Email} from "../../shared/domain/model/email.js";
import {readSession, saveSession, SESSION_STORAGE_KEY} from './session-storage.js';

const iamApi = new IamApi();

/**
 * Reads the saved session, so a page refresh does not sign the user out.
 * @returns {{user: User, token: string}|null} Saved session or null.
 */
function readSavedSession() {
    try {
        const saved = readSession();
        return saved ? {...saved, user: new User(saved.user)} : null;
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
    const lastActivityAt = ref(savedSession?.lastActivityAt ?? null);
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
            lastActivityAt.value = saveSession(currentUser.value, token.value);
            await router.push(redirect);
        } catch (error) {
            console.error(error);
            errors.value.push('iam.errors.server');
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Registers an account. Duplicated emails are rejected (US05, US31).
     * @param {import('../domain/model/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
     * @returns {Promise<number|null>} Identifier of the new user, or null when it failed.
     */
    async function signUp(signUpCommand) {
        errors.value = [];
        isLoading.value = true;
        try {
            const email = new Email(signUpCommand.email).value;
            const existing = await iamApi.findUsersByEmail(email);
            if (existing.data.length > 0) {
                errors.value.push('iam.errors.email-in-use');
                return null;
            }
            const response = await iamApi.createUser(UserAssembler.toResourceFromSignUpCommand({...signUpCommand, email}));
            return response.data.id;
        } catch (error) {
            console.error(error);
            errors.value.push('iam.errors.server');
            return null;
        } finally {
            isLoading.value = false;
        }
    }

    /** Clear the in-memory identity without deleting another tab's new session. */
    function clearCurrentSession() {
        currentUser.value = null;
        token.value = null;
        lastActivityAt.value = null;
        errors.value = [];
    }

    /** Check shared storage so reloads, sleeping tabs and other tabs respect expiration. */
    function validateSession() {
        if (!isSignedIn.value) return false;
        const saved = readSession();
        if (!saved || saved.token !== token.value) {
            clearCurrentSession();
            return false;
        }
        lastActivityAt.value = saved.lastActivityAt;
        return true;
    }

    /** Only actual user interaction renews the inactivity deadline. */
    function recordActivity() {
        if (validateSession()) {
            lastActivityAt.value = saveSession(currentUser.value, token.value);
        }
    }

    /** Close the session and navigate to sign-in. */
    async function signOut(router) {
        clearCurrentSession();
        localStorage.removeItem(SESSION_STORAGE_KEY);
        await router.push({name: 'iam-sign-in'});
    }

    return {
        currentUser, token, lastActivityAt, errors, isLoading,
        isSignedIn, currentUserId, currentRole, isCaregiver, isFamilyMember,
        signIn, signUp, signOut, validateSession, recordActivity
    };
});

export default useIamStore;
