<script setup>
import {computed, onMounted} from "vue";
import {useRouter} from "vue-router";
import useIamStore from "../../../iam/application/iam.store.js";
import useSubscriptionsStore from "../../application/subscriptions.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";

const router = useRouter();
const iamStore = useIamStore();
const store = useSubscriptionsStore();
const profilesStore = useProfilesStore();
const {formatDate, formatDateTime} = useDateFormat();

const subscription = computed(() => store.currentSubscription);
const status = computed(() => subscription.value?.effectiveStatus ?? 'Active');
const usage = computed(() => Math.min(100, Math.round((profilesStore.olderAdultsCount / store.currentPlan.maxOlderAdults) * 100)));
const statusSeverity = {Active: 'success', Expired: 'danger', Cancelled: 'secondary', PastDue: 'warn', Trial: 'info'};
const paymentSeverity = {Approved: 'success', Rejected: 'danger', Pending: 'warn', Cancelled: 'secondary'};

onMounted(async () => {
  await profilesStore.initialize(iamStore.currentUserId, iamStore.isCaregiver);
  await store.fetchCurrentSubscription(iamStore.currentUserId);
  await store.fetchPayments();
});
</script>

<template>
  <section aria-labelledby="subscription-title">
    <div class="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h2 id="subscription-title" class="vt-page-title">{{ $t('subscriptions.mine.title') }}</h2>
        <p class="vt-page-subtitle">{{ $t('subscriptions.mine.subtitle') }}</p>
      </div>
      <pv-button :label="$t('subscriptions.mine.change')" icon="pi pi-sync" outlined @click="router.push({name: 'subscriptions-plans'})"/>
    </div>

    <div class="grid">
      <div class="col-12 lg:col-5 flex flex-column gap-3">
        <article class="vt-card" aria-live="polite">
          <div class="flex align-items-center justify-content-between">
            <h3 class="text-xl">{{ $t(`subscriptions.plan-names.${store.currentPlan.type}`) }}</h3>
            <pv-tag :severity="statusSeverity[status]" :value="$t(`subscriptions.status.${status}`)"/>
          </div>
          <p class="text-2xl font-bold text-primary my-3">
            S/ {{ store.currentPlan.formattedPrice }}
            <span v-if="store.currentPlan.isPaid()" class="text-sm font-normal text-600">{{ $t(`subscriptions.plans.per-${store.currentPlan.billingPeriod}`) }}</span>
          </p>
          <p v-if="subscription?.endDate" class="m-0 text-sm">
            {{ $t(status === 'Expired' ? 'subscriptions.mine.expired-on' : 'subscriptions.mine.valid-until', {date: formatDate(subscription.endDate)}) }}
            <strong v-if="status === 'Active'"> · {{ $t('subscriptions.mine.days-left', {count: subscription.remainingDays}, subscription.remainingDays) }}</strong>
          </p>
          <p v-else class="m-0 text-sm text-600">{{ $t('subscriptions.mine.no-end') }}</p>
          <pv-message v-if="status === 'Expired'" severity="warn" class="mt-3">{{ $t('subscriptions.mine.expired-message') }}</pv-message>
        </article>

        <article class="vt-card">
          <h3 class="text-lg mb-3">{{ $t('subscriptions.mine.usage') }}</h3>
          <p class="m-0 mb-2 text-sm">{{ $t('subscriptions.mine.older-adults-usage', {count: profilesStore.olderAdultsCount, max: store.currentPlan.maxOlderAdults}) }}</p>
          <div class="usage-bar" role="progressbar" :aria-valuenow="profilesStore.olderAdultsCount" aria-valuemin="0"
               :aria-valuemax="store.currentPlan.maxOlderAdults" :aria-label="$t('subscriptions.mine.usage')">
            <span :style="{width: `${usage}%`}"/>
          </div>
        </article>
      </div>

      <div class="col-12 lg:col-7">
        <article class="vt-card">
          <h3 class="text-lg mb-3">{{ $t('subscriptions.mine.payments') }}</h3>
          <pv-data-table :value="store.payments" data-key="id" responsive-layout="stack" breakpoint="640px" :aria-label="$t('subscriptions.mine.payments')">
            <template #empty>{{ $t('subscriptions.mine.no-payments') }}</template>
            <pv-column :header="$t('monitoring.records.date')"><template #body="{data}">{{ formatDateTime(data.paidAt) }}</template></pv-column>
            <pv-column :header="$t('subscriptions.checkout.method')"><template #body="{data}">{{ $t(`subscriptions.methods.${data.paymentMethod}`) }}</template></pv-column>
            <pv-column :header="$t('subscriptions.checkout.total')"><template #body="{data}">S/ {{ data.amount.toFixed(2) }}</template></pv-column>
            <pv-column :header="$t('profiles.family.status')">
              <template #body="{data}"><pv-tag :severity="paymentSeverity[data.status]" :value="$t(`subscriptions.payment-status.${data.status}`)"/></template>
            </pv-column>
          </pv-data-table>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.usage-bar { height: 0.75rem; background: var(--vt-background); border-radius: 999px; overflow: hidden; border: 1px solid var(--vt-border); }
.usage-bar span { display: block; height: 100%; background: var(--vt-secondary); border-radius: 999px; }
</style>
