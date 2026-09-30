import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {SubscriptionsApi} from "../infrastructure/subscription-api.js";
import {SubscriptionAssembler} from "../infrastructure/subscription.assembler.js";
import {PlanAssembler} from "../infrastructure/plan.assembler.js";
import {Plan} from "../domain/model/plan.entity.js";


const subscriptionsApi = new SubscriptionsApi();

/**
 * Application store for the Subscriptions and Payment Management context.
 *
 * Other contexts must only use canManageAnotherOlderAdult and
 * canInviteAnotherFamilyMember. They work as the Plan Entitlement Contract:
 * they answer yes or no without showing how billing works.
 */
const useSubscriptionsStore = defineStore('subscriptions', () => {
    const plans = ref([]);
    const currentSubscription = ref(null);
    const plansLoaded = ref(false);
    const subscriptionLoaded = ref(false);
    const errors = ref([]);

    /** Plan in use. Without an active subscription the free plan applies. */
    const currentPlan = computed(() => {
        const subscription = currentSubscription.value;
        if (!subscription || !subscription.isActive()) return Plan.freemium();
        return plans.value.find(plan => plan.id === subscription.planId) ?? Plan.freemium();
    });

    /** Loads the active plans. */
    async function fetchPlans() {
        try {
            const response = await subscriptionsApi.getPlans();
            plans.value = PlanAssembler.toEntitiesFromResponse(response);
            plansLoaded.value = true;
        } catch (error) {
            errors.value.push(error);
        }
    }

    /**
     * Loads the latest subscription of the user and the plans.
     * @param {number} userId - Signed-in user.
     */
    async function fetchCurrentSubscription(userId) {
        try {
            if (!plansLoaded.value) await fetchPlans();
            const response = await subscriptionsApi.getSubscriptionsByUserId(userId);
            const subscriptions = SubscriptionAssembler.toEntitiesFromResponse(response);
            currentSubscription.value = subscriptions.at(-1) ?? null;
            subscriptionLoaded.value = true;
        } catch (error) {
            errors.value.push(error);
        }
    }

    /**
     * Plan Entitlement Contract: can the caregiver add one more older adult?
     * @param {number} currentCount - Older adults already managed.
     * @returns {boolean} True when the plan allows it.
     */
    function canManageAnotherOlderAdult(currentCount) {
        return currentPlan.value.allowsAnotherOlderAdult(currentCount);
    }

    /**
     * Plan Entitlement Contract: can the caregiver invite one more family member?
     * @param {number} currentCount - Family members of the older adult.
     * @returns {boolean} True when the plan allows it.
     */
    function canInviteAnotherFamilyMember(currentCount) {
        return currentPlan.value.allowsAnotherFamilyMember(currentCount);
    }

    /** Plan Entitlement Contract: can the current plan export an emergency PDF? */
    function canExportPdf() {
        return currentPlan.value.pdfExport;
    }

    return {
        plans, currentSubscription, currentPlan, plansLoaded, subscriptionLoaded, errors,
        fetchPlans, fetchCurrentSubscription, canManageAnotherOlderAdult, canInviteAnotherFamilyMember, canExportPdf
    };
});

export default useSubscriptionsStore;
