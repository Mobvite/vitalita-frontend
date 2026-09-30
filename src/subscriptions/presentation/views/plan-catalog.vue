<script setup>
import {computed, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useIamStore from "../../../iam/application/iam.store.js";
import useSubscriptionsStore from "../../application/subscriptions.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

const router = useRouter();
const {t} = useI18n();
const iamStore = useIamStore();
const store = useSubscriptionsStore();
const profilesStore = useProfilesStore();
const billingPeriod = ref('Monthly');

const periodOptions = computed(() => [
  {label: t('subscriptions.plans.monthly'), value: 'Monthly'},
  {label: t('subscriptions.plans.annual'), value: 'Annual'}
]);
const visiblePlans = computed(() => store.plans.filter(plan => !plan.isPaid() || plan.billingPeriod === billingPeriod.value));

function features(plan) {
  return [
    {key: 'subscriptions.features.older-adults', params: {count: plan.maxOlderAdults}, included: true},
    {key: plan.maxFamilyMembers === null ? 'subscriptions.features.family-unlimited' : 'subscriptions.features.family', params: {count: plan.maxFamilyMembers}, included: true},
    {key: 'subscriptions.features.follow-up', params: {}, included: true},
    {key: 'subscriptions.features.emergency-screen', params: {}, included: true},
    {key: 'subscriptions.features.pdf', params: {}, included: plan.pdfExport},
    {key: 'subscriptions.features.email-reminders', params: {}, included: plan.emailReminders},
    {key: 'subscriptions.features.storage', params: {size: plan.maxStorageMb >= 1024 ? `${plan.maxStorageMb / 1024} GB` : `${plan.maxStorageMb} MB`}, included: true}
  ];
}

const isCurrent = (plan) => store.currentSubscription?.isActive() ? store.currentSubscription.planId === plan.id : !plan.isPaid();
const fits = (plan) => store.canChangeTo(plan, profilesStore.olderAdultsCount);

onMounted(async () => {
  await profilesStore.initialize(iamStore.currentUserId, iamStore.isCaregiver);
  await store.fetchCurrentSubscription(iamStore.currentUserId);
});
</script>

<template>
  <section aria-labelledby="plans-title">
    <div class="text-center mb-4">
      <h2 id="plans-title" class="vt-page-title">{{ $t('subscriptions.plans.heading') }}</h2>
      <p class="vt-page-subtitle">{{ $t('subscriptions.plans.subtitle') }}</p>
      <pv-select-button v-model="billingPeriod" :options="periodOptions" option-label="label" option-value="value"
                        :allow-empty="false" class="mt-3" :aria-label="$t('subscriptions.plans.period')"/>
      <p v-if="billingPeriod === 'Annual'" class="text-sm text-primary font-semibold mt-2">{{ $t('subscriptions.plans.annual-saving') }}</p>
    </div>

    <ul class="grid list-none p-0 m-0">
      <li v-for="plan in visiblePlans" :key="plan.id" class="col-12 md:col-4">
        <article class="vt-card h-full flex flex-column plan-card" :class="{'plan-card--featured': plan.type === 'Pro'}" :aria-labelledby="`plan-${plan.id}`">
          <span v-if="plan.type === 'Pro'" class="featured-label">{{ $t('subscriptions.plans.recommended') }}</span>
          <h3 :id="`plan-${plan.id}`" class="text-xl">{{ $t(`subscriptions.plan-names.${plan.type}`) }}</h3>
          <p class="plan-price">
            S/ {{ plan.formattedPrice }}
            <span class="text-sm font-normal text-600">{{ plan.isPaid() ? $t(`subscriptions.plans.per-${plan.billingPeriod}`) : '' }}</span>
          </p>
          <ul class="list-none p-0 m-0 flex flex-column gap-2 flex-1">
            <li v-for="feature in features(plan)" :key="feature.key" class="flex align-items-center gap-2 text-sm" :class="{'text-400': !feature.included}">
              <i :class="feature.included ? 'pi pi-check-circle text-primary' : 'pi pi-minus-circle'" aria-hidden="true"/>
              <span>
                <span class="sr-only">{{ feature.included ? $t('subscriptions.plans.included') : $t('subscriptions.plans.not-included') }}:</span>
                {{ $t(feature.key, feature.params) }}
              </span>
            </li>
          </ul>
          <pv-tag v-if="isCurrent(plan)" :value="$t('subscriptions.plans.current')" class="mt-4 align-self-center"/>
          <template v-else>
            <pv-button :label="$t('subscriptions.plans.choose')" class="mt-4" :disabled="!fits(plan)"
                       :outlined="plan.type !== 'Pro'" @click="router.push({name: 'subscriptions-checkout', params: {planId: plan.id}})"/>
            <small v-if="!fits(plan)" class="text-center mt-2 text-600">
              {{ $t('subscriptions.plans.does-not-fit', {count: profilesStore.olderAdultsCount, max: plan.maxOlderAdults}) }}
            </small>
          </template>
        </article>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.plan-card { position: relative; }
.plan-card--featured { border: 2px solid var(--vt-primary); }
.featured-label {
  position: absolute; top: -0.75rem; left: 50%; transform: translateX(-50%);
  background: var(--vt-primary); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 999px;
}
.plan-price { font-size: 2rem; font-weight: 800; margin: 0.75rem 0 1.25rem; color: var(--vt-primary); }
</style>
