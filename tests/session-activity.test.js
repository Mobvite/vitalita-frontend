import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readSession, saveSession, SESSION_IDLE_TIMEOUT_MS, SESSION_STORAGE_KEY} from '../src/iam/application/session-storage.js';
import {startSessionActivity} from '../src/iam/application/session-activity.js';

const user = {id: 1, email: 'demo@example.com', role: 'Caregiver'};
const initialTime = 1_000_000_000;

function memoryStorage() {
    const values = new Map();
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
}

function surface() {
    const listeners = new Map();
    return {
        visibilityState: 'visible',
        setTimeout: (...args) => setTimeout(...args),
        clearTimeout: id => clearTimeout(id),
        addEventListener(name, callback) {
            if (!listeners.has(name)) listeners.set(name, new Set());
            listeners.get(name).add(callback);
        },
        removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
        emit(name, event = {}) {
            listeners.get(name)?.forEach(callback => callback(event));
        }
    };
}

function setup(t) {
    t.mock.timers.enable({apis: ['Date', 'setTimeout'], now: initialTime});
    const storage = memoryStorage();
    saveSession(user, 'token', storage);
    const store = {
        isSignedIn: true,
        lastActivityAt: initialTime,
        validateSession() {
            const saved = readSession(storage);
            this.isSignedIn = saved?.token === 'token';
            this.lastActivityAt = saved?.lastActivityAt ?? null;
            return this.isSignedIn;
        },
        recordActivity() {
            this.lastActivityAt = saveSession(user, 'token', storage);
        }
    };
    const browser = surface();
    const page = surface();
    let redirects = 0;
    const tracker = startSessionActivity(store, () => redirects++, browser, page);
    t.after(() => tracker.stop());
    return {storage, store, browser, page, tracker, redirects: () => redirects};
}

test('reload restores a recent session but rejects one at exactly 30 minutes', () => {
    const storage = memoryStorage();
    saveSession(user, 'token', storage, initialTime);
    assert.equal(readSession(storage, initialTime + SESSION_IDLE_TIMEOUT_MS - 1).token, 'token');
    assert.equal(readSession(storage, initialTime + SESSION_IDLE_TIMEOUT_MS), null);
    assert.equal(storage.getItem(SESSION_STORAGE_KEY), null);
});

test('returning days later removes the expired session', () => {
    const storage = memoryStorage();
    saveSession(user, 'token', storage, initialTime);
    assert.equal(readSession(storage, initialTime + 3 * 24 * 60 * 60 * 1000), null);
});

test('legacy, malformed and future-dated sessions cannot stay signed in', () => {
    for (const value of ['{', JSON.stringify({user, token: 'token'}),
        JSON.stringify({user, token: 'token', lastActivityAt: initialTime + 1})]) {
        const storage = memoryStorage();
        storage.setItem(SESSION_STORAGE_KEY, value);
        assert.equal(readSession(storage, initialTime), null);
        assert.equal(storage.getItem(SESSION_STORAGE_KEY), null);
    }
});

test('an open idle tab signs out and redirects at 30 minutes', t => {
    const app = setup(t);
    t.mock.timers.tick(SESSION_IDLE_TIMEOUT_MS - 1);
    assert.equal(app.store.isSignedIn, true);
    t.mock.timers.tick(1);
    assert.equal(app.store.isSignedIn, false);
    assert.equal(app.redirects(), 1);
    assert.equal(app.storage.getItem(SESSION_STORAGE_KEY), null);
});

test('user keyboard interaction renews the deadline', t => {
    const app = setup(t);
    t.mock.timers.tick(20 * 60 * 1000);
    app.browser.emit('keydown', {isTrusted: true});
    t.mock.timers.tick(20 * 60 * 1000);
    assert.equal(app.store.isSignedIn, true);
    t.mock.timers.tick(10 * 60 * 1000);
    assert.equal(app.store.isSignedIn, false);
});

test('focus and visibility checks do not renew activity', t => {
    const app = setup(t);
    t.mock.timers.tick(20 * 60 * 1000);
    app.browser.emit('focus');
    app.page.emit('visibilitychange');
    t.mock.timers.tick(10 * 60 * 1000);
    assert.equal(app.redirects(), 1);
});

test('resuming after sleep signs out before accepting new interaction', t => {
    const app = setup(t);
    // Advance wall-clock time without executing the suspended tab's timer.
    t.mock.timers.setTime(initialTime + 2 * SESSION_IDLE_TIMEOUT_MS);
    app.browser.emit('pointerdown', {isTrusted: true});
    assert.equal(app.store.isSignedIn, false);
    assert.equal(app.redirects(), 1);
    assert.equal(app.storage.getItem(SESSION_STORAGE_KEY), null);
});

test('activity in another tab renews the shared deadline', t => {
    const app = setup(t);
    t.mock.timers.tick(20 * 60 * 1000);
    saveSession(user, 'token', app.storage);
    app.browser.emit('storage', {key: SESSION_STORAGE_KEY});
    t.mock.timers.tick(20 * 60 * 1000);
    assert.equal(app.store.isSignedIn, true);
    t.mock.timers.tick(10 * 60 * 1000);
    assert.equal(app.store.isSignedIn, false);
});

test('logout in another tab signs out this tab without recreating the session', t => {
    const app = setup(t);
    app.storage.removeItem(SESSION_STORAGE_KEY);
    app.browser.emit('storage', {key: SESSION_STORAGE_KEY});
    app.browser.emit('keydown', {isTrusted: true});
    assert.equal(app.store.isSignedIn, false);
    assert.equal(app.redirects(), 1);
    assert.equal(app.storage.getItem(SESSION_STORAGE_KEY), null);
});

test('synthetic events and hidden-page input cannot keep the session alive', t => {
    const app = setup(t);
    t.mock.timers.tick(20 * 60 * 1000);
    app.browser.emit('scroll', {isTrusted: false});
    app.page.visibilityState = 'hidden';
    app.browser.emit('pointermove', {isTrusted: true});
    t.mock.timers.tick(10 * 60 * 1000);
    assert.equal(app.store.isSignedIn, false);
});

test('a fresh login starts tracking and cleanup removes listeners and timers', t => {
    const app = setup(t);
    app.store.isSignedIn = false;
    app.tracker.check();
    t.mock.timers.tick(SESSION_IDLE_TIMEOUT_MS);
    saveSession(user, 'token', app.storage);
    app.store.isSignedIn = true;
    app.tracker.check();
    t.mock.timers.tick(SESSION_IDLE_TIMEOUT_MS - 1);
    assert.equal(app.store.isSignedIn, true);
    app.tracker.stop();
    app.browser.emit('keydown', {isTrusted: true});
    t.mock.timers.tick(1);
    assert.equal(app.redirects(), 0);
});
