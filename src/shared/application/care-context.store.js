import {defineStore} from "pinia";
import {ref} from "vue";

const SELECTED_OLDER_ADULT_KEY = 'vitalita-selected-older-adult';

/**
 * Shared store that keeps the older adult selected in the application.
 * It only holds an identifier, so every bounded context can read it
 * without depending on the Profiles model.
 */
const useCareContextStore = defineStore('care-context', () => {
    const savedId = Number(localStorage.getItem(SELECTED_OLDER_ADULT_KEY));

    /** @type {import('vue').Ref<number|null>} Identifier of the selected older adult. */
    const selectedOlderAdultId = ref(savedId > 0 ? savedId : null);

    /**
     * Changes the selected older adult and remembers it after a page refresh.
     * @param {number|null} olderAdultId - Older adult identifier, or null to clear it.
     */
    function selectOlderAdult(olderAdultId) {
        selectedOlderAdultId.value = olderAdultId;
        if (olderAdultId) localStorage.setItem(SELECTED_OLDER_ADULT_KEY, String(olderAdultId));
        else localStorage.removeItem(SELECTED_OLDER_ADULT_KEY);
    }

    return {selectedOlderAdultId, selectOlderAdult};
});

export default useCareContextStore;
