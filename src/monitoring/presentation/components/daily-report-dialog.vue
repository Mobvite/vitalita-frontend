<script setup>
import {computed, reactive} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useMonitoringStore from "../../application/monitoring.store.js";
import {DailyReport} from "../../domain/model/daily-report.entity.js";
import {Mood} from "../../domain/model/mood.js";
import usePlanningStore from "../../../planning/application/planning.store.js";

const props = defineProps({olderAdultId: {type: Number, default: null}, userId: {type: Number, default: null}});
const visible = defineModel('visible', {type: Boolean, default: false});
const {t} = useI18n();
const toast = useToast();
const store = useMonitoringStore();
const planningStore = usePlanningStore();

const form = reactive({mood: Mood.GOOD, generalCondition: 'Stable', observations: ''});
const moodOptions = computed(() => Object.values(Mood).map(value => ({label: t(`monitoring.moods.${value}`), value})));
const conditionOptions = computed(() => ['Stable', 'Attention', 'Critical'].map(value => ({label: t(`monitoring.conditions.${value}`), value})));

async function save() {
  const report = new DailyReport({...form, olderAdultId: props.olderAdultId, recordedByUserId: props.userId});
  if (await store.addDailyReport(report)) {
    planningStore.notifyFamilyMembers({
      olderAdultId: props.olderAdultId, type: 'HealthUpdate', title: t('planning.messages.report-title'),
      message: t('planning.messages.report-body', {mood: t(`monitoring.moods.${form.mood}`)})
    });
    toast.add({severity: 'success', summary: t('monitoring.report.saved'), life: 3000});
    Object.assign(form, {mood: Mood.GOOD, generalCondition: 'Stable', observations: ''});
    visible.value = false;
  }
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="$t('monitoring.report.title')" :style="{width: '32rem'}" :breakpoints="{'640px': '95vw'}">
    <form novalidate class="flex flex-column gap-3" @submit.prevent="save">
      <div class="flex flex-column gap-2">
        <span id="mood-label" class="text-sm font-medium">{{ $t('monitoring.report.mood') }}</span>
        <pv-select-button v-model="form.mood" :options="moodOptions" option-label="label" option-value="value"
                          :allow-empty="false" aria-labelledby="mood-label" class="flex-wrap"/>
      </div>
      <div class="flex flex-column gap-2">
        <label for="general-condition" class="text-sm font-medium">{{ $t('monitoring.report.condition') }}</label>
        <pv-select input-id="general-condition" v-model="form.generalCondition" :options="conditionOptions"
                   option-label="label" option-value="value"/>
      </div>
      <div class="flex flex-column gap-2">
        <label for="report-observations" class="text-sm font-medium">{{ $t('profiles.fields.observations') }} *</label>
        <pv-textarea id="report-observations" v-model="form.observations" rows="4" auto-resize aria-required="true"/>
      </div>
      <div aria-live="polite">
        <pv-message v-for="error in store.errors" :key="error" severity="error">{{ $t(error) }}</pv-message>
      </div>
      <div class="flex justify-content-end gap-2">
        <pv-button :label="$t('common.cancel')" text severity="secondary" @click="visible = false"/>
        <pv-button type="submit" :label="$t('common.save')" icon="pi pi-check"/>
      </div>
    </form>
  </pv-dialog>
</template>
