import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ProfilesAssembler} from '../src/profiles/infrastructure/profiles.assembler.js';
import {OlderAdult} from '../src/profiles/domain/model/older-adult.entity.js';
import {MonitoringAssembler} from '../src/monitoring/infrastructure/monitoring.assembler.js';
import {DailyReport} from '../src/monitoring/domain/model/daily-report.entity.js';
import {VitalSign} from '../src/monitoring/domain/model/vital-sign.entity.js';
import {Medication} from '../src/monitoring/domain/model/medication.entity.js';

const olderAdultResource = {
    id: 5, caregiverId: 2, firstName: 'Rosa', lastName: 'Quispe', birthDate: '1948-03-09', documentNumber: '12345678',
    bloodType: 'O+', allergies: ['Penicillin'], chronicConditions: [], observations: null,
    emergencyContact: {name: null, phoneNumber: '999888777', relationship: 'Daughter'}, status: 'Active'
};

test('OlderAdultResource becomes an entity and null texts become empty strings', () => {
    const olderAdult = ProfilesAssembler.toOlderAdultFromResource(olderAdultResource);
    assert.ok(olderAdult instanceof OlderAdult);
    assert.equal(olderAdult.observations, '');
    assert.equal(olderAdult.emergencyContact.name, '');
    assert.equal(olderAdult.emergencyContact.isComplete(), false);
    assert.equal(olderAdult.isArchived(), false);
});

test('older adult becomes the SaveOlderAdultResource with a DateOnly birth date and no id', () => {
    const olderAdult = ProfilesAssembler.toOlderAdultFromResource({...olderAdultResource, firstName: ' Rosa '});
    const resource = ProfilesAssembler.toResourceFromOlderAdult(olderAdult);
    assert.deepEqual(resource, {
        caregiverId: 2, firstName: 'Rosa', lastName: 'Quispe', birthDate: '1948-03-09', documentNumber: '12345678',
        bloodType: 'O+', allergies: ['Penicillin'], chronicConditions: [],
        emergencyContact: {name: '', phoneNumber: '999888777', relationship: 'Daughter'}, observations: '', status: 'Active'
    });
    assert.equal('id' in resource, false);
});

test('archiving is an update with Status Archived', () => {
    const olderAdult = ProfilesAssembler.toOlderAdultFromResource(olderAdultResource);
    olderAdult.archive();
    assert.equal(olderAdult.isArchived(), true);
    assert.equal(ProfilesAssembler.toResourceFromOlderAdult(olderAdult).status, 'Archived');
});

test('an invitation sends only olderAdultId, invitedEmail and relationship', () => {
    assert.deepEqual(
        ProfilesAssembler.toCreateResourceFromInvitation({olderAdultId: 5, invitedEmail: ' Relative@Example.TEST ', relationship: 'Son'}),
        {olderAdultId: 5, invitedEmail: 'relative@example.test', relationship: 'Son'});
});

test('daily report becomes the SaveDailyReportResource with an ISO instant and no author', () => {
    const report = new DailyReport({olderAdultId: 5, recordedByUserId: 9, reportDate: '2026-11-20T14:30:00Z',
        mood: 'VeryGood', generalCondition: 'Attention', observations: ' Ate well. '});
    assert.deepEqual(MonitoringAssembler.toDailyReportResource(report), {
        olderAdultId: 5, reportDate: '2026-11-20T14:30:00.000Z', mood: 'VeryGood', generalCondition: 'Attention',
        observations: 'Ate well.'
    });
});

test('blood pressure sends the systolic as value and the diastolic as secondaryValue', () => {
    const pressure = new VitalSign({olderAdultId: 5, type: 'BloodPressure', value: 130, secondaryValue: 85,
        measuredAt: '2026-11-20T14:30:00Z'});
    assert.deepEqual(MonitoringAssembler.toVitalSignResource(pressure), {
        olderAdultId: 5, type: 'BloodPressure', value: 130, secondaryValue: 85, measuredAt: '2026-11-20T14:30:00.000Z'
    });
    const heartRate = new VitalSign({olderAdultId: 5, type: 'HeartRate', value: 72, secondaryValue: 10,
        measuredAt: '2026-11-20T14:30:00Z'});
    assert.equal(MonitoringAssembler.toVitalSignResource(heartRate).secondaryValue, null);
    assert.equal('unit' in MonitoringAssembler.toVitalSignResource(heartRate), false, 'the API derives the unit');
});

test('VitalSignResource becomes an entity with the unit sent by the API', () => {
    const [sign] = MonitoringAssembler.toVitalSigns({status: 200, data: [
        {id: 1, olderAdultId: 5, type: 'BloodPressure', value: 130, secondaryValue: 85, unit: 'mmHg', measuredAt: '2026-11-20T14:30:00Z'}
    ]});
    assert.equal(sign.displayValue, '130/85');
    assert.equal(sign.hasValidFormat(), true);
});

test('medication becomes the SaveMedicationResource, and deactivating sends active false', () => {
    const medication = new Medication({id: 3, olderAdultId: 5, name: ' Losartan ', dosage: '50 mg', frequency: '',
        scheduleTimes: ['20:00', '08:00'], instructions: 'After breakfast', active: true});
    assert.deepEqual(MonitoringAssembler.toMedicationResource(medication), {
        olderAdultId: 5, name: 'Losartan', dosage: '50 mg', frequency: '', scheduleTimes: ['08:00', '20:00'],
        instructions: 'After breakfast', active: true
    });
    const inactive = new Medication({...medication, active: false});
    assert.equal(MonitoringAssembler.toMedicationResource(inactive).active, false);
});
