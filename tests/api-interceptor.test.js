import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createPinia, setActivePinia} from 'pinia';
import {SESSION_STORAGE_KEY, saveSession} from '../src/iam/application/session-storage.js';
import {fakeAccount, fakeToken, startFakeVitalitaApi, useMemoryLocalStorage} from './support/fake-vitalita-api.js';

const resourcePath = '/older-adults';
const protectedPath = `/api/v1${resourcePath}`;

test('API client sends the bearer token and locale, and refreshes the token on 401', async t => {
    useMemoryLocalStorage();
    t.after(() => delete globalThis.localStorage);
    const api = await startFakeVitalitaApi({
        handle: request => request.path === protectedPath
            ? (request.authorized
                ? {status: 200, body: []}
                : {status: 401, body: {title: 'Unauthorized', status: 401}, type: 'application/problem+json'})
            : request.path === '/api/v1/invalid'
                ? {status: 400, type: 'application/problem+json', body: {
                    title: 'La solicitud no es válida.', status: 400, message: 'La solicitud no es válida.',
                    errors: {Email: ['El correo no es válido.'], Password: ['La contraseña es obligatoria.']}}}
                : undefined
    });
    t.after(() => api.close());
    process.env.VITE_VITALITA_API_URL = api.url;
    t.after(() => delete process.env.VITE_VITALITA_API_URL);
    const vite = await createServer({server: {middlewareMode: true}, appType: 'custom', logLevel: 'silent'});
    t.after(() => vite.close());
    // The store is loaded first, because the API client and the store import each other.
    const {default: useIamStore} = await vite.ssrLoadModule('/src/iam/application/iam.store.js');
    const {BaseApi} = await vite.ssrLoadModule('/src/shared/infrastructure/base-api.js');
    const {ApiError} = await vite.ssrLoadModule('/src/shared/infrastructure/api-error.js');
    const {default: i18n} = await vite.ssrLoadModule('/src/i18n.js');

    const user = {id: fakeAccount.id, email: fakeAccount.email, role: fakeAccount.role, status: fakeAccount.status};
    const signInWith = token => {
        saveSession(user, token);
        setActivePinia(createPinia());
        return useIamStore();
    };
    const requestsTo = path => api.requests.filter(request => request.path === path);
    const refreshPath = '/api/v1/authentication/refresh';

    await t.test('anonymous requests have no bearer and use the active language', async () => {
        setActivePinia(createPinia());
        i18n.global.locale.value = 'es';
        await assert.rejects(new BaseApi().http.get(resourcePath), error => error instanceof ApiError && error.status === 401);
        const request = api.requests.at(-1);
        assert.equal(request.headers.authorization, undefined);
        assert.equal(request.headers['accept-language'], 'es');
        assert.equal(requestsTo(refreshPath).length, 0, 'a 401 without a session never refreshes');
    });

    await t.test('signed-in requests send Authorization: Bearer <token>', async () => {
        const token = fakeToken(Date.now() + 10 * 60 * 1000);
        api.validTokens.add(token);
        signInWith(token);
        i18n.global.locale.value = 'en';
        await new BaseApi().http.get(resourcePath);
        const request = api.requests.at(-1);
        assert.equal(request.headers.authorization, `Bearer ${token}`);
        assert.equal(request.headers['accept-language'], 'en');
    });

    await t.test('concurrent 401s share one refresh and every request is repeated with the new token', async () => {
        const rejected = fakeToken(Date.now() + 10 * 60 * 1000);
        api.validTokens.add(rejected);
        api.rejectedByResources.add(rejected);
        const store = signInWith(rejected);
        const lastActivityAt = store.lastActivityAt;
        const http = new BaseApi().http;
        const before = requestsTo(refreshPath).length;

        const responses = await Promise.all([http.get(resourcePath), http.get(resourcePath), http.get(resourcePath)]);
        assert.ok(responses.every(response => response.status === 200));
        assert.equal(requestsTo(refreshPath).length - before, 1, 'only one refresh request');
        assert.notEqual(store.token, rejected);
        const retried = api.requests.filter(request => request.path === protectedPath).slice(-3);
        assert.ok(retried.every(request => request.headers.authorization === `Bearer ${store.token}`));
        const saved = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
        assert.equal(saved.token, store.token, 'the new token is saved');
        assert.equal(saved.lastActivityAt, lastActivityAt, 'a refresh is not user activity');
    });

    await t.test('a failed refresh closes the session once and does not loop', async () => {
        const store = signInWith(fakeToken(Date.now() + 10 * 60 * 1000));
        api.refreshShouldFail = true;
        const before = requestsTo(refreshPath).length;
        const http = new BaseApi().http;
        const results = await Promise.allSettled([http.get(resourcePath), http.get(resourcePath)]);
        assert.ok(results.every(result => result.status === 'rejected' && result.reason.status === 401));
        assert.equal(requestsTo(refreshPath).length - before, 1);
        assert.equal(store.isSignedIn, false);
        assert.equal(localStorage.getItem(SESSION_STORAGE_KEY), null);
        api.refreshShouldFail = false;
    });

    await t.test('a token about to expire is refreshed before the request', async () => {
        const expiring = fakeToken(Date.now() + 30 * 1000);
        api.validTokens.add(expiring);
        const store = signInWith(expiring);
        const before = requestsTo(refreshPath).length;
        await new BaseApi().http.get(resourcePath);
        assert.equal(requestsTo(refreshPath).length - before, 1);
        assert.notEqual(store.token, expiring);
        assert.equal(api.requests.at(-1).headers.authorization, `Bearer ${store.token}`);
    });

    await t.test('ProblemDetails become readable, localized errors', async () => {
        signInWith(fakeToken(Date.now() + 10 * 60 * 1000));
        await assert.rejects(new BaseApi().http.get('/invalid'), error => {
            assert.ok(error instanceof ApiError);
            assert.equal(error.status, 400);
            assert.equal(error.title, 'La solicitud no es válida.');
            assert.deepEqual(error.errors.Email, ['El correo no es válido.']);
            assert.equal(error.message, 'La solicitud no es válida. El correo no es válido. La contraseña es obligatoria.');
            return true;
        });
    });
});
