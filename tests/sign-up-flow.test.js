import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createPinia, setActivePinia} from 'pinia';
import {startFakeVitalitaApi, useMemoryLocalStorage} from './support/fake-vitalita-api.js';

const invitationCode = 'VITA-ABCD2345';
const invitedEmail = 'relative@example.test';

/**
 * Profiles endpoints of the fake API, with the ownership rules of the Vitalita API.
 * @returns {{state: Object, handle: (request: Object) => Object|undefined}} Fake profiles context.
 */
function fakeProfilesContext() {
    const state = {
        caregiverProfiles: [], familyMemberProfiles: [], failNextCaregiverProfile: false,
        access: {id: 31, olderAdultId: 5, familyMemberId: null, invitedEmail, invitationCode,
            relationship: 'Daughter', status: 'Pending', expiresAt: new Date(Date.now() + 86_400_000).toISOString()}
    };
    const json = (status, body) => ({status, body});
    const problem = (status, title) => ({status, body: {title, status, message: title}, type: 'application/problem+json'});
    const create = (list, request) => {
        if (list.some(profile => profile.userId === request.userId)) return problem(409, 'Profile already exists.');
        if (request.body.userId !== request.userId) return problem(403, 'Forbidden.');
        const profile = {id: 200 + list.length, ...request.body};
        list.push(profile);
        return json(201, profile);
    };
    const handle = request => {
        const url = new URL(request.path, 'http://fake');
        const userId = Number(url.searchParams.get('userId'));
        if (url.pathname === '/api/v1/family-access' && request.method === 'GET' && url.searchParams.has('invitationCode')) {
            const {id, invitedEmail: email, invitationCode: code, relationship, status, expiresAt} = state.access;
            const valid = url.searchParams.get('invitationCode').toUpperCase() === code && status === 'Pending';
            return json(200, valid ? [{id, invitedEmail: email, invitationCode: code, relationship, status, expiresAt}] : []);
        }
        if (!request.authorized) return problem(401, 'Unauthorized');
        if (url.pathname === '/api/v1/caregiver-profiles') {
            if (request.method === 'GET') return json(200, state.caregiverProfiles.filter(p => p.userId === userId));
            if (state.failNextCaregiverProfile) {
                state.failNextCaregiverProfile = false;
                return problem(500, 'Unexpected error.');
            }
            return create(state.caregiverProfiles, request);
        }
        if (url.pathname === '/api/v1/family-member-profiles') {
            if (request.method === 'GET') return json(200, state.familyMemberProfiles.filter(p => p.userId === userId));
            return create(state.familyMemberProfiles, request);
        }
        if (url.pathname === `/api/v1/family-access/${state.access.id}` && request.method === 'PUT') {
            if (state.access.status !== 'Pending') return problem(409, 'Invalid status transition.');
            state.access = {...state.access, status: request.body.status, familyMemberId: request.body.familyMemberId};
            return json(200, state.access);
        }
        return undefined;
    };
    return {state, handle};
}

test('caregiver and family member sign-up against the Vitalita API', async t => {
    useMemoryLocalStorage();
    t.after(() => delete globalThis.localStorage);
    const profiles = fakeProfilesContext();
    const api = await startFakeVitalitaApi({handle: profiles.handle});
    t.after(() => api.close());
    process.env.VITE_VITALITA_API_URL = api.url;
    t.after(() => delete process.env.VITE_VITALITA_API_URL);
    const vite = await createServer({server: {middlewareMode: true}, appType: 'custom', logLevel: 'silent'});
    t.after(() => vite.close());
    const originalError = console.error;
    console.error = () => {};
    t.after(() => { console.error = originalError; });
    // The IAM store is loaded first, because the API client and the store import each other.
    const {default: useIamStore} = await vite.ssrLoadModule('/src/iam/application/iam.store.js');
    const {default: useProfilesStore} = await vite.ssrLoadModule('/src/profiles/application/profiles.store.js');
    const {SignUpCommand} = await vite.ssrLoadModule('/src/iam/domain/model/sign-up.command.js');
    const stores = () => {
        setActivePinia(createPinia());
        return {iam: useIamStore(), profiles: useProfilesStore()};
    };
    const lastRequest = path => api.requests.filter(request => request.path.startsWith(path)).at(-1);

    await t.test('caregiver: sign-up, automatic sign-in and profile', async () => {
        const {iam, profiles: profilesStore} = stores();
        const command = new SignUpCommand({firstName: ' Ana ', lastName: 'Quispe', email: 'Carer@Example.test', password: 'fictitious-1'});
        const user = await iam.signUpAndSignIn(command);
        assert.equal(user.role, 'Caregiver');
        assert.deepEqual(lastRequest('/api/v1/authentication/sign-up').body,
            {email: 'carer@example.test', password: 'fictitious-1', role: 'Caregiver'});
        assert.equal(iam.isSignedIn, true);

        assert.equal(await profilesStore.createCaregiverProfile({userId: user.id, firstName: command.firstName, lastName: command.lastName}), true);
        const profileRequest = lastRequest('/api/v1/caregiver-profiles');
        assert.equal(profileRequest.headers.authorization, `Bearer ${iam.token}`);
        assert.equal(profileRequest.body.firstName, 'Ana');
        assert.equal(profilesStore.caregiverProfile.userId, user.id);
    });

    await t.test('caregiver: a duplicated email is rejected without signing in', async () => {
        const {iam} = stores();
        iam.expireSession();
        const user = await iam.signUpAndSignIn(new SignUpCommand({firstName: 'A', lastName: 'B', email: 'carer@example.test', password: 'fictitious-1'}));
        assert.equal(user, null);
        assert.deepEqual(iam.errors, ['iam.errors.email-in-use']);
        assert.equal(iam.isSignedIn, false);
    });

    await t.test('caregiver: when the profile fails, the account stays and the profile can be completed later', async () => {
        const {iam, profiles: profilesStore} = stores();
        const user = await iam.signUpAndSignIn(new SignUpCommand({firstName: 'Rosa', lastName: 'Lima', email: 'second@example.test', password: 'fictitious-2'}));
        profiles.state.failNextCaregiverProfile = true;
        assert.equal(await profilesStore.createCaregiverProfile({userId: user.id, firstName: 'Rosa', lastName: 'Lima'}), false);
        assert.deepEqual(profilesStore.errors, ['profiles.errors.save']);
        assert.equal(iam.isSignedIn, true, 'the session stays open to complete the profile');

        await profilesStore.initialize(user.id, true, true);
        assert.equal(profilesStore.caregiverProfile, null, 'the app can see that the profile is missing');
        assert.equal(await profilesStore.createCaregiverProfile({userId: user.id, firstName: 'Rosa', lastName: 'Lima', phoneNumber: '+51 999 888 777'}), true);
        assert.equal(await profilesStore.createCaregiverProfile({userId: user.id, firstName: 'Rosa', lastName: 'Lima'}), true,
            'a repeated attempt loads the existing profile (409)');
        assert.equal(profiles.state.caregiverProfiles.filter(profile => profile.userId === user.id).length, 1);
        assert.equal(api.accounts.filter(account => account.email === 'second@example.test').length, 1);
    });

    await t.test('family member: invalid codes are rejected and the lookup is anonymous', async () => {
        const {iam, profiles: profilesStore} = stores();
        iam.expireSession();
        assert.equal(await profilesStore.findValidInvitation('VITA-NOPE0000'), null);
        const invitation = await profilesStore.findValidInvitation(' vita-abcd2345 ');
        assert.equal(invitation.id, profiles.state.access.id);
        assert.equal(invitation.invitedEmail, invitedEmail);
        const lookup = lastRequest('/api/v1/family-access?invitationCode=');
        assert.equal(lookup.headers.authorization, undefined);
        assert.ok(lookup.path.endsWith(invitationCode));
    });

    await t.test('family member: sign-up, profile and accepted invitation, also when resuming', async () => {
        const {iam, profiles: profilesStore} = stores();
        const invitation = await profilesStore.findValidInvitation(invitationCode);
        // A first attempt that stopped after creating the account.
        api.accounts.push({id: 150, email: invitedEmail, password: 'fictitious-3', role: 'FamilyMember', status: 'Active'});

        const wrongPassword = await iam.signUpAndSignIn(new SignUpCommand({
            firstName: 'Lucía', lastName: 'Quispe', email: invitedEmail, password: 'another-password', role: 'FamilyMember'
        }), {resumeExisting: true});
        assert.equal(wrongPassword, null);
        assert.deepEqual(iam.errors, ['iam.errors.email-in-use']);

        const user = await iam.signUpAndSignIn(new SignUpCommand({
            firstName: 'Lucía', lastName: 'Quispe', email: invitedEmail, password: 'fictitious-3', role: 'FamilyMember'
        }), {resumeExisting: true});
        assert.equal(user.id, 150);
        assert.equal(api.accounts.filter(account => account.email === invitedEmail).length, 1, 'no second account');

        assert.equal(await profilesStore.registerFamilyMember({
            userId: user.id, firstName: 'Lucía', lastName: 'Quispe', phoneNumber: '', invitation
        }), true);
        const accept = lastRequest(`/api/v1/family-access/${invitation.id}`);
        assert.equal(accept.method, 'PUT');
        assert.deepEqual(accept.body, {status: 'Active', familyMemberId: profiles.state.familyMemberProfiles[0].id});
        assert.equal(profiles.state.access.status, 'Active');
        assert.equal(await profilesStore.findValidInvitation(invitationCode), null, 'an accepted code is no longer valid');
    });

    await t.test('family member: an invitation that can no longer be accepted shows a clear message', async () => {
        const {iam, profiles: profilesStore} = stores();
        const user = await iam.signUpAndSignIn(new SignUpCommand({
            firstName: 'Lucía', lastName: 'Quispe', email: invitedEmail, password: 'fictitious-3', role: 'FamilyMember'
        }), {resumeExisting: true});
        const stale = {...profiles.state.access, status: 'Pending', familyMemberId: null};
        assert.equal(await profilesStore.registerFamilyMember({userId: user.id, firstName: 'Lucía', lastName: 'Quispe', phoneNumber: '', invitation: stale}), false);
        assert.deepEqual(profilesStore.errors, ['iam.family-sign-up.invalid-invitation']);
    });
});
