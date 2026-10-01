import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {SubscriptionsApi} from "../infrastructure/subscription-api.js";
import {PlanAssembler} from "../infrastructure/plan.assembler.js";
import {SubscriptionAssembler} from "../infrastructure/subscription.assembler.js";
import {Plan} from "../domain/model/plan.entity.js";
import {Subscription} from "../domain/model/subscription.entity.js";
import {Payment} from "../domain/model/payment.entity.js";
import {PaymentAssembler} from "../infrastructure/payment.assembler.js";
import {PaymentGateway} from "../infrastructure/payment-gateway.js";

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
    const subscriptions = ref([]);
    const payments = ref([]);
    const isProcessing = ref(false);

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
            subscriptions.value = SubscriptionAssembler.toEntitiesFromResponse(response);
            currentSubscription.value = subscriptions.value.filter(item => item.status !== 'Cancelled').at(-1) ?? null;
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

    /**
     * Plan Entitlement Contract: can the summary be exported to PDF (US37)?
     * @returns {boolean} True when the plan includes PDF export.
     */
    function canExportPdf() {
        return currentPlan.value.pdfExport;
    }

    /**
     * Loads the payments of every subscription of the user (US38).
     */
    async function fetchPayments() {
        const ids = subscriptions.value.map(subscription => subscription.id);
        if (ids.length === 0) {
            payments.value = [];
            return;
        }
        try {
            payments.value = PaymentAssembler.toEntitiesFromResponse(await subscriptionsApi.getPaymentsBySubscriptionIds(ids))
                .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
        } catch (error) {
            console.error(error);
            errors.value.push('subscriptions.errors.load');
        }
    }

    /**
     * Checks if the caregiver can move to a plan without breaking its limits (US28, scenario 2).
     * @param {Plan} plan - Target plan.
     * @param {number} olderAdultsCount - Older adults managed today.
     * @returns {boolean} True when the older adults fit in the new plan.
     */
    function canChangeTo(plan, olderAdultsCount) {
        return olderAdultsCount <= plan.maxOlderAdults;
    }

    /**
     * Replaces the current subscription with a new one for the plan.
     * @param {number} userId - Owner user.
     * @param {Plan} plan - New plan.
     * @returns {Promise<Subscription>} New subscription.
     */
    async function activate(userId, plan) {
        if (currentSubscription.value) {
            const previous = new Subscription({...currentSubscription.value});
            previous.cancel();
            await subscriptionsApi.updateSubscription(PaymentAssembler.toResource(previous));
        }
        const response = await subscriptionsApi.createSubscription(PaymentAssembler.toResource(Subscription.start(userId, plan)));
        const created = SubscriptionAssembler.toEntityFromResource(response.data);
        subscriptions.value.push(created);
        currentSubscription.value = created;
        return created;
    }

    /**
     * Pays a plan and activates it only when the gateway approves (US29).
     * A rejected payment is recorded, but the current plan does not change.
     * The free plan is activated without payment.
     * @param {Object} params - Checkout data.
     * @param {number} params.userId - Owner user.
     * @param {Plan} params.plan - Chosen plan.
     * @param {Object} params.gatewayData - Data for the gateway (card, Yape code or Culqi info).
     * @returns {Promise<'approved'|'rejected'|'error'>} Result of the checkout.
     */
    async function subscribe({userId, plan, gatewayData}) {
        errors.value = [];
        isProcessing.value = true;
        try {
            if (!plan.isPaid()) {
                await activate(userId, plan);
                return 'approved';
            }
            const result = PaymentGateway.isCulqiConfigured()
                ? await PaymentGateway.payWithCulqi({amountInCents: plan.priceInCents, ...gatewayData})
                : await PaymentGateway.payWithSimulator(gatewayData);
            const payment = new Payment({amount: plan.price, paymentMethod: result.paymentMethod});
            if (result.approved) {
                const subscription = await activate(userId, plan);
                payment.subscriptionId = subscription.id;
                payment.markApproved(result.transactionId);
            } else {
                payment.subscriptionId = currentSubscription.value?.id ?? null;
                payment.markRejected();
            }
            if (payment.subscriptionId) {
                const saved = await subscriptionsApi.createPayment(PaymentAssembler.toResource(payment));
                payments.value.unshift(new Payment({...saved.data}));
            }
            if (!result.approved) errors.value.push('subscriptions.errors.rejected');
            return result.approved ? 'approved' : 'rejected';
        } catch (error) {
            console.error(error);
            errors.value.push('subscriptions.errors.gateway');
            return 'error';
        } finally {
            isProcessing.value = false;
        }
    }

    return {
        plans, currentSubscription, currentPlan, plansLoaded, subscriptionLoaded, errors, subscriptions, payments, isProcessing,
        fetchPlans, fetchCurrentSubscription, fetchPayments, canManageAnotherOlderAdult, canInviteAnotherFamilyMember,
        canExportPdf, canChangeTo, subscribe
    };
});

export default useSubscriptionsStore;
