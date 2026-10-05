import {SESSION_IDLE_TIMEOUT_MS, SESSION_STORAGE_KEY} from './session-storage.js';

/** Track user interaction; focus, visibility and timers only check expiration. */
export function startSessionActivity(store, onExpired, browser = window, page = document) {
    let timer;
    const interactionEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'wheel', 'touchstart'];
    const options = {capture: true, passive: true};

    function check(recordActivity = false) {
        browser.clearTimeout(timer);
        if (!store.isSignedIn) return;
        // Check BEFORE renewing: a delayed timer must never resurrect an expired session.
        if (!store.validateSession()) {
            onExpired();
            return;
        }
        if (recordActivity) store.recordActivity();
        timer = browser.setTimeout(() => check(),
            Math.max(0, store.lastActivityAt + SESSION_IDLE_TIMEOUT_MS - Date.now()));
    }

    const activity = (event) => {
        if (event.isTrusted && page.visibilityState === 'visible') check(true);
    };
    const wake = () => check();
    const storageChanged = (event) => {
        if (event.key === SESSION_STORAGE_KEY || event.key === null) check();
    };
    interactionEvents.forEach(event => browser.addEventListener(event, activity, options));
    browser.addEventListener('focus', wake);
    browser.addEventListener('pageshow', wake);
    browser.addEventListener('storage', storageChanged);
    page.addEventListener('visibilitychange', wake);
    check();

    return {
        check: wake,
        stop() {
            browser.clearTimeout(timer);
            interactionEvents.forEach(event => browser.removeEventListener(event, activity, options));
            browser.removeEventListener('focus', wake);
            browser.removeEventListener('pageshow', wake);
            browser.removeEventListener('storage', storageChanged);
            page.removeEventListener('visibilitychange', wake);
        }
    };
}
