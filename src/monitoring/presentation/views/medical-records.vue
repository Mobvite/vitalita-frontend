<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useMonitoringData} from "../../../shared/presentation/composables/use-monitoring-data.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";
import ExamDialog from "../components/exam-dialog.vue";
import AppointmentDialog from "../components/appointment-dialog.vue";

const {t} = useI18n();
const {iamStore, profilesStore, monitoringStore} = useMonitoringData();
const {formatDate, formatDateTime} = useDateFormat();

const section = ref('exams');
const search = ref('');
const category = ref(null);
const examDialog = ref(false);
const appointmentDialog = ref(false);
const selectedExam = ref(null);
const selectedAppointment = ref(null);

const sectionOptions = computed(() => [
  {label: t('monitoring.records.exams'), value: 'exams'},
  {label: t('monitoring.records.appointments'), value: 'appointments'}
]);
const categoryOptions = computed(() => ['Laboratory', 'MedicalImaging', 'Report']
    .map(value => ({label: t(`monitoring.exam-categories.${value}`), value})));
const filteredExams = computed(() => monitoringStore.sortedExams.filter(exam => {
  const text = `${exam.examType} ${exam.resultSummary}`.toLowerCase();
  return text.includes(search.value.toLowerCase()) && (!category.value || exam.category === category.value);
}));
const stats = computed(() => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return {
    total: monitoringStore.exams.length,
    recent: monitoringStore.exams.filter(exam => exam.status === 'Completed' && new Date(exam.performedAt) >= thirtyDaysAgo).length,
    pending: monitoringStore.exams.filter(exam => exam.isPending()).length
  };
});
const examSeverity = {Completed: 'success', PendingResult: 'warn', Requested: 'info'};
const appointmentSeverity = {Completed: 'success', Scheduled: 'info', Cancelled: 'secondary'};

function openNewExam() { selectedExam.value = null; examDialog.value = true; }
function openExamResult(exam) { selectedExam.value = exam; examDialog.value = true; }
function openNewAppointment() { selectedAppointment.value = null; appointmentDialog.value = true; }
function openAppointmentOutcome(appointment) { selectedAppointment.value = appointment; appointmentDialog.value = true; }
</script>

<template>
  <section aria-labelledby="records-title">
    <div class="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h2 id="records-title" class="vt-page-title">{{ $t('monitoring.records.heading') }}</h2>
        <p class="vt-page-subtitle">{{ $t('monitoring.records.subtitle', {name: profilesStore.selectedOlderAdult?.fullName ?? ''}) }}</p>
      </div>
      <div v-if="iamStore.isCaregiver" class="flex gap-2">
        <pv-button v-if="section === 'exams'" :label="$t('monitoring.records.new-exam')" icon="pi pi-plus" @click="openNewExam"/>
        <pv-button v-else :label="$t('monitoring.records.new-appointment')" icon="pi pi-plus" @click="openNewAppointment"/>
      </div>
    </div>

    <pv-select-button v-model="section" :options="sectionOptions" option-label="label" option-value="value"
                      :allow-empty="false" class="mb-3" :aria-label="$t('monitoring.records.section')"/>

    <template v-if="section === 'exams'">
      <div class="grid mb-2">
        <div v-for="item in [['total', 'teal'], ['recent', 'blue'], ['pending', 'orange']]" :key="item[0]" class="col-12 md:col-4">
          <article class="vt-card flex align-items-center gap-3">
            <span class="stat-number" :class="`stat--${item[1]}`">{{ stats[item[0]] }}</span>
            <p class="m-0 font-semibold">{{ $t(`monitoring.records.stats.${item[0]}`) }}</p>
          </article>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-3">
        <pv-icon-field class="flex-1">
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text v-model="search" :placeholder="$t('monitoring.records.search')" class="w-full" :aria-label="$t('monitoring.records.search')"/>
        </pv-icon-field>
        <pv-select v-model="category" :options="categoryOptions" option-label="label" option-value="value" show-clear
                   :placeholder="$t('monitoring.records.all-types')" :aria-label="$t('monitoring.records.category')"/>
      </div>

      <div class="vt-card">
        <pv-data-table :value="filteredExams" :loading="monitoringStore.isLoading" data-key="id" paginator :rows="6"
                       responsive-layout="stack" breakpoint="768px" :aria-label="$t('monitoring.records.exams')">
          <template #empty>{{ $t('common.no-records') }}</template>
          <pv-column field="examType" :header="$t('monitoring.records.exam-type')" sortable>
            <template #body="{data}">
              <p class="m-0 font-semibold">{{ data.examType }}</p>
              <p class="m-0 text-sm text-600">{{ data.resultSummary || $t('monitoring.records.no-result') }}</p>
            </template>
          </pv-column>
          <pv-column :header="$t('monitoring.records.category')">
            <template #body="{data}">{{ $t(`monitoring.exam-categories.${data.category}`) }}</template>
          </pv-column>
          <pv-column field="performedAt" :header="$t('monitoring.records.date')" sortable>
            <template #body="{data}">{{ formatDate(data.performedAt) }}</template>
          </pv-column>
          <pv-column :header="$t('profiles.family.status')">
            <template #body="{data}"><pv-tag :severity="examSeverity[data.status]" :value="$t(`monitoring.exam-status.${data.status}`)"/></template>
          </pv-column>
          <pv-column v-if="iamStore.isCaregiver" :header="$t('common.actions')">
            <template #body="{data}">
              <pv-button v-if="data.isPending()" icon="pi pi-file-check" text rounded
                         :aria-label="$t('monitoring.records.register-result-for', {name: data.examType})"
                         v-tooltip.top="$t('monitoring.records.register-result')" @click="openExamResult(data)"/>
            </template>
          </pv-column>
        </pv-data-table>
      </div>
    </template>

    <div v-else class="vt-card">
      <pv-data-table :value="monitoringStore.sortedAppointments" :loading="monitoringStore.isLoading" data-key="id" paginator :rows="6"
                     responsive-layout="stack" breakpoint="768px" :aria-label="$t('monitoring.records.appointments')">
        <template #empty>{{ $t('common.no-records') }}</template>
        <pv-column :header="$t('monitoring.records.specialty')">
          <template #body="{data}">
            <p class="m-0 font-semibold">{{ data.specialty }}</p>
            <p class="m-0 text-sm text-600">{{ data.doctorName }} · {{ data.location }}</p>
          </template>
        </pv-column>
        <pv-column :header="$t('monitoring.records.date')">
          <template #body="{data}">{{ formatDateTime(data.scheduledAt) }}</template>
        </pv-column>
        <pv-column :header="$t('monitoring.records.result')">
          <template #body="{data}">
            <p class="m-0 text-sm">{{ data.result || '—' }}</p>
            <p v-if="data.observations" class="m-0 text-xs text-600">{{ data.observations }}</p>
          </template>
        </pv-column>
        <pv-column :header="$t('profiles.family.status')">
          <template #body="{data}"><pv-tag :severity="appointmentSeverity[data.status]" :value="$t(`monitoring.appointment-status.${data.status}`)"/></template>
        </pv-column>
        <pv-column v-if="iamStore.isCaregiver" :header="$t('common.actions')">
          <template #body="{data}">
            <pv-button v-if="data.status === 'Scheduled'" icon="pi pi-check-square" text rounded
                       :aria-label="$t('monitoring.records.register-outcome-for', {name: data.specialty})"
                       v-tooltip.top="$t('monitoring.records.register-outcome')" @click="openAppointmentOutcome(data)"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <exam-dialog v-model:visible="examDialog" :older-adult-id="profilesStore.selectedOlderAdult?.id ?? null" :exam="selectedExam"/>
    <appointment-dialog v-model:visible="appointmentDialog" :older-adult-id="profilesStore.selectedOlderAdult?.id ?? null"
                        :appointment="selectedAppointment"/>
  </section>
</template>

<style scoped>
.stat-number { width: 2.75rem; height: 2.75rem; border-radius: 10px; display: grid; place-items: center; font-weight: 700; font-size: 1.25rem; }
.stat--teal { background: var(--vt-mint); color: var(--vt-primary); }
.stat--blue { background: var(--vt-info); color: #0369A1; }
.stat--orange { background: #FFEDD5; color: #C2410C; }
</style>
