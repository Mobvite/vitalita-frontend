import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {SignInAssembler} from "../infrastructure/sign-in.assembler.js";
import {UserAssembler} from "../infrastructure/user.assembler.js";
import {User} from "../domain/model/user.entity.js";
import {SignInCommand} from "../domain/model/sign-in.command.js";
import {readSession, saveSession, SESSION_STORAGE_KEY} from './session-storage.js';

const iamApi = new IamApi();

/**
 * Chooses the i18n key for a failed sign-up.
 * @param {{status?: number}} error - Error of the API client.
 * @returns {string} i18n key.
 */
function signUpErrorKey(error) {
    if (error.status === 409) return 'iam.errors.email-in-use';
    if (error.status === 400) return 'iam.errors.invalid-data';
    return 'iam.errors.server';
}

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
    /** True when the API already confirmed the current session. */
    let sessionVerified = false;

    const isSignedIn = computed(() => currentUser.value !== null && token.value !== null);
    const currentUserId = computed(() => currentUser.value?.id ?? null);
    const currentRole = computed(() => currentUser.value?.role ?? null);
    const isCaregiver = computed(() => currentUser.value?.isCaregiver() ?? false);
    const isFamilyMember = computed(() => currentUser.value?.isFamilyMember() ?? false);

    /**
     * Saves the authenticated user and token as the current session.
     * @param {import('../infrastructure/sign-in.resource.js').SignInResource} resource - Sign-in response.
     */
    function startSession(resource) {
        currentUser.value = UserAssembler.toEntityFromResource(resource);
        token.value = resource.token;
        lastActivityAt.value = saveSession(currentUser.value, token.value);
        sessionVerified = true;
    }

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
                errors.value.push('iam.errors.server');
                return;
            }
            if (resource.role !== signInCommand.role) {
                errors.value.push('iam.errors.role-mismatch');
                return;
            }
            startSession(resource);
            await router.push(redirect);
        } catch (error) {
            console.error(error);
            // 401: wrong credentials or inactive account. 400: the API rejected the email or password format.
            errors.value.push([400, 401].includes(error.status) ? 'iam.errors.invalid-credentials' : 'iam.errors.server');
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Checks a session restored from storage with GET /authentication/me and keeps
     * the user data sent by the API. A rejected token closes the session (the
     * interceptor tries a refresh first); network errors keep the saved session.
     * @returns {Promise<boolean>} True when the API confirmed the session.
     */
    async function restoreSession() {
        if (!isSignedIn.value) return false;
        if (sessionVerified) return true;
        try {
            const response = await iamApi.getCurrentUser();
            if (!isSignedIn.value) return false;
            currentUser.value = UserAssembler.toEntityFromResource(response.data);
            saveSession(currentUser.value, token.value, localStorage, lastActivityAt.value);
            sessionVerified = true;
            return true;
        } catch (error) {
            console.error(error);
            if (error.status === 401) expireSession();
            return false;
        }
    }

    /**
     * Creates an account with POST /authentication/sign-up and signs in with it,
     * so the profile can be created with the new token (US05, US31).
     * With resumeExisting, an email that is already registered is signed in with the
     * same password instead of failing: it lets a person finish a registration that
     * stopped after the account was created, without a second account.
     * @param {import('../domain/model/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
     * @param {{resumeExisting?: boolean}} [options] - Registration options.
     * @returns {Promise<User|null>} The signed-in user, or null when it failed.
     */
    async function signUpAndSignIn(signUpCommand, {resumeExisting = false} = {}) {
        errors.value = [];
        isLoading.value = true;
        const resource = UserAssembler.toResourceFromSignUpCommand(signUpCommand);
        let accountExisted = false;
        try {
            await iamApi.signUp(resource);
        } catch (error) {
            console.error(error);
            accountExisted = error.status === 409;
            if (!accountExisted || !resumeExisting) {
                errors.value.push(signUpErrorKey(error));
                isLoading.value = false;
                return null;
            }
        }
        try {
            const response = await iamApi.signIn(new SignInCommand(resource));
            const authenticated = SignInAssembler.toResourceFromResponse(response);
            if (!authenticated) throw new Error('The sign-in did not return a token.');
            if (authenticated.role !== resource.role) {
                errors.value.push(accountExisted ? 'iam.errors.email-in-use' : 'iam.errors.role-mismatch');
                return null;
            }
            startSession(authenticated);
            return currentUser.value;
        } catch (error) {
            console.error(error);
            // The account exists but the password is not the one used in the first attempt.
            errors.value.push(accountExisted && error.status === 401 ? 'iam.errors.email-in-use' : 'iam.errors.server');
            return null;
        } finally {
            isLoading.value = false;
        }
    }

    /** Clear the in-memory identity without deleting another tab's new session. */
    function clearCurrentSession() {
        sessionVerified = false;
        currentUser.value = null;
        token.value = null;
        lastActivityAt.value = null;
        errors.value = [];
    }

    /** Check shared storage so reloads, sleeping tabs and other tabs respect expiration. */
    function validateSession() {
        if (!isSignedIn.value) return false;
        const saved = readSession();
        if (!saved || saved.user?.id !== currentUser.value.id) {
            clearCurrentSession();
            return false;
        }
        // Another tab may have refreshed the token of the same session.
        token.value = saved.token;
        lastActivityAt.value = saved.lastActivityAt;
        return true;
    }

    /**
     * Keeps the session with the new token returned by POST /authentication/refresh.
     * Refreshing is not user activity, so the inactivity deadline does not change.
     * @param {import('../infrastructure/sign-in.resource.js').SignInResource} resource - Refresh response.
     */
    function applyRefreshedToken(resource) {
        if (!isSignedIn.value) return;
        currentUser.value = UserAssembler.toEntityFromResource(resource);
        token.value = resource.token;
        saveSession(currentUser.value, token.value, localStorage, lastActivityAt.value);
    }

    /** Close the session when the API no longer accepts it. The app then opens the sign-in page. */
    function expireSession() {
        clearCurrentSession();
        localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    /** Only actual user interaction renews the inactivity deadline. */
    function recordActivity() {
        if (validateSession()) {
            lastActivityAt.value = saveSession(currentUser.value, token.value);
        }
    }

    /** Close the session and navigate to sign-in. */
    async function signOut(router) {
        expireSession();
        await router.push({name: 'iam-sign-in'});
    }

    return {
        currentUser, token, lastActivityAt, errors, isLoading,
        isSignedIn, currentUserId, currentRole, isCaregiver, isFamilyMember,
        signIn, restoreSession, signUpAndSignIn, signOut, validateSession, recordActivity, applyRefreshedToken, expireSession
    };
});

export default useIamStore;
