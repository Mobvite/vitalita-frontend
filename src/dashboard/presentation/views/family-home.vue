<script setup>
import {computed, onMounted, watch} from "vue";
import {useI18n} from "vue-i18n";
import useDashboardStore from "../../application/dashboard.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import useMonitoringStore from "../../../monitoring/application/monitoring.store.js";
import useCareContextStore from "../../../shared/application/care-context.store.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";
import VitalSignCard from "../../../monitoring/presentation/components/vital-sign-card.vue";

const {t} = useI18n();
const store = useDashboardStore();
const profilesStore = useProfilesStore();
const monitoringStore = useMonitoringStore();
const careContext = useCareContextStore();
const {formatDateTime} = useDateFormat();

store.setTranslator(t);
const dashboard = computed(() => store.familyDashboard);
const recentEntries = computed(() => store.patientHistory.entries
    .filter(entry => new Date(entry.occurredAt) <= new Date()).slice(0, 4));

onMounted(store.load);
watch(() => careContext.selectedOlderAdultId, store.load);
</script>

<template>
  <section aria-labelledby="family-home-title">
    <h2 id="family-home-title" class="vt-page-title">{{ $t('dashboard.home.greeting', {name: profilesStore.familyMemberProfile?.firstName ?? ''}) }}</h2>
    <p class="vt-page-subtitle mb-4">{{ $t('dashboard.home.subtitle') }}</p>

    <pv-skeleton v-if="store.isLoading && !dashboard" height="16rem"/>
    <p v-else-if="!dashboard" class="vt-card text-600">{{ $t('profiles.selector.no-access') }}</p>

    <div v-else class="grid">
      <div class="col-12 xl:col-8 flex flex-column gap-3">
        <article class="vt-card" aria-live="polite">
          <div class="flex flex-wrap align-items-center justify-content-between gap-2">
            <h3 class="text-xl">{{ dashboard.olderAdultName }}</h3>
            <span v-if="dashboard.lastUpdateAt" class="vt-chip vt-chip--info">
              {{ $t('dashboard.home.last-update', {date: formatDateTime(dashboard.lastUpdateAt)}) }}
            </span>
          </div>
          <div class="flex flex-wrap gap-2 mt-3">
            <span v-if="dashboard.generalCondition" class="vt-chip">{{ $t(`monitoring.conditions.${dashboard.generalCondition}`) }}</span>
            <span v-if="dashboard.latestMood" class="vt-chip">{{ $t('monitoring.report.mood') }}: {{ $t(`monitoring.moods.${dashboard.latestMood}`) }}</span>
          </div>
          <p v-if="dashboard.latestReportText" class="mb-0 mt-3">{{ dashboard.latestReportText }}</p>
        </article>

        <div class="grid">
          <div class="col-12 md:col-4">
            <vital-sign-card type="HeartRate" icon="pi pi-heart-fill" tone="red" :sign="monitoringStore.latestVitalSigns.HeartRate"/>
          </div>
          <div class="col-12 md:col-4">
            <vital-sign-card type="BloodPressure" icon="pi pi-gauge" tone="blue" :sign="monitoringStore.latestVitalSigns.BloodPressure"/>
          </div>
          <div class="col-12 md:col-4">
            <vital-sign-card type="OxygenSaturation" icon="pi pi-cloud" tone="teal" :sign="monitoringStore.latestVitalSigns.OxygenSaturation"/>
          </div>
        </div>

        <article class="vt-card" aria-labelledby="latest-title">
          <div class="flex align-items-center justify-content-between mb-3">
            <h3 id="latest-title" class="text-lg">{{ $t('dashboard.home.latest') }}</h3>
            <router-link :to="{name: 'dashboard-history'}" class="text-sm font-semibold text-primary">{{ $t('dashboard.home.see-history') }}</router-link>
          </div>
          <ul class="list-none p-0 m-0 flex flex-column gap-3">
            <li v-for="entry in recentEntries" :key="entry.id">
              <p class="m-0 font-semibold text-sm">{{ entry.title }}</p>
              <p class="m-0 text-sm text-600">{{ entry.description }}</p>
              <p class="m-0 text-xs text-500">{{ formatDateTime(entry.occurredAt) }}</p>
            </li>
          </ul>
        </article>
      </div>

      <div class="col-12 xl:col-4 flex flex-column gap-3">
        <article class="vt-card">
          <h3 class="text-lg mb-3">{{ $t('dashboard.home.at-a-glance') }}</h3>
          <dl class="glance-list">
            <div><dt>{{ $t('dashboard.home.doses-today') }}</dt><dd>{{ dashboard.dosesGivenToday }} / {{ dashboard.dosesPlannedToday }}</dd></div>
            <div><dt>{{ $t('dashboard.home.pending-appointments') }}</dt><dd>{{ dashboard.pendingAppointments }}</dd></div>
            <div><dt>{{ $t('monitoring.records.stats.pending') }}</dt><dd>{{ dashboard.pendingExams }}</dd></div>
          </dl>
        </article>
        <router-link :to="{name: 'asset-management-emergency-summary'}" class="emergency-link">
          <i class="pi pi-exclamation-circle text-2xl" aria-hidden="true"/>
          <span>
            <strong class="block">{{ $t('asset-management.emergency.title') }}</strong>
            <span class="text-sm">{{ $t('dashboard.home.emergency-hint') }}</span>
          </span>
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.glance-list { margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.glance-list div { display: flex; justify-content: space-between; background: var(--vt-background); border-radius: 10px; padding: 0.6rem 0.8rem; }
.glance-list dt { color: var(--vt-text-secondary); font-size: 0.875rem; }
.glance-list dd { margin: 0; font-weight: 700; }
.emergency-link {
  display: flex; align-items: center; gap: 0.9rem; padding: 1rem 1.25rem; border-radius: var(--vt-radius);
  background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA;
}
.emergency-link:hover { background: #FEE2E2; }
</style>
