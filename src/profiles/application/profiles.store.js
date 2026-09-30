import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {ProfilesApi} from "../infrastructure/profiles-api.js";
import {ProfilesAssembler} from "../infrastructure/profiles.assembler.js";
import {FamilyAccess} from "../domain/model/family-access.entity.js";
import useCareContextStore from "../../shared/application/care-context.store.js";
import useSubscriptionsStore from "../../subscriptions/application/subscriptions.store.js";

const profilesApi = new ProfilesApi();

/**
 * Application store for the Profiles Management context.
 * Errors are saved as i18n keys, so the views show them in the active language.
 */
const useProfilesStore = defineStore('profiles', () => {
    const olderAdults = ref([]);
    const caregiverProfile = ref(null);
    const familyMemberProfile = ref(null);
    const familyAccesses = ref([]);
    const familyMemberProfiles = ref([]);
    const responsibleCaregiver = ref(null);
    const errors = ref([]);
    const isLoading = ref(false);
    const olderAdultsLoaded = ref(false);
    /** User for whom the data was loaded. It avoids mixing data after a new sign-in. */
    const loadedForUserId = ref(null);

    const careContext = useCareContextStore();

    const selectedOlderAdult = computed(() =>
        olderAdults.value.find(olderAdult => olderAdult.id === careContext.selectedOlderAdultId) ?? null);
    const olderAdultsCount = computed(() => olderAdults.value.length);
    /** Family accesses that count for the plan limit (pending or active). */
    const openFamilyAccessesCount = computed(() => familyAccesses.value.filter(access => access.status !== 'Revoked').length);

    /**
     * Loads the profile and the older adults of the signed-in user.
     * A caregiver sees the older adults in her charge; a family member sees
     * only the older adults with an active access.
     * @param {number} userId - Signed-in user.
     * @param {boolean} isCaregiver - True for caregivers, false for family members.
     * @param {boolean} [force=false] - Reload even if the data is already there.
     */
    async function initialize(userId, isCaregiver, force = false) {
        if (!force && loadedForUserId.value === userId && olderAdultsLoaded.value) return;
        isLoading.value = true;
        errors.value = [];
        try {
            if (isCaregiver) {
                const profiles = ProfilesAssembler.toCaregiverProfilesFromResponse(await profilesApi.getCaregiverProfileByUserId(userId));
                caregiverProfile.value = profiles[0] ?? null;
                familyMemberProfile.value = null;
                olderAdults.value = caregiverProfile.value
                    ? ProfilesAssembler.toOlderAdultsFromResponse(await profilesApi.getOlderAdultsByCaregiverId(caregiverProfile.value.id))
                    : [];
            } else {
                const profiles = ProfilesAssembler.toFamilyMemberProfilesFromResponse(await profilesApi.getFamilyMemberProfileByUserId(userId));
                familyMemberProfile.value = profiles[0] ?? null;
                caregiverProfile.value = null;
                olderAdults.value = [];
                if (familyMemberProfile.value) {
                    const accesses = ProfilesAssembler.toFamilyAccessesFromResponse(
                        await profilesApi.getActiveAccessesByFamilyMemberId(familyMemberProfile.value.id));
                    const ids = accesses.map(access => access.olderAdultId);
                    if (ids.length > 0) {
                        olderAdults.value = ProfilesAssembler.toOlderAdultsFromResponse(await profilesApi.getOlderAdultsByIds(ids));
                    }
                }
            }
            keepValidSelection();
            loadedForUserId.value = userId;
            olderAdultsLoaded.value = true;
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.load');
        } finally {
            isLoading.value = false;
        }
    }

    /** Selects the first older adult when the saved selection is not in the list anymore. */
    function keepValidSelection() {
        const exists = olderAdults.value.some(olderAdult => olderAdult.id === careContext.selectedOlderAdultId);
        if (!exists) careContext.selectOlderAdult(olderAdults.value[0]?.id ?? null);
    }

    /**
     * Registers an older adult. The plan limit is checked first (US07, US10).
     * @param {import('../domain/model/older-adult.entity.js').OlderAdult} olderAdult - New older adult.
     * @returns {Promise<boolean>} True when it was created.
     */
    async function addOlderAdult(olderAdult) {
        errors.value = [];
        const subscriptions = useSubscriptionsStore();
        if (!subscriptions.canManageAnotherOlderAdult(olderAdultsCount.value)) {
            errors.value.push('profiles.errors.plan-limit');
            return false;
        }
        if (!olderAdult.hasRequiredData()) {
            errors.value.push('profiles.errors.required-data');
            return false;
        }
        try {
            olderAdult.caregiverId = caregiverProfile.value.id;
            const response = await profilesApi.createOlderAdult(ProfilesAssembler.toResourceFromOlderAdult(olderAdult));
            const created = ProfilesAssembler.toOlderAdultFromResource(response.data);
            olderAdults.value.push(created);
            careContext.selectOlderAdult(created.id);
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.save');
            return false;
        }
    }

    /**
     * Updates the data of an older adult (US09).
     * Invalid data never replaces the saved data.
     * @param {import('../domain/model/older-adult.entity.js').OlderAdult} olderAdult - Older adult with changes.
     * @returns {Promise<boolean>} True when it was updated.
     */
    async function updateOlderAdult(olderAdult) {
        errors.value = [];
        if (!olderAdult.hasRequiredData()) {
            errors.value.push('profiles.errors.required-data');
            return false;
        }
        try {
            const response = await profilesApi.updateOlderAdult(ProfilesAssembler.toResourceFromOlderAdult(olderAdult));
            const updated = ProfilesAssembler.toOlderAdultFromResource(response.data);
            const index = olderAdults.value.findIndex(item => item.id === updated.id);
            if (index !== -1) olderAdults.value[index] = updated;
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.save');
            return false;
        }
    }

    /**
     * @param {number|string} id - Older adult identifier.
     * @returns {import('../domain/model/older-adult.entity.js').OlderAdult|undefined} Loaded older adult.
     */
    function getOlderAdultById(id) {
        return olderAdults.value.find(olderAdult => olderAdult.id === Number(id));
    }

    /**
     * Loads the family accesses of an older adult with the name of each family member.
     * @param {number} olderAdultId - Older adult identifier.
     */
    async function fetchFamilyAccesses(olderAdultId) {
        errors.value = [];
        try {
            familyAccesses.value = ProfilesAssembler.toFamilyAccessesFromResponse(
                await profilesApi.getFamilyAccessesByOlderAdultId(olderAdultId));
            const ids = familyAccesses.value.map(access => access.familyMemberId).filter(Boolean);
            familyMemberProfiles.value = ids.length > 0
                ? ProfilesAssembler.toFamilyMemberProfilesFromResponse(await profilesApi.getFamilyMemberProfilesByIds(ids))
                : [];
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.load');
        }
    }

    /**
     * @param {?number} familyMemberId - Family member profile identifier.
     * @returns {string} Full name, or an empty string while the invitation is pending.
     */
    function getFamilyMemberName(familyMemberId) {
        return familyMemberProfiles.value.find(profile => profile.id === familyMemberId)?.fullName ?? '';
    }

    /**
     * Creates an invitation for a family member (US11).
     * @param {{invitedEmail: string, relationship: string}} data - Invitation data.
     * @returns {Promise<FamilyAccess|null>} The invitation, or null when it failed.
     */
    async function inviteFamilyMember({invitedEmail, relationship}) {
        errors.value = [];
        const olderAdultId = careContext.selectedOlderAdultId;
        const subscriptions = useSubscriptionsStore();
        if (!subscriptions.canInviteAnotherFamilyMember(openFamilyAccessesCount.value)) {
            errors.value.push('profiles.errors.family-limit');
            return null;
        }
        const alreadyInvited = familyAccesses.value.some(access =>
            access.invitedEmail === invitedEmail.trim().toLowerCase() && access.status !== 'Revoked');
        if (alreadyInvited) {
            errors.value.push('profiles.errors.already-invited');
            return null;
        }
        try {
            const invitation = FamilyAccess.createInvitation({olderAdultId, invitedEmail, relationship});
            const response = await profilesApi.createFamilyAccess(ProfilesAssembler.toResourceFromFamilyAccess(invitation));
            const created = ProfilesAssembler.toFamilyAccessFromResource(response.data);
            familyAccesses.value.push(created);
            return created;
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.save');
            return null;
        }
    }

    /**
     * Revokes a family access (US32).
     * @param {FamilyAccess} familyAccess - Access to revoke.
     * @returns {Promise<boolean>} True when it was revoked.
     */
    async function revokeFamilyAccess(familyAccess) {
        errors.value = [];
        try {
            const updated = ProfilesAssembler.toFamilyAccessFromResource({...familyAccess});
            updated.revoke();
            await profilesApi.updateFamilyAccess(ProfilesAssembler.toResourceFromFamilyAccess(updated));
            const index = familyAccesses.value.findIndex(access => access.id === updated.id);
            if (index !== -1) familyAccesses.value[index] = updated;
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.save');
            return false;
        }
    }

    /**
     * Finds an invitation that can still be accepted (US31).
     * @param {string} invitationCode - Code received by the family member.
     * @returns {Promise<FamilyAccess|null>} Valid invitation or null.
     */
    async function findValidInvitation(invitationCode) {
        try {
            const accesses = ProfilesAssembler.toFamilyAccessesFromResponse(
                await profilesApi.getFamilyAccessByCode(invitationCode.trim().toUpperCase()));
            const invitation = accesses[0] ?? null;
            return invitation && invitation.canBeAccepted() ? invitation : null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    /**
     * Creates the family member profile and accepts the invitation (US31).
     * @param {Object} params - Registration data.
     * @param {number} params.userId - New IAM user.
     * @param {string} params.firstName - First name.
     * @param {string} params.lastName - Last name.
     * @param {string} params.phoneNumber - Phone number.
     * @param {FamilyAccess} params.invitation - Invitation to accept.
     * @returns {Promise<boolean>} True when the access is active.
     */
    async function registerFamilyMember({userId, firstName, lastName, phoneNumber, invitation}) {
        try {
            const response = await profilesApi.createFamilyMemberProfile({userId, firstName, lastName, phoneNumber});
            const accepted = ProfilesAssembler.toFamilyAccessFromResource({...invitation});
            accepted.accept(response.data.id);
            await profilesApi.updateFamilyAccess(ProfilesAssembler.toResourceFromFamilyAccess(accepted));
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.save');
            return false;
        }
    }

    /**
     * Creates the caregiver profile right after the account is created.
     * In the Vitalita API this will be a policy that reacts to CaregiverAccountRegistered.
     * @param {{userId: number, firstName: string, lastName: string}} data - Profile data.
     * @returns {Promise<boolean>} True when the profile was created.
     */
    async function createCaregiverProfile({userId, firstName, lastName}) {
        try {
            await profilesApi.createCaregiverProfile({
                userId, firstName, lastName, phoneNumber: '', professionalTitle: '', bio: '', photoUrl: '', certifications: []
            });
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    /**
     * Updates the professional profile of the caregiver (US35).
     * @param {import('../domain/model/caregiver-profile.entity.js').CaregiverProfile} profile - Profile with changes.
     * @returns {Promise<boolean>} True when it was updated.
     */
    async function updateCaregiverProfile(profile) {
        errors.value = [];
        if (!profile.firstName.trim() || !profile.lastName.trim()) {
            errors.value.push('profiles.errors.required-data');
            return false;
        }
        try {
            const response = await profilesApi.updateCaregiverProfile({...profile});
            caregiverProfile.value = ProfilesAssembler.toCaregiverProfileFromResource(response.data);
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.save');
            return false;
        }
    }

    /**
     * Loads the caregiver in charge of the selected older adult, for family members.
     */
    async function fetchResponsibleCaregiver() {
        const olderAdult = selectedOlderAdult.value;
        if (!olderAdult) return;
        try {
            const response = await profilesApi.getCaregiverProfileById(olderAdult.caregiverId);
            responsibleCaregiver.value = ProfilesAssembler.toCaregiverProfileFromResource(response.data);
        } catch (error) {
            console.error(error);
            errors.value.push('profiles.errors.load');
        }
    }

    return {
        olderAdults, caregiverProfile, familyMemberProfile, familyAccesses, familyMemberProfiles, responsibleCaregiver,
        errors, isLoading, olderAdultsLoaded, selectedOlderAdult, olderAdultsCount,
        initialize, addOlderAdult, updateOlderAdult, getOlderAdultById,
        fetchFamilyAccesses, getFamilyMemberName, inviteFamilyMember, revokeFamilyAccess,
        findValidInvitation, registerFamilyMember, createCaregiverProfile, updateCaregiverProfile, fetchResponsibleCaregiver
    };
});

export default useProfilesStore;
