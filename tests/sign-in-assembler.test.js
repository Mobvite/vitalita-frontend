import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SignInAssembler} from '../src/iam/infrastructure/sign-in.assembler.js';
import {SignInResource} from '../src/iam/infrastructure/sign-in.resource.js';
import {SignInCommand} from '../src/iam/domain/model/sign-in.command.js';

const authenticatedUser = {id: 42, email: 'family@example.test', role: 'FamilyMember', status: 'Active', token: 'header.payload.signature'};

test('sign-in command becomes the SignInResource of the API without the form role', () => {
    const command = new SignInCommand({email: 'family@example.test', password: 'fictitious-password', role: 'FamilyMember'});
    assert.deepEqual(SignInAssembler.toResourceFromCommand(command), {email: 'family@example.test', password: 'fictitious-password'});
});

test('AuthenticatedUserResource response becomes a SignInResource', () => {
    const resource = SignInAssembler.toResourceFromResponse({status: 200, statusText: 'OK', data: authenticatedUser});
    assert.ok(resource instanceof SignInResource);
    assert.deepEqual({...resource}, authenticatedUser);
});

test('responses without a token are rejected', () => {
    const originalError = console.error;
    console.error = () => {};
    try {
        assert.equal(SignInAssembler.toResourceFromResponse({status: 200, statusText: 'OK', data: null}), null);
        assert.equal(SignInAssembler.toResourceFromResponse({status: 200, statusText: 'OK', data: {...authenticatedUser, token: ''}}), null);
        assert.equal(SignInAssembler.toResourceFromResponse({status: 204, statusText: 'No Content', data: authenticatedUser}), null);
    } finally {
        console.error = originalError;
    }
});
