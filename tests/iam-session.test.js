import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createPinia, setActivePinia} from 'pinia';
import {SESSION_STORAGE_KEY, SESSION_IDLE_TIMEOUT_MS} from '../src/iam/application/session-storage.js';
import {fakeAccount, startFakeVitalitaApi, useMemoryLocalStorage} from './support/fake-vitalita-api.js';

test('IAM sign-in against the API persists activity, restores with /me and rejects expired or legacy sessions', async t => {
    useMemoryLocalStorage();
    t.after(() => delete globalThis.localStorage);
    const api = await startFakeVitalitaApi();
    t.after(() => api.close());
    process.env.VITE_VITALITA_API_URL = api.url;
    t.after(() => delete process.env.VITE_VITALITA_API_URL);
    const vite = await createServer({server: {middlewareMode: true}, appType: 'custom', logLevel: 'silent'});
    t.after(() => vite.close());
    const {default: useIamStore} = await vite.ssrLoadModule('/src/iam/application/iam.store.js');
    const freshStore = () => {
        setActivePinia(createPinia());
        return useIamStore();
    };
    const store = freshStore();
    const destinations = [];
    const router = {push: async destination => destinations.push(destination)};

    await store.signIn({email: fakeAccount.email, password: 'wrong-password', role: 'Caregiver'}, router);
    assert.deepEqual(store.errors, ['iam.errors.invalid-credentials']);
    assert.equal(api.requests.filter(r => r.path.endsWith('/refresh')).length, 0, 'a failed sign-in never refreshes');

    await store.signIn({email: fakeAccount.email, password: fakeAccount.password, role: 'FamilyMember'}, router);
    assert.deepEqual(store.errors, ['iam.errors.role-mismatch']);
    assert.equal(store.isSignedIn, false);

    await store.signIn({email: fakeAccount.email, password: fakeAccount.password, role: 'Caregiver'}, router);
    const signInRequest = api.requests.at(-1);
    assert.deepEqual(signInRequest.body, {email: fakeAccount.email, password: fakeAccount.password}, 'the role is not sent');
    assert.equal(store.isSignedIn, true);
    assert.equal(store.isCaregiver, true);
    assert.deepEqual(destinations, ['/home']);
    const saved = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
    assert.ok(Number.isFinite(saved.lastActivityAt));

    const reloaded = freshStore();
    assert.equal(reloaded.isSignedIn, true, 'recent session survives a reload');
    assert.equal(await reloaded.restoreSession(), true);
    const meRequest = api.requests.at(-1);
    assert.equal(meRequest.path, '/api/v1/authentication/me');
    assert.equal(meRequest.headers.authorization, `Bearer ${saved.token}`);

    api.validTokens.clear();
    api.refreshShouldFail = true;
    const revoked = freshStore();
    assert.equal(await revoked.restoreSession(), false);
    assert.equal(revoked.isSignedIn, false, 'a token rejected by the API closes the session');
    assert.equal(localStorage.getItem(SESSION_STORAGE_KEY), null);

    saved.lastActivityAt = Date.now() - SESSION_IDLE_TIMEOUT_MS;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(saved));
    assert.equal(freshStore().isSignedIn, false, 'expired session is not restored');
    delete saved.lastActivityAt;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(saved));
    assert.equal(freshStore().isSignedIn, false, 'old sessions require a new login');
});
