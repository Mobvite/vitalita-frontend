import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const caregiverProfilesEndpointPath = import.meta.env.VITE_CAREGIVER_PROFILES_ENDPOINT_PATH;
const familyMemberProfilesEndpointPath = import.meta.env.VITE_FAMILY_MEMBER_PROFILES_ENDPOINT_PATH;
const olderAdultsEndpointPath = import.meta.env.VITE_OLDER_ADULTS_ENDPOINT_PATH;
const familyAccessEndpointPath = import.meta.env.VITE_FAMILY_ACCESS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the Profiles Management context.
 *
 * @class ProfilesApi
 * @extends BaseApi
 */
export class ProfilesApi extends BaseApi {
    #caregiverProfilesEndpoint;
    #familyMemberProfilesEndpoint;
    #olderAdultsEndpoint;
    #familyAccessEndpoint;

    constructor() {
        super();
        this.#caregiverProfilesEndpoint = new BaseEndpoint(this, caregiverProfilesEndpointPath);
        this.#familyMemberProfilesEndpoint = new BaseEndpoint(this, familyMemberProfilesEndpointPath);
        this.#olderAdultsEndpoint = new BaseEndpoint(this, olderAdultsEndpointPath);
        this.#familyAccessEndpoint = new BaseEndpoint(this, familyAccessEndpointPath);
    }

    // Caregiver profiles
    getCaregiverProfileByUserId(userId) { return this.#caregiverProfilesEndpoint.getAll({userId}); }
    getCaregiverProfileById(id) { return this.#caregiverProfilesEndpoint.getById(id); }
    createCaregiverProfile(resource) { return this.#caregiverProfilesEndpoint.create(resource); }
    updateCaregiverProfile(id, resource) { return this.#caregiverProfilesEndpoint.update(id, resource); }

    // Family member profiles
    getFamilyMemberProfileByUserId(userId) { return this.#familyMemberProfilesEndpoint.getAll({userId}); }
    getFamilyMemberProfilesByIds(ids) {
        return this.#familyMemberProfilesEndpoint.getAll(new URLSearchParams(ids.map(id => ['id', String(id)])));
    }
    createFamilyMemberProfile(resource) { return this.#familyMemberProfilesEndpoint.create(resource); }
    updateFamilyMemberProfile(id, resource) { return this.#familyMemberProfilesEndpoint.update(id, resource); }

    // Older adults
    getOlderAdultsByCaregiverId(caregiverId) { return this.#olderAdultsEndpoint.getAll({caregiverId}); }
    getOlderAdultsByIds(ids) {
        return this.#olderAdultsEndpoint.getAll(new URLSearchParams(ids.map(id => ['id', String(id)])));
    }
    createOlderAdult(resource) { return this.#olderAdultsEndpoint.create(resource); }
    /**
     * Replaces an older adult with PUT /older-adults/{id}. There is no DELETE: archiving is a PUT with Status Archived.
     * @param {number} id - Older adult identifier.
     * @param {Object} resource - SaveOlderAdultResource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated OlderAdultResource.
     */
    updateOlderAdult(id, resource) { return this.#olderAdultsEndpoint.update(id, resource); }

    // Family access
    getFamilyAccessesByOlderAdultId(olderAdultId) { return this.#familyAccessEndpoint.getAll({olderAdultId}); }
    getActiveAccessesByFamilyMemberId(familyMemberId) { return this.#familyAccessEndpoint.getAll({familyMemberId, status: 'Active'}); }
    /**
     * Looks up a pending invitation. Public endpoint: it returns [] when the code is not valid, expired or revoked.
     * @param {string} invitationCode - Invitation code.
     * @returns {Promise<import('axios').AxiosResponse>} Response with zero or one InvitationResource.
     */
    getFamilyAccessByCode(invitationCode) { return this.#familyAccessEndpoint.getAll({invitationCode}); }
    createFamilyAccess(resource) { return this.#familyAccessEndpoint.create(resource); }
    /**
     * Changes a family access with PUT /family-access/{id}. There is no DELETE: revoking is a PUT with Status Revoked.
     * @param {number} id - Family access identifier.
     * @param {{status: string, familyMemberId?: number, relationship?: string}} resource - UpdateFamilyAccessResource.
     * @returns {Promise<import('axios').AxiosResponse>} Response with the updated FamilyAccessResource.
     */
    updateFamilyAccess(id, resource) { return this.#familyAccessEndpoint.update(id, resource); }
}
