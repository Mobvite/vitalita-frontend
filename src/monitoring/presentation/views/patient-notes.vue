<script setup>
import {computed, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import {useMonitoringData} from "../../../shared/presentation/composables/use-monitoring-data.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";
import {CareActivity} from "../../domain/model/care-activity.entity.js";
import {CareActivityType} from "../../domain/model/care-activity-type.js";
import DailyReportDialog from "../components/daily-report-dialog.vue";

const {t} = useI18n();
const toast = useToast();
const {iamStore, profilesStore, monitoringStore} = useMonitoringData();
const {formatDateTime} = useDateFormat();

const PAGE_SIZE = 5;
const filter = ref('All');
const first = ref(0);
const reportVisible = ref(false);
const note = reactive({activityType: CareActivityType.OBSERVATION, description: ''});

const typeOptions = computed(() => Object.values(CareActivityType)
    .map(value => ({label: t(`monitoring.activity-types.${value}`), value})));
const filterOptions = computed(() => [{label: t('monitoring.notes.all'), value: 'All'}, ...typeOptions.value]);
const filteredNotes = computed(() => monitoringStore.sortedCareActivities
    .filter(activity => filter.value === 'All' || activity.activityType === filter.value));
const pagedNotes = computed(() => filteredNotes.value.slice(first.value, first.value + PAGE_SIZE));
const notesToday = computed(() => monitoringStore.careActivities
    .filter(activity => new Date(activity.performedAt).toDateString() === new Date().toDateString()).length);
const dosesGiven = computed(() => monitoringStore.todayDoses.filter(dose => dose.given).length);
const typeColor = {Observation: 'teal', Medication: 'orange', Feeding: 'blue', Symptom: 'red', Therapy: 'purple'};

async function saveNote() {
  const activity = new CareActivity({
    ...note, olderAdultId: profilesStore.selectedOlderAdult?.id, recordedByUserId: iamStore.currentUserId
  });
  if (await monitoringStore.addCareActivity(activity)) {
    toast.add({severity: 'success', summary: t('monitoring.notes.saved'), life: 3000});
    note.description = '';
    first.value = 0;
  }
}
</script>

<template>
  <section aria-labelledby="notes-title">
    <h2 id="notes-title" class="vt-page-title">{{ $t('monitoring.notes.heading') }}</h2>
    <p class="vt-page-subtitle mb-4">{{ $t('monitoring.notes.subtitle') }}</p>

    <div class="grid">
      <div class="col-12 xl:col-8 flex flex-column gap-3">
        <form v-if="iamStore.isCaregiver" class="vt-card flex flex-column gap-3" novalidate @submit.prevent="saveNote">
          <h3 class="text-lg">{{ $t('monitoring.notes.new') }}</h3>
          <div class="flex flex-column gap-2 md:w-4">
            <label for="note-category" class="text-sm font-medium">{{ $t('monitoring.records.category') }}</label>
            <pv-select input-id="note-category" v-model="note.activityType" :options="typeOptions" option-label="label" option-value="value"/>
          </div>
          <label for="note-description" class="sr-only">{{ $t('monitoring.notes.placeholder') }}</label>
          <pv-textarea id="note-description" v-model="note.description" rows="3" auto-resize
                       :placeholder="$t('monitoring.notes.placeholder')" aria-required="true"/>
          <div aria-live="polite">
            <pv-message v-for="error in monitoringStore.errors" :key="error" severity="error">{{ $t(error) }}</pv-message>
          </div>
          <div class="flex justify-content-end">
            <pv-button type="submit" :label="$t('monitoring.notes.save')" icon="pi pi-check"/>
          </div>
        </form>

        <pv-select-button v-model="filter" :options="filterOptions" option-label="label" option-value="value"
                          :allow-empty="false" class="flex-wrap" :aria-label="$t('monitoring.notes.filter')" @change="first = 0"/>

        <article class="vt-card" aria-labelledby="history-title">
          <h3 id="history-title" class="text-lg mb-3">{{ $t('monitoring.notes.history') }}</h3>
          <p v-if="!filteredNotes.length" class="text-600 m-0">{{ $t('common.no-records') }}</p>
          <ol v-else class="timeline">
            <li v-for="activity in pagedNotes" :key="activity.id" class="timeline-item">
              <span class="timeline-dot" :class="`dot--${typeColor[activity.activityType]}`" aria-hidden="true"/>
              <div class="flex flex-wrap align-items-center gap-2">
                <span class="text-xs text-600">{{ formatDateTime(activity.performedAt) }}</span>
                <span class="type-chip" :class="`chip--${typeColor[activity.activityType]}`">
                  {{ $t(`monitoring.activity-types.${activity.activityType}`) }}
                </span>
              </div>
              <p class="mt-1 mb-0">{{ activity.description }}</p>
            </li>
          </ol>
          <pv-paginator v-if="filteredNotes.length > PAGE_SIZE" v-model:first="first" :rows="PAGE_SIZE"
                        :total-records="filteredNotes.length" :aria-label="$t('monitoring.notes.pages')"/>
        </article>
      </div>

      <div class="col-12 xl:col-4 flex flex-column gap-3">
        <article class="vt-card" aria-labelledby="today-title">
          <h3 id="today-title" class="text-lg mb-3">{{ $t('monitoring.notes.today-summary') }}</h3>
          <dl class="summary-list">
            <div><dt>{{ $t('monitoring.notes.notes-today') }}</dt><dd>{{ notesToday }}</dd></div>
            <div><dt>{{ $t('monitoring.notes.medications') }}</dt><dd>{{ dosesGiven }} / {{ monitoringStore.todayDoses.length }}</dd></div>
            <div>
              <dt>{{ $t('monitoring.report.condition') }}</dt>
              <dd>{{ monitoringStore.latestDailyReport ? $t(`monitoring.conditions.${monitoringStore.latestDailyReport.generalCondition}`) : '—' }}</dd>
            </div>
            <div>
              <dt>{{ $t('monitoring.report.mood') }}</dt>
              <dd>{{ monitoringStore.latestDailyReport ? $t(`monitoring.moods.${monitoringStore.latestDailyReport.mood}`) : '—' }}</dd>
            </div>
          </dl>
          <pv-button v-if="iamStore.isCaregiver" :label="$t('monitoring.report.title')" icon="pi pi-clipboard"
                     outlined class="w-full mt-3" @click="reportVisible = true"/>
        </article>
        <aside class="tip-card" aria-labelledby="tip-title">
          <h3 id="tip-title" class="text-base text-primary">{{ $t('monitoring.notes.tip-title') }}</h3>
          <p class="m-0 mt-2 text-sm">{{ $t('monitoring.notes.tip-text') }}</p>
        </aside>
      </div>
    </div>

    <daily-report-dialog v-model:visible="reportVisible" :older-adult-id="profilesStore.selectedOlderAdult?.id ?? null"
                         :user-id="iamStore.currentUserId"/>
  </section>
</template>

<style scoped>
.timeline { list-style: none; padding: 0 0 0 1.25rem; margin: 0; border-left: 2px solid var(--vt-border); }
.timeline-item { position: relative; padding: 0 0 1.25rem 0.75rem; }
.timeline-dot { position: absolute; left: -1.95rem; top: 0.25rem; width: 0.75rem; height: 0.75rem; border-radius: 50%; }
.type-chip { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.55rem; border-radius: 999px; }
.dot--teal { background: var(--vt-primary); } .chip--teal { background: var(--vt-mint); color: var(--vt-primary); }
.dot--orange { background: var(--vt-alert); } .chip--orange { background: #FFEDD5; color: #C2410C; }
.dot--blue { background: #0284C7; } .chip--blue { background: var(--vt-info); color: #0369A1; }
.dot--red { background: #DC2626; } .chip--red { background: #FEE2E2; color: #B91C1C; }
.dot--purple { background: #7C3AED; } .chip--purple { background: #EDE9FE; color: #6D28D9; }
.summary-list { margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.summary-list div { display: flex; justify-content: space-between; background: var(--vt-background); border-radius: 10px; padding: 0.6rem 0.8rem; }
.summary-list dt { color: var(--vt-text-secondary); font-size: 0.875rem; }
.summary-list dd { margin: 0; font-weight: 600; }
.tip-card { background: var(--vt-mint); border-radius: var(--vt-radius); padding: 1rem 1.25rem; }
</style>
