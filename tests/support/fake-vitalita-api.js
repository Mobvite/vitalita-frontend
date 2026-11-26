import {createServer} from 'node:http';
import {once} from 'node:events';

/** Fictitious account used only by the tests. */
export const fakeAccount = {id: 7, email: 'caregiver@example.test', password: 'not-a-real-password', role: 'Caregiver', status: 'Active'};

/**
 * Builds an unsigned JWT-like token with the given expiration. The client only reads "exp".
 * @param {number} expiresAt - Expiration in milliseconds.
 * @param {string} [id] - Value that makes the token unique.
 * @returns {string} Token.
 */
export function fakeToken(expiresAt, id = Math.random().toString(36).slice(2)) {
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${encode({alg: 'none'})}.${encode({sub: String(fakeAccount.id), exp: Math.floor(expiresAt / 1000), jti: id})}.signature`;
}

/**
 * Starts an HTTP server that follows the authentication contract of the Vitalita API:
 * sign-in, me and refresh, with RFC 7807 ProblemDetails errors. Every request is recorded.
 * @param {Object} [options] - Behaviour of the fake API.
 * @param {(request: Object) => Object|undefined} [options.handle] - Optional handler for other paths.
 * @returns {Promise<{url: string, requests: Object[], validTokens: Set<string>, refreshShouldFail: boolean, close: () => Promise<void>}>} Running API.
 */
export async function startFakeVitalitaApi({handle} = {}) {
    const api = {requests: [], validTokens: new Set(), refreshShouldFail: false};
    const server = createServer(async (req, res) => {
        let body = '';
        for await (const chunk of req) body += chunk;
        const request = {method: req.method, path: req.url, headers: req.headers, body: body ? JSON.parse(body) : null};
        api.requests.push(request);
        const token = req.headers.authorization?.replace(/^Bearer /, '');
        const authorized = token && api.validTokens.has(token);
        const send = (status, payload, type = 'application/json') => {
            res.writeHead(status, {'Content-Type': type});
            res.end(JSON.stringify(payload));
        };
        const problem = (status, title, extra = {}) =>
            send(status, {type: 'https://tools.ietf.org/html/rfc9110', title, status, message: title, ...extra},
                'application/problem+json');
        const user = {id: fakeAccount.id, email: fakeAccount.email, role: fakeAccount.role, status: fakeAccount.status};
        const issueToken = () => {
            const issued = fakeToken(Date.now() + 15 * 60 * 1000);
            api.validTokens.add(issued);
            return issued;
        };

        if (req.method === 'POST' && req.url === '/api/v1/authentication/sign-in') {
            if (request.body?.email === fakeAccount.email && request.body?.password === fakeAccount.password) {
                return send(200, {...user, token: issueToken()});
            }
            return problem(401, req.headers['accept-language'] === 'es' ? 'Credenciales inválidas.' : 'Invalid credentials.');
        }
        if (req.method === 'GET' && req.url === '/api/v1/authentication/me') {
            return authorized ? send(200, {...user, createdAt: null, lastLoginAt: null}) : problem(401, 'Unauthorized');
        }
        if (req.method === 'POST' && req.url === '/api/v1/authentication/refresh') {
            // Give concurrent 401s time to arrive while the refresh is running.
            await new Promise(resolve => setTimeout(resolve, 20));
            if (!authorized || api.refreshShouldFail) return problem(401, 'Unauthorized');
            api.validTokens.delete(token);
            return send(200, {...user, token: issueToken()});
        }
        const custom = handle?.({...request, authorized});
        if (custom) return send(custom.status, custom.body, custom.type);
        return problem(404, 'Not found');
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    api.url = `http://127.0.0.1:${server.address().port}/api/v1`;
    api.close = () => new Promise(resolve => server.close(resolve));
    return api;
}

/**
 * Replaces localStorage with an in-memory store.
 * @returns {Map<string, string>} Stored values.
 */
export function useMemoryLocalStorage() {
    const values = new Map();
    globalThis.localStorage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
    return values;
}
