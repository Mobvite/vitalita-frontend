import {OlderAdult} from "../domain/model/older-adult.entity.js";
import {CaregiverProfile} from "../domain/model/caregiver-profile.entity.js";
import {FamilyMemberProfile} from "../domain/model/family-member-profile.entity.js";
import {FamilyAccess} from "../domain/model/family-access.entity.js";

/**
 * Reads a collection from a response, whether it comes as an array
 * or inside a named property.
 * @param {import('axios').AxiosResponse} response - HTTP response.
 * @param {string} key - Property name when the data is an object.
 * @returns {Object[]} Resources.
 */
function readResources(response, key) {
    if (response.status !== 200) {
        console.error(`${response.status}, ${response.statusText}`);
        return [];
    }
    return response.data instanceof Array ? response.data : response.data[key] ?? [];
}

/**
 * Maps Profiles resources into domain entities and entities into resources.
 *
 * @class ProfilesAssembler
 */
export class ProfilesAssembler {
    /**
     * Maps an OlderAdultResource. Text fields the API may send as null become empty strings.
     * @param {Object} resource - OlderAdultResource.
     * @returns {OlderAdult} Entity.
     */
    static toOlderAdultFromResource(resource) {
        const contact = resource.emergencyContact ?? {};
        return new OlderAdult({
            ...resource,
            documentNumber: resource.documentNumber ?? '',
            bloodType: resource.bloodType ?? '',
            allergies: resource.allergies ?? [],
            chronicConditions: resource.chronicConditions ?? [],
            observations: resource.observations ?? '',
            emergencyContact: {
                name: contact.name ?? '', phoneNumber: contact.phoneNumber ?? '', relationship: contact.relationship ?? ''
            }
        });
    }

    static toOlderAdultsFromResponse(response) {
        return readResources(response, 'olderAdults').map(resource => this.toOlderAdultFromResource(resource));
    }

    /**
     * Builds the SaveOlderAdultResource of the API (POST and PUT). BirthDate is a DateOnly ("YYYY-MM-DD")
     * and status is required by PUT: "Archived" ends the follow-up, because there is no DELETE.
     * @param {OlderAdult} olderAdult - Older adult.
     * @returns {Object} Request body.
     */
    static toResourceFromOlderAdult(olderAdult) {
        const contact = olderAdult.emergencyContact;
        return {
            caregiverId: olderAdult.caregiverId,
            firstName: olderAdult.firstName.trim(),
            lastName: olderAdult.lastName.trim(),
            birthDate: olderAdult.birthDate ? String(olderAdult.birthDate).slice(0, 10) : null,
            documentNumber: olderAdult.documentNumber?.trim() ?? '',
            bloodType: olderAdult.bloodType ?? '',
            allergies: [...olderAdult.allergies],
            chronicConditions: [...olderAdult.chronicConditions],
            emergencyContact: {
                name: contact.name?.trim() ?? '',
                phoneNumber: contact.phoneNumber?.trim() ?? '',
                relationship: contact.relationship ?? ''
            },
            observations: olderAdult.observations?.trim() ?? '',
            status: olderAdult.status
        };
    }

    /**
     * Builds the SaveCaregiverProfileResource of the API (POST and PUT).
     * @param {CaregiverProfile} profile - Caregiver profile.
     * @returns {Object} Request body.
     */
    static toResourceFromCaregiverProfile(profile) {
        return {
            userId: profile.userId,
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            phoneNumber: profile.phoneNumber?.trim() ?? '',
            professionalTitle: profile.professionalTitle?.trim() ?? '',
            bio: profile.bio?.trim() ?? '',
            photoUrl: profile.photoUrl?.trim() ?? '',
            certifications: [...(profile.certifications ?? [])]
        };
    }

    static toCaregiverProfileFromResource(resource) {
        return new CaregiverProfile({...resource});
    }

    static toCaregiverProfilesFromResponse(response) {
        return readResources(response, 'caregiverProfiles').map(resource => this.toCaregiverProfileFromResource(resource));
    }

    /**
     * Builds the SaveFamilyMemberProfileResource of the API (POST and PUT).
     * @param {FamilyMemberProfile} profile - Family member profile.
     * @returns {{userId: number, firstName: string, lastName: string, phoneNumber: string}} Request body.
     */
    static toResourceFromFamilyMemberProfile(profile) {
        return {
            userId: profile.userId,
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            phoneNumber: profile.phoneNumber?.trim() ?? ''
        };
    }

    static toFamilyMemberProfileFromResource(resource) {
        return new FamilyMemberProfile({...resource});
    }

    static toFamilyMemberProfilesFromResponse(response) {
        return readResources(response, 'familyMemberProfiles').map(resource => this.toFamilyMemberProfileFromResource(resource));
    }

    static toFamilyAccessFromResource(resource) {
        return new FamilyAccess({...resource});
    }

    static toFamilyAccessesFromResponse(response) {
        return readResources(response, 'familyAccess').map(resource => this.toFamilyAccessFromResource(resource));
    }

    /**
     * Builds the UpdateFamilyAccessResource of the API. The API only reads status,
     * familyMemberId and relationship; accepting needs status Active and familyMemberId.
     * @param {FamilyAccess} familyAccess - Family access with the new status.
     * @returns {{status: string, familyMemberId?: number}} Request body.
     */
    static toUpdateResourceFromFamilyAccess(familyAccess) {
        const resource = {status: familyAccess.status};
        if (familyAccess.familyMemberId !== null) resource.familyMemberId = familyAccess.familyMemberId;
        return resource;
    }

    /**
     * Builds the CreateFamilyAccessResource of the API. The server ignores and generates
     * the code, status and dates, so only these three fields are sent.
     * @param {{olderAdultId: number, invitedEmail: string, relationship: string}} invitation - Invitation data.
     * @returns {{olderAdultId: number, invitedEmail: string, relationship: string}} Request body.
     */
    static toCreateResourceFromInvitation({olderAdultId, invitedEmail, relationship}) {
        return {olderAdultId, invitedEmail: invitedEmail.trim().toLowerCase(), relationship};
    }
}
