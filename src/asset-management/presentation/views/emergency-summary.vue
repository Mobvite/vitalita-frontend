<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useIamStore from "../../../iam/application/iam.store.js";
import useAssetManagementStore from "../../application/asset-management.store.js";
import useSubscriptionsStore from "../../../subscriptions/application/subscriptions.store.js";
import useCareContextStore from "../../../shared/application/care-context.store.js";
import useMonitoringStore from "../../../monitoring/application/monitoring.store.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";

const {t} = useI18n();
const toast = useToast();
const iamStore = useIamStore();
const store = useAssetManagementStore();
const subscriptionsStore = useSubscriptionsStore();
const monitoringStore = useMonitoringStore();
const careContext = useCareContextStore();
const {formatDate, formatDateTime} = useDateFormat();
const isExporting = ref(false);

// The summary is rebuilt every time the monitoring data or the language changes
const summary = computed(() => {
  void monitoringStore.olderAdultId;
  return store.buildEmergencySummary(type => t(`monitoring.vital-types.${type}`));
});
const relationshipLabel = computed(() => summary.value?.emergencyContact.relationship
    ? t(`profiles.relationships.${summary.value.emergencyContact.relationship}`) : '');

async function load() {
  await store.prepareEmergencyData(iamStore.currentUserId, iamStore.isCaregiver);
}

async function exportPdf() {
  isExporting.value = true;
  const labels = {
    title: t('asset-management.emergency.title'), generatedAt: t('asset-management.emergency.generated-at'),
    patient: t('asset-management.emergency.patient'), age: t('asset-management.emergency.age'),
    bloodType: t('profiles.fields.blood-type'), allergies: t('profiles.fields.allergies'),
    chronicConditions: t('profiles.fields.chronic-conditions'), medications: t('asset-management.emergency.medications'),
    vitalSigns: t('asset-management.emergency.vital-signs'), recentExams: t('asset-management.emergency.recent-exams'),
    emergencyContact: t('profiles.fields.emergency-contact'), caregiver: t('asset-management.emergency.caregiver'),
    observations: t('profiles.fields.observations'), noRecords: t('common.no-records'),
    pendingResult: t('monitoring.records.no-result'), disclaimer: t('asset-management.emergency.disclaimer')
  };
  const exported = await store.exportEmergencyReport(summary.value, labels, formatDateTime, iamStore.currentUserId);
  if (exported) toast.add({severity: 'success', summary: t('asset-management.emergency.exported'), life: 3000});
  isExporting.value = false;
}

onMounted(load);
watch(() => careContext.selectedOlderAdultId, load);
</script>

<template>
  <section aria-labelledby="emergency-title">
    <div class="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h2 id="emergency-title" class="vt-page-title">{{ $t('asset-management.emergency.title') }}</h2>
        <p class="vt-page-subtitle">{{ $t('asset-management.emergency.subtitle') }}</p>
      </div>
      <pv-button :label="$t('asset-management.emergency.export')" icon="pi pi-file-pdf" :loading="isExporting"
                 :disabled="!summary || !subscriptionsStore.canExportPdf()" @click="exportPdf"/>
    </div>

    <pv-message v-if="summary && !subscriptionsStore.canExportPdf()" severity="info" class="mb-3">
      {{ $t('asset-management.errors.plan-pdf') }}
    </pv-message>
    <div aria-live="polite">
      <pv-message v-for="error in store.errors" :key="error" severity="error" class="mb-3">{{ $t(error) }}</pv-message>
    </div>

    <pv-skeleton v-if="store.isLoading" height="20rem"/>
    <p v-else-if="!summary" class="vt-card text-600">{{ $t('profiles.selector.no-access') }}</p>

    <div v-else class="grid">
      <div class="col-12 lg:col-8 flex flex-column gap-3">
        <article class="vt-card patient-banner">
          <h3 class="text-2xl text-white">{{ summary.patient.fullName }}</h3>
          <p class="m-0 mt-2">
            {{ $t('profiles.older-adults.age', {age: summary.patient.age}) }} · DNI {{ summary.patient.documentNumber || '—' }}
          </p>
          <p class="blood-type m-0 mt-3" :aria-label="`${$t('profiles.fields.blood-type')} ${summary.patient.bloodType}`">
            {{ summary.patient.bloodType || '—' }}
          </p>
        </article>

        <div class="grid">
          <div class="col-12 md:col-6">
            <article class="vt-card h-full alert-card">
              <h3 class="text-lg"><i class="pi pi-exclamation-triangle mr-2" aria-hidden="true"/>{{ $t('profiles.fields.allergies') }}</h3>
              <ul v-if="summary.allergies.length" class="mt-2 mb-0 pl-3"><li v-for="item in summary.allergies" :key="item" class="font-semibold">{{ item }}</li></ul>
              <p v-else class="text-600 mb-0">{{ $t('common.no-records') }}</p>
            </article>
          </div>
          <div class="col-12 md:col-6">
            <article class="vt-card h-full">
              <h3 class="text-lg">{{ $t('profiles.fields.chronic-conditions') }}</h3>
              <ul v-if="summary.chronicConditions.length" class="mt-2 mb-0 pl-3"><li v-for="item in summary.chronicConditions" :key="item">{{ item }}</li></ul>
              <p v-else class="text-600 mb-0">{{ $t('common.no-records') }}</p>
            </article>
          </div>
        </div>

        <article class="vt-card">
          <h3 class="text-lg mb-2">{{ $t('asset-management.emergency.medications') }}</h3>
          <ul v-if="summary.medications.length" class="list-none p-0 m-0 flex flex-column gap-2">
            <li v-for="medication in summary.medications" :key="medication.name" class="flex justify-content-between gap-2">
              <span class="font-semibold">{{ medication.name }} {{ medication.dosage }}</span>
              <span class="text-600">{{ medication.schedule }}</span>
            </li>
          </ul>
          <p v-else class="text-600 m-0">{{ $t('common.no-records') }}</p>
        </article>

        <article class="vt-card">
          <h3 class="text-lg mb-2">{{ $t('asset-management.emergency.vital-signs') }}</h3>
          <dl v-if="summary.vitalSigns.length" class="grid m-0">
            <div v-for="sign in summary.vitalSigns" :key="sign.type" class="col-12 sm:col-6 md:col-4">
              <dt class="text-sm text-600">{{ sign.type }}</dt>
              <dd class="m-0 text-xl font-bold">{{ sign.value }} <span class="text-sm font-normal">{{ sign.unit }}</span></dd>
              <dd class="m-0 text-xs text-500">{{ formatDateTime(sign.measuredAt) }}</dd>
            </div>
          </dl>
          <p v-else class="text-600 m-0">{{ $t('common.no-records') }}</p>
        </article>

        <article class="vt-card">
          <h3 class="text-lg mb-2">{{ $t('asset-management.emergency.recent-exams') }}</h3>
          <ul v-if="summary.recentExams.length" class="list-none p-0 m-0 flex flex-column gap-2">
            <li v-for="exam in summary.recentExams" :key="exam.examType + exam.performedAt">
              <p class="m-0 font-semibold">{{ exam.examType }} <span class="text-sm text-600 font-normal">· {{ formatDate(exam.performedAt) }}</span></p>
              <p class="m-0 text-sm">{{ exam.result || $t('monitoring.records.no-result') }}</p>
            </li>
          </ul>
          <p v-else class="text-600 m-0">{{ $t('common.no-records') }}</p>
        </article>
      </div>

      <div class="col-12 lg:col-4 flex flex-column gap-3">
        <article class="vt-card">
          <h3 class="text-lg mb-2">{{ $t('profiles.fields.emergency-contact') }}</h3>
          <template v-if="summary.emergencyContact.name">
            <p class="m-0 font-semibold">{{ summary.emergencyContact.name }}</p>
            <p class="m-0 text-sm text-600">{{ relationshipLabel }}</p>
            <a :href="`tel:${summary.emergencyContact.phoneNumber}`" class="call-link mt-3"
               :aria-label="$t('asset-management.emergency.call', {name: summary.emergencyContact.name})">
              <i class="pi pi-phone" aria-hidden="true"/> {{ summary.emergencyContact.phoneNumber }}
            </a>
          </template>
          <p v-else class="text-600 m-0">{{ $t('common.no-records') }}</p>
        </article>
        <article class="vt-card">
          <h3 class="text-lg mb-2">{{ $t('asset-management.emergency.caregiver') }}</h3>
          <template v-if="summary.caregiver.fullName">
            <p class="m-0 font-semibold">{{ summary.caregiver.fullName }}</p>
            <p class="m-0 text-sm text-600">{{ summary.caregiver.professionalTitle }}</p>
            <a v-if="summary.caregiver.phoneNumber" :href="`tel:${summary.caregiver.phoneNumber}`" class="text-primary text-sm font-semibold">
              {{ summary.caregiver.phoneNumber }}
            </a>
          </template>
          <p v-else class="text-600 m-0">{{ $t('common.no-records') }}</p>
        </article>
        <p class="text-xs text-600 m-0">{{ $t('asset-management.emergency.disclaimer') }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.patient-banner { background: var(--vt-primary); color: #D1FAE5; border: none; position: relative; }
.blood-type {
  position: absolute; top: 1.25rem; right: 1.25rem; background: #fff; color: #DC2626;
  font-size: 1.5rem; font-weight: 800; border-radius: 12px; padding: 0.5rem 0.9rem;
}
.alert-card { border-left: 4px solid #DC2626; }
.call-link {
  display: inline-flex; align-items: center; gap: 0.5rem; background: #DC2626; color: #fff;
  font-weight: 700; padding: 0.65rem 1rem; border-radius: 10px;
}
</style>
