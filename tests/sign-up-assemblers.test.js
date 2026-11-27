import {test} from 'node:test';
import assert from 'node:assert/strict';
import {UserAssembler} from '../src/iam/infrastructure/user.assembler.js';
import {SignUpCommand} from '../src/iam/domain/model/sign-up.command.js';
import {ProfilesAssembler} from '../src/profiles/infrastructure/profiles.assembler.js';
import {CaregiverProfile} from '../src/profiles/domain/model/caregiver-profile.entity.js';
import {FamilyMemberProfile} from '../src/profiles/domain/model/family-member-profile.entity.js';
import {FamilyAccess} from '../src/profiles/domain/model/family-access.entity.js';

test('sign-up command becomes the SignUpResource with a normalized email and no names', () => {
    const command = new SignUpCommand({firstName: 'Ana', lastName: 'Quispe', email: ' Carer@Example.TEST ', password: 'fictitious-1'});
    assert.deepEqual(UserAssembler.toResourceFromSignUpCommand(command),
        {email: 'carer@example.test', password: 'fictitious-1', role: 'Caregiver'});
    const family = new SignUpCommand({firstName: 'L', lastName: 'Q', email: 'relative@example.test', password: 'fictitious-2', role: 'FamilyMember'});
    assert.equal(UserAssembler.toResourceFromSignUpCommand(family).role, 'FamilyMember');
});

test('caregiver profile becomes the SaveCaregiverProfileResource', () => {
    const profile = new CaregiverProfile({id: 9, userId: 3, firstName: ' Ana ', lastName: 'Quispe ', certifications: ['First aid']});
    assert.deepEqual(ProfilesAssembler.toResourceFromCaregiverProfile(profile), {
        userId: 3, firstName: 'Ana', lastName: 'Quispe', phoneNumber: '', professionalTitle: '', bio: '', photoUrl: '',
        certifications: ['First aid']
    });
});

test('CaregiverProfileResource becomes a CaregiverProfile entity', () => {
    const resource = {id: 9, userId: 3, firstName: 'Ana', lastName: 'Quispe', phoneNumber: '+51 999 888 777',
        professionalTitle: 'Nurse', bio: '', photoUrl: '', certifications: ['First aid']};
    const profile = ProfilesAssembler.toCaregiverProfileFromResource(resource);
    assert.ok(profile instanceof CaregiverProfile);
    assert.equal(profile.fullName, 'Ana Quispe');
    assert.deepEqual(profile.certifications, ['First aid']);
});

test('family member profile becomes the SaveFamilyMemberProfileResource', () => {
    const profile = new FamilyMemberProfile({userId: 4, firstName: ' Lucía', lastName: 'Quispe', phoneNumber: ' 999888777 '});
    assert.deepEqual(ProfilesAssembler.toResourceFromFamilyMemberProfile(profile),
        {userId: 4, firstName: 'Lucía', lastName: 'Quispe', phoneNumber: '999888777'});
});

test('InvitationResource becomes a family access that can be accepted', () => {
    const invitation = ProfilesAssembler.toFamilyAccessFromResource({
        id: 31, invitedEmail: 'relative@example.test', invitationCode: 'VITA-ABCD2345', relationship: 'Daughter',
        status: 'Pending', expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    assert.ok(invitation instanceof FamilyAccess);
    assert.equal(invitation.canBeAccepted(), true);
    const expired = ProfilesAssembler.toFamilyAccessFromResource({...invitation, expiresAt: new Date(Date.now() - 1).toISOString()});
    assert.equal(expired.canBeAccepted(), false);
});

test('accepting and revoking send only what UpdateFamilyAccessResource reads', () => {
    const access = new FamilyAccess({id: 31, olderAdultId: 5, invitedEmail: 'relative@example.test', relationship: 'Daughter',
        status: 'Pending', expiresAt: new Date(Date.now() + 60_000).toISOString()});
    access.accept(77);
    assert.deepEqual(ProfilesAssembler.toUpdateResourceFromFamilyAccess(access), {status: 'Active', familyMemberId: 77});
    const pending = new FamilyAccess({id: 32, status: 'Pending'});
    pending.revoke();
    assert.deepEqual(ProfilesAssembler.toUpdateResourceFromFamilyAccess(pending), {status: 'Revoked'});
});
