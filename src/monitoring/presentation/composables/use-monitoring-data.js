import {onMounted, watch} from "vue";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import useMonitoringStore from "../../application/monitoring.store.js";
import useCareContextStore from "../../../shared/application/care-context.store.js";

/**
 * Loads the monitoring records of the selected older adult and reloads them
 * when the user picks another patient in the side navigation.
 * @returns {{iamStore: Object, profilesStore: Object, monitoringStore: Object, careContext: Object}} Stores used by the views.
 */
export function useMonitoringData() {
    const iamStore = useIamStore();
    const profilesStore = useProfilesStore();
    const monitoringStore = useMonitoringStore();
    const careContext = useCareContextStore();

    async function load() {
        await profilesStore.initialize(iamStore.currentUserId, iamStore.isCaregiver);
        await monitoringStore.fetchForOlderAdult(careContext.selectedOlderAdultId);
    }

    onMounted(load);
    watch(() => careContext.selectedOlderAdultId, load);

    return {iamStore, profilesStore, monitoringStore, careContext};
}
