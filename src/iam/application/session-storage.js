export const SESSION_STORAGE_KEY = 'vitalita-session';
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** Restore only sessions with a valid, unexpired activity timestamp. */
export function readSession(storage = localStorage, now = Date.now()) {
    try {
        const session = JSON.parse(storage.getItem(SESSION_STORAGE_KEY));
        if (!session) return null;
        if (!session.user || !session.token || !Number.isFinite(session.lastActivityAt)
            || session.lastActivityAt > now
            || now - session.lastActivityAt >= SESSION_IDLE_TIMEOUT_MS) {
            storage.removeItem(SESSION_STORAGE_KEY);
            return null;
        }
        return session;
    } catch {
        storage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
}

export function saveSession(user, token, storage = localStorage, now = Date.now()) {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({user, token, lastActivityAt: now}));
    return now;
}
