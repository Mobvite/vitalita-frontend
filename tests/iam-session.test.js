import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {once} from 'node:events';
import {createServer} from 'vite';
import {createPinia, setActivePinia} from 'pinia';
import {SESSION_STORAGE_KEY, SESSION_IDLE_TIMEOUT_MS} from '../src/iam/application/session-storage.js';

test('IAM login with JSON Server persists activity and rejects expired or legacy sessions', async t => {
    const values = new Map();
    globalThis.localStorage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
    t.after(() => delete globalThis.localStorage);
    const jsonServer = createRequire(import.meta.url)('json-server');
    const api = jsonServer.create();
    api.use(jsonServer.defaults({logger: false}));
    api.use(jsonServer.rewriter({'/api/v1/*': '/$1'}));
    // Use the real seed data in memory, so the repository database is never modified.
    const db = createRequire(import.meta.url)('../server/db.json');
    api.use(jsonServer.router(db));
    const listener = api.listen(0, '127.0.0.1');
    t.after(() => new Promise(resolve => listener.close(resolve)));
    await once(listener, 'listening');
    process.env.VITE_VITALITA_API_URL = `http://127.0.0.1:${listener.address().port}/api/v1`;
    t.after(() => delete process.env.VITE_VITALITA_API_URL);
    const vite = await createServer({server: {middlewareMode: true}, appType: 'custom'});
    t.after(() => vite.close());
    const {default: useIamStore} = await vite.ssrLoadModule('/src/iam/application/iam.store.js');
    const freshStore = () => {
        setActivePinia(createPinia());
        return useIamStore();
    };
    const store = freshStore();
    const destinations = [];
    await store.signIn({email: 'andrea.mendoza@vitalita.pe', password: 'Vitalita123', role: 'Caregiver'},
        {push: async destination => destinations.push(destination)});
    assert.equal(store.isSignedIn, true);
    assert.deepEqual(destinations, ['/home']);
    const saved = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
    assert.ok(Number.isFinite(saved.lastActivityAt));
    assert.equal(freshStore().isSignedIn, true, 'recent session survives a reload');

    saved.lastActivityAt = Date.now() - SESSION_IDLE_TIMEOUT_MS;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(saved));
    assert.equal(store.validateSession(), false);
    assert.equal(store.currentUser, null);
    assert.equal(store.token, null);
    assert.equal(localStorage.getItem(SESSION_STORAGE_KEY), null);

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(saved));
    assert.equal(freshStore().isSignedIn, false, 'expired session is not restored');
    delete saved.lastActivityAt;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(saved));
    assert.equal(freshStore().isSignedIn, false, 'old sessions require a new login');
});
