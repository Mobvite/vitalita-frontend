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
    updateCaregiverProfile(resource) { return this.#caregiverProfilesEndpoint.update(resource.id, resource); }

    // Family member profiles
    getFamilyMemberProfileByUserId(userId) { return this.#familyMemberProfilesEndpoint.getAll({userId}); }
    getFamilyMemberProfilesByIds(ids) { return this.#familyMemberProfilesEndpoint.getAll({id: ids}); }
    createFamilyMemberProfile(resource) { return this.#familyMemberProfilesEndpoint.create(resource); }

    // Older adults
    getOlderAdultsByCaregiverId(caregiverId) { return this.#olderAdultsEndpoint.getAll({caregiverId}); }
    getOlderAdultsByIds(ids) { return this.#olderAdultsEndpoint.getAll({id: ids}); }
    createOlderAdult(resource) { return this.#olderAdultsEndpoint.create(resource); }
    updateOlderAdult(resource) { return this.#olderAdultsEndpoint.update(resource.id, resource); }

    // Family access
    getFamilyAccessesByOlderAdultId(olderAdultId) { return this.#familyAccessEndpoint.getAll({olderAdultId}); }
    getActiveAccessesByFamilyMemberId(familyMemberId) { return this.#familyAccessEndpoint.getAll({familyMemberId, status: 'Active'}); }
    getFamilyAccessByCode(invitationCode) { return this.#familyAccessEndpoint.getAll({invitationCode}); }
    createFamilyAccess(resource) { return this.#familyAccessEndpoint.create(resource); }
    updateFamilyAccess(resource) { return this.#familyAccessEndpoint.update(resource.id, resource); }
}
