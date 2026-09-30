import {onMounted, watch} from "vue";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import useMonitoringStore from "../../../monitoring/application/monitoring.store.js";
import usePlanningStore from "../../application/planning.store.js";
import useCareContextStore from "../../../shared/application/care-context.store.js";

/**
 * Loads what the planning views need: the selected older adult, its monitoring
 * records and its reminders. For caregivers it also runs the automatic reminders policy.
 * @returns {{iamStore: Object, profilesStore: Object, planningStore: Object}} Stores used by the views.
 */
export function usePlanningData() {
    const iamStore = useIamStore();
    const profilesStore = useProfilesStore();
    const monitoringStore = useMonitoringStore();
    const planningStore = usePlanningStore();
    const careContext = useCareContextStore();

    async function load() {
        await profilesStore.initialize(iamStore.currentUserId, iamStore.isCaregiver);
        const olderAdultId = careContext.selectedOlderAdultId;
        await monitoringStore.fetchForOlderAdult(olderAdultId);
        await planningStore.fetchReminders(olderAdultId);
        if (iamStore.isCaregiver) await planningStore.syncAutomaticReminders(iamStore.currentUserId);
    }

    onMounted(load);
    watch(() => careContext.selectedOlderAdultId, load);

    return {iamStore, profilesStore, planningStore};
}
