<script setup>
import {computed, onMounted, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useDashboardStore from "../../application/dashboard.store.js";
import useCareContextStore from "../../../shared/application/care-context.store.js";
import {HistoryEntryType} from "../../domain/model/history-entry-type.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";

const {t} = useI18n();
const store = useDashboardStore();
const careContext = useCareContextStore();
const {formatDateTime} = useDateFormat();

store.setTranslator(t);
const PAGE_SIZE = 8;
const first = ref(0);
const filters = reactive({types: [], range: null, keyword: ''});

const typeOptions = computed(() => Object.values(HistoryEntryType)
    .map(value => ({label: t(`dashboard.types.${value}`), value})));
const results = computed(() => store.patientHistory.filter({
  types: filters.types,
  from: filters.range?.[0] ?? null,
  to: filters.range?.[1] ?? filters.range?.[0] ?? null,
  keyword: filters.keyword
}));
const pagedResults = computed(() => results.value.slice(first.value, first.value + PAGE_SIZE));
const typeIcon = {DailyReport: 'pi-clipboard', VitalSign: 'pi-heart', Medication: 'pi-box', Appointment: 'pi-calendar', Exam: 'pi-folder', CareActivity: 'pi-pencil'};

function clearFilters() {
  Object.assign(filters, {types: [], range: null, keyword: ''});
}

watch(filters, () => first.value = 0);
onMounted(store.load);
watch(() => careContext.selectedOlderAdultId, store.load);
</script>

<template>
  <section aria-labelledby="history-title">
    <h2 id="history-title" class="vt-page-title">{{ $t('dashboard.history.title') }}</h2>
    <p class="vt-page-subtitle mb-4">{{ $t('dashboard.history.subtitle') }}</p>

    <form class="vt-card grid mb-3" role="search" :aria-label="$t('dashboard.history.filters')" @submit.prevent>
      <div class="col-12 md:col-4 flex flex-column gap-2">
        <label for="history-keyword" class="text-sm font-medium">{{ $t('dashboard.history.keyword') }}</label>
        <pv-icon-field>
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text id="history-keyword" v-model="filters.keyword" class="w-full" :placeholder="$t('dashboard.history.keyword-placeholder')"/>
        </pv-icon-field>
      </div>
      <div class="col-12 md:col-4 flex flex-column gap-2">
        <label for="history-range" class="text-sm font-medium">{{ $t('dashboard.history.range') }}</label>
        <pv-date-picker input-id="history-range" v-model="filters.range" selection-mode="range" date-format="dd/mm/yy" show-icon show-button-bar/>
      </div>
      <div class="col-12 md:col-4 flex align-items-end">
        <pv-button :label="$t('dashboard.history.clear')" icon="pi pi-filter-slash" text @click="clearFilters"/>
      </div>
      <div class="col-12">
        <pv-select-button v-model="filters.types" :options="typeOptions" option-label="label" option-value="value"
                          multiple class="flex-wrap" :aria-label="$t('dashboard.history.types')"/>
      </div>
    </form>

    <article class="vt-card" aria-live="polite">
      <p class="text-sm text-600 mt-0">{{ $t('dashboard.history.count', {count: results.length}, results.length) }}</p>
      <p v-if="!results.length" class="m-0">{{ $t('dashboard.history.empty') }}</p>
      <ol v-else class="list-none p-0 m-0 flex flex-column gap-2">
        <li v-for="entry in pagedResults" :key="entry.id" class="history-row">
          <span class="history-icon" aria-hidden="true"><i :class="['pi', typeIcon[entry.type]]"/></span>
          <div class="flex-1">
            <p class="m-0 font-semibold">{{ entry.title }}</p>
            <p class="m-0 text-sm text-600">{{ entry.description }}</p>
          </div>
          <time :datetime="entry.occurredAt" class="text-xs text-600 white-space-nowrap">{{ formatDateTime(entry.occurredAt) }}</time>
        </li>
      </ol>
      <pv-paginator v-if="results.length > PAGE_SIZE" v-model:first="first" :rows="PAGE_SIZE" :total-records="results.length"/>
    </article>
  </section>
</template>

<style scoped>
.history-row { display: flex; align-items: flex-start; gap: 0.9rem; padding: 0.75rem; border-radius: 10px; background: var(--vt-background); }
.history-icon { width: 2.25rem; height: 2.25rem; border-radius: 10px; display: grid; place-items: center; background: var(--vt-mint); color: var(--vt-primary); flex-shrink: 0; }
</style>
