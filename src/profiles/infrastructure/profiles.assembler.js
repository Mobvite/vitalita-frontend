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
    static toOlderAdultFromResource(resource) {
        return new OlderAdult({...resource});
    }

    static toOlderAdultsFromResponse(response) {
        return readResources(response, 'olderAdults').map(resource => this.toOlderAdultFromResource(resource));
    }

    /**
     * @param {OlderAdult} olderAdult - Entity to send.
     * @returns {Object} Plain resource without getters.
     */
    static toResourceFromOlderAdult(olderAdult) {
        return {
            id: olderAdult.id ?? undefined,
            caregiverId: olderAdult.caregiverId,
            firstName: olderAdult.firstName.trim(),
            lastName: olderAdult.lastName.trim(),
            birthDate: olderAdult.birthDate,
            documentNumber: olderAdult.documentNumber,
            bloodType: olderAdult.bloodType,
            allergies: olderAdult.allergies,
            chronicConditions: olderAdult.chronicConditions,
            emergencyContact: {...olderAdult.emergencyContact},
            observations: olderAdult.observations,
            status: olderAdult.status
        };
    }

    static toCaregiverProfileFromResource(resource) {
        return new CaregiverProfile({...resource});
    }

    static toCaregiverProfilesFromResponse(response) {
        return readResources(response, 'caregiverProfiles').map(resource => this.toCaregiverProfileFromResource(resource));
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
     * @param {FamilyAccess} familyAccess - Entity to send.
     * @returns {Object} Plain resource.
     */
    static toResourceFromFamilyAccess(familyAccess) {
        return {...familyAccess, id: familyAccess.id ?? undefined};
    }
}
