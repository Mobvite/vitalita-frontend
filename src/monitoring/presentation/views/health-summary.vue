<script setup>
import {computed, ref} from "vue";
import {useMonitoringData} from "../../../shared/presentation/composables/use-monitoring-data.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";
import VitalSignCard from "../components/vital-sign-card.vue";
import HeartRateTrend from "../components/heart-rate-trend.vue";
import VitalSignsDialog from "../components/vital-signs-dialog.vue";
import MedicationSchedule from "../components/medication-schedule.vue";

const {iamStore, profilesStore, monitoringStore} = useMonitoringData();
const {formatDate, formatTime, formatDateTime} = useDateFormat();
const vitalsVisible = ref(false);

const greetingKey = computed(() => {
  const hour = new Date().getHours();
  return hour < 12 ? 'monitoring.summary.good-morning' : hour < 19 ? 'monitoring.summary.good-afternoon' : 'monitoring.summary.good-evening';
});
const patient = computed(() => profilesStore.selectedOlderAdult);
const recentActivity = computed(() => monitoringStore.sortedCareActivities.slice(0, 3));
const today = computed(() => formatDate(new Date(), {weekday: 'long', day: 'numeric', month: 'long'}));
</script>

<template>
  <section aria-labelledby="summary-title">
    <div class="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h2 id="summary-title" class="vt-page-title">
          {{ $t(greetingKey, {name: profilesStore.caregiverProfile?.firstName ?? ''}) }}
        </h2>
        <p class="vt-page-subtitle">{{ $t('monitoring.summary.subtitle') }}</p>
      </div>
      <div class="flex align-items-center gap-2">
        <span class="vt-chip">{{ today }}</span>
        <pv-button :label="$t('monitoring.vitals.title')" icon="pi pi-heart" :disabled="!patient" @click="vitalsVisible = true"/>
      </div>
    </div>

    <p v-if="!patient && !profilesStore.isLoading" class="vt-card text-600">{{ $t('profiles.selector.register-first') }}</p>

    <div v-else class="grid">
      <div class="col-12 xl:col-8 flex flex-column gap-3">
        <article class="vt-card flex align-items-center gap-3" aria-live="polite">
          <pv-avatar :label="patient?.initials" size="xlarge" shape="circle" class="patient-avatar" aria-hidden="true"/>
          <div>
            <h3 class="text-xl">{{ patient?.fullName }}</h3>
            <p class="m-0 text-sm text-600">
              {{ $t('profiles.older-adults.age', {age: patient?.age}) }} · DNI {{ patient?.documentNumber || '—' }}
              · {{ $t('profiles.fields.blood-type') }} {{ patient?.bloodType || '—' }}
            </p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span v-if="monitoringStore.latestDailyReport" class="vt-chip">
                {{ $t(`monitoring.conditions.${monitoringStore.latestDailyReport.generalCondition}`) }}
              </span>
              <span v-if="monitoringStore.latestDailyReport" class="vt-chip vt-chip--info">
                {{ $t('monitoring.summary.last-report', {date: formatDate(monitoringStore.latestDailyReport.reportDate)}) }}
              </span>
            </div>
          </div>
        </article>

        <div class="grid">
          <div class="col-12 md:col-4">
            <vital-sign-card type="HeartRate" icon="pi pi-heart-fill" tone="red" :sign="monitoringStore.latestVitalSigns.HeartRate"/>
          </div>
          <div class="col-12 md:col-4">
            <vital-sign-card type="Temperature" icon="pi pi-sun" tone="orange" :sign="monitoringStore.latestVitalSigns.Temperature"/>
          </div>
          <div class="col-12 md:col-4">
            <vital-sign-card type="BloodPressure" icon="pi pi-gauge" tone="blue" :sign="monitoringStore.latestVitalSigns.BloodPressure"/>
          </div>
        </div>

        <div class="grid">
          <div class="col-12 lg:col-7">
            <article class="vt-card h-full" aria-labelledby="trend-title">
              <h3 id="trend-title" class="text-lg">{{ $t('monitoring.summary.trend') }}</h3>
              <p class="text-sm text-600 mt-1">{{ $t('monitoring.summary.trend-subtitle') }}</p>
              <heart-rate-trend :signs="monitoringStore.heartRateTrend"/>
            </article>
          </div>
          <div class="col-12 lg:col-5">
            <article class="vt-card h-full" aria-labelledby="activity-title">
              <h3 id="activity-title" class="text-lg mb-3">{{ $t('monitoring.summary.recent-activity') }}</h3>
              <ul class="list-none p-0 m-0 flex flex-column gap-3">
                <li v-for="activity in recentActivity" :key="activity.id">
                  <p class="m-0 text-sm font-semibold text-primary">{{ $t(`monitoring.activity-types.${activity.activityType}`) }}</p>
                  <p class="m-0 text-sm text-600">{{ activity.description }}</p>
                  <p class="m-0 text-xs text-500">{{ formatDateTime(activity.performedAt) }}</p>
                </li>
              </ul>
              <router-link :to="{name: 'monitoring-notes'}" class="text-sm font-semibold text-primary mt-3 inline-block">
                {{ $t('monitoring.summary.see-notes') }}
              </router-link>
            </article>
          </div>
        </div>

        <article class="vt-card" aria-labelledby="next-appointment-title">
          <h3 id="next-appointment-title" class="text-lg mb-3">{{ $t('monitoring.summary.next-appointment') }}</h3>
          <div v-if="monitoringStore.nextAppointment" class="flex align-items-center gap-3">
            <div class="date-badge" aria-hidden="true">
              <span class="text-2xl font-bold">{{ new Date(monitoringStore.nextAppointment.scheduledAt).getDate() }}</span>
              <span class="text-xs uppercase">{{ formatDate(monitoringStore.nextAppointment.scheduledAt, {month: 'short'}) }}</span>
            </div>
            <div>
              <p class="m-0 font-semibold">{{ monitoringStore.nextAppointment.specialty }}</p>
              <p class="m-0 text-sm text-600">
                {{ formatDateTime(monitoringStore.nextAppointment.scheduledAt) }} · {{ monitoringStore.nextAppointment.location }}
                · {{ monitoringStore.nextAppointment.doctorName }}
              </p>
            </div>
          </div>
          <p v-else class="m-0 text-sm text-600">{{ $t('monitoring.summary.no-appointment') }}</p>
        </article>
      </div>

      <div class="col-12 xl:col-4">
        <medication-schedule :older-adult-id="patient?.id ?? null" :read-only="!iamStore.isCaregiver"/>
      </div>
    </div>

    <vital-signs-dialog v-model:visible="vitalsVisible" :older-adult-id="patient?.id ?? null"/>
  </section>
</template>

<style scoped>
.patient-avatar { background: var(--vt-mint); color: var(--vt-primary); font-weight: 700; }
.date-badge {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 4rem; height: 4rem; border-radius: 12px; background: var(--vt-primary); color: #fff;
}
</style>
