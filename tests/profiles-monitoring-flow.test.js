import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createPinia, setActivePinia} from 'pinia';
import {saveSession} from '../src/iam/application/session-storage.js';
import {fakeAccount, fakeToken, startFakeVitalitaApi, useMemoryLocalStorage} from './support/fake-vitalita-api.js';

const caregiverProfile = {id: 2, userId: fakeAccount.id, firstName: 'Ana', lastName: 'Quispe', phoneNumber: '',
    professionalTitle: '', bio: '', photoUrl: '', certifications: []};
const olderAdult = (id, status) => ({id, caregiverId: 2, firstName: `Name${id}`, lastName: 'Quispe', birthDate: '1948-03-09',
    documentNumber: '', bloodType: '', allergies: [], chronicConditions: [], observations: '',
    emergencyContact: {name: '', phoneNumber: '', relationship: ''}, status});

/**
 * Profiles and Monitoring endpoints of the fake API. Only the resources the Vitalita API has
 * are answered; the others fall back to 404 like the deployed backend.
 */
function fakeBackend() {
    const state = {
        olderAdults: [olderAdult(5, 'Active'), olderAdult(6, 'Archived')],
        medications: [{id: 3, olderAdultId: 5, name: 'Losartan', dosage: '50 mg', frequency: '', scheduleTimes: ['08:00'],
            instructions: '', active: true}],
        accesses: [{id: 31, olderAdultId: 5, familyMemberId: null, invitedEmail: 'taken@example.test',
            invitationCode: 'VITA-ABCD2345', relationship: 'Son', status: 'Pending'}]
    };
    const json = (status, body) => ({status, body});
    const problem = (status, title) => ({status, body: {title, status, message: title}, type: 'application/problem+json'});
    const handle = request => {
        if (!request.authorized) return problem(401, 'Unauthorized');
        const url = new URL(request.path, 'http://fake');
        const path = url.pathname.replace('/api/v1', '');
        const olderAdultId = Number(url.searchParams.get('olderAdultId'));
        if (olderAdultId && olderAdultId !== 5) return problem(403, 'Forbidden.');
        if (path === '/caregiver-profiles' && request.method === 'GET') return json(200, [caregiverProfile]);
        if (path === '/older-adults' && request.method === 'GET') return json(200, state.olderAdults);
        const olderAdultMatch = path.match(/^\/older-adults\/(\d+)$/);
        if (olderAdultMatch && request.method === 'PUT') {
            const updated = {...request.body, id: Number(olderAdultMatch[1])};
            state.olderAdults = state.olderAdults.map(item => item.id === updated.id ? updated : item);
            return json(200, updated);
        }
        if (path === '/daily-reports') return json(200, [{id: 1, olderAdultId: 5, recordedByUserId: fakeAccount.id,
            reportDate: '2026-11-20T14:30:00Z', mood: 'Good', generalCondition: 'Stable', observations: 'Calm day.'}]);
        if (path === '/vital-signs') return json(200, [{id: 1, olderAdultId: 5, type: 'BloodPressure', value: 130,
            secondaryValue: 85, unit: 'mmHg', measuredAt: '2026-11-20T14:30:00Z'}]);
        if (path === '/medications' && request.method === 'GET') return json(200, state.medications);
        const medicationMatch = path.match(/^\/medications\/(\d+)$/);
        if (medicationMatch && request.method === 'PUT') {
            const updated = {...request.body, id: Number(medicationMatch[1])};
            state.medications = state.medications.map(item => item.id === updated.id ? updated : item);
            return json(200, updated);
        }
        if (path === '/family-access' && request.method === 'POST') {
            const taken = state.accesses.some(access => access.invitedEmail === request.body.invitedEmail && access.status !== 'Revoked');
            if (taken) return problem(409, 'Already invited.');
            const created = {id: 40, ...request.body, familyMemberId: null, invitationCode: 'VITA-NEWC0DE1', status: 'Pending',
                invitedAt: new Date().toISOString(), acceptedAt: null, expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString()};
            state.accesses.push(created);
            return json(201, created);
        }
        const accessMatch = path.match(/^\/family-access\/(\d+)$/);
        if (accessMatch && request.method === 'PUT') {
            const access = state.accesses.find(item => item.id === Number(accessMatch[1]));
            Object.assign(access, {status: request.body.status});
            return json(200, access);
        }
        return undefined;
    };
    return {state, handle};
}

test('profiles and monitoring against the Vitalita API', async t => {
    useMemoryLocalStorage();
    t.after(() => delete globalThis.localStorage);
    const backend = fakeBackend();
    const api = await startFakeVitalitaApi({handle: backend.handle});
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
    const {default: useMonitoringStore} = await vite.ssrLoadModule('/src/monitoring/application/monitoring.store.js');
    const {default: useCareContextStore} = await vite.ssrLoadModule('/src/shared/application/care-context.store.js');

    setActivePinia(createPinia());
    const profiles = useProfilesStore();
    const requestsTo = prefix => api.requests.filter(request => request.path.startsWith(`/api/v1${prefix}`));

    await t.test('without a session the profiles are not requested', async () => {
        await profiles.initialize(null, false);
        assert.equal(api.requests.length, 0);
        assert.deepEqual(profiles.errors, []);
    });

    const token = fakeToken(Date.now() + 10 * 60 * 1000);
    api.validTokens.add(token);
    saveSession({id: fakeAccount.id, email: fakeAccount.email, role: 'Caregiver', status: 'Active'}, token);
    setActivePinia(createPinia());
    const caregiverIam = useIamStore();
    const caregiverProfiles = useProfilesStore();
    const caregiverMonitoring = useMonitoringStore();
    const caregiverContext = useCareContextStore();
    assert.equal(caregiverIam.isSignedIn, true);

    await t.test('older adults are listed by caregiverId and archived ones are hidden', async () => {
        await caregiverProfiles.initialize(fakeAccount.id, true);
        assert.ok(requestsTo('/older-adults?caregiverId=2').length > 0);
        assert.deepEqual(caregiverProfiles.olderAdults.map(item => item.id), [5]);
        assert.equal(caregiverContext.selectedOlderAdultId, 5);
    });

    await t.test('monitoring loads reports, vital signs and medications even if other resources are missing', async () => {
        await caregiverMonitoring.fetchForOlderAdult(5, true);
        assert.deepEqual(caregiverMonitoring.errors, []);
        assert.equal(caregiverMonitoring.dailyReports.length, 1);
        assert.equal(caregiverMonitoring.vitalSigns[0].displayValue, '130/85');
        assert.equal(caregiverMonitoring.medications.length, 1);
        assert.deepEqual(caregiverMonitoring.appointments, [], 'a 404 of a missing resource is an empty list');
    });

    await t.test('a 403 is shown as a clear message', async () => {
        await caregiverMonitoring.fetchForOlderAdult(99, true);
        assert.deepEqual(caregiverMonitoring.errors, ['monitoring.errors.forbidden']);
    });

    await t.test('deactivating a medication is a PUT with active false', async () => {
        await caregiverMonitoring.fetchForOlderAdult(5, true);
        assert.equal(await caregiverMonitoring.deactivateMedication(caregiverMonitoring.medications[0]), true);
        const put = requestsTo('/medications/3').at(-1);
        assert.equal(put.method, 'PUT');
        assert.equal(put.body.active, false);
        assert.equal('id' in put.body, false);
        assert.equal(caregiverMonitoring.activeMedications.length, 0);
    });

    let invitation = null;
    await t.test('inviting sends the contract fields and a 409 means already invited', async () => {
        caregiverContext.selectOlderAdult(5);
        const created = invitation = await caregiverProfiles.inviteFamilyMember({invitedEmail: 'New@Example.test', relationship: 'Daughter'});
        assert.equal(created.invitationCode, 'VITA-NEWC0DE1', 'the code comes from the API');
        assert.deepEqual(requestsTo('/family-access').at(-1).body,
            {olderAdultId: 5, invitedEmail: 'new@example.test', relationship: 'Daughter'});
        caregiverProfiles.familyAccesses.splice(0);
        assert.equal(await caregiverProfiles.inviteFamilyMember({invitedEmail: 'taken@example.test', relationship: 'Son'}), null);
        assert.deepEqual(caregiverProfiles.errors, ['profiles.errors.already-invited']);
    });

    await t.test('revoking is a PUT with Status Revoked', async () => {
        assert.equal(await caregiverProfiles.revokeFamilyAccess(invitation), true);
        const put = requestsTo('/family-access/40').at(-1);
        assert.deepEqual(put.body, {status: 'Revoked'});
    });

    await t.test('archiving an older adult is a PUT with Status Archived and moves the selection', async () => {
        assert.equal(await caregiverProfiles.archiveOlderAdult(caregiverProfiles.olderAdults[0]), true);
        const put = requestsTo('/older-adults/5').at(-1);
        assert.equal(put.method, 'PUT');
        assert.equal(put.body.status, 'Archived');
        assert.equal(put.body.birthDate, '1948-03-09');
        assert.deepEqual(caregiverProfiles.olderAdults, []);
        assert.equal(caregiverContext.selectedOlderAdultId, null);
    });
});
