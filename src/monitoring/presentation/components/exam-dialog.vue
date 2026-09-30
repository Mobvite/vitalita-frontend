<script setup>
import {computed, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useMonitoringStore from "../../application/monitoring.store.js";
import {MedicalExam} from "../../domain/model/medical-exam.entity.js";
import usePlanningStore from "../../../planning/application/planning.store.js";

const props = defineProps({
  olderAdultId: {type: Number, default: null},
  exam: {type: Object, default: null}
});
const visible = defineModel('visible', {type: Boolean, default: false});
const {t} = useI18n();
const toast = useToast();
const store = useMonitoringStore();
const planningStore = usePlanningStore();

const isResultMode = computed(() => props.exam !== null);
const form = reactive({examType: '', category: 'Laboratory', performedAt: new Date(), resultSummary: ''});
const categoryOptions = computed(() => ['Laboratory', 'MedicalImaging', 'Report']
    .map(value => ({label: t(`monitoring.exam-categories.${value}`), value})));

watch(visible, (open) => {
  if (open) Object.assign(form, {examType: '', category: 'Laboratory', performedAt: new Date(), resultSummary: props.exam?.resultSummary ?? ''});
});

async function save() {
  let saved;
  if (isResultMode.value) {
    saved = await store.registerExamResult(props.exam, form.resultSummary);
  } else {
    const hasResult = form.resultSummary.trim() !== '';
    saved = await store.addExam(new MedicalExam({
      olderAdultId: props.olderAdultId, examType: form.examType, category: form.category,
      performedAt: form.performedAt?.toISOString() ?? null, resultSummary: form.resultSummary,
      status: hasResult ? 'Completed' : 'PendingResult'
    }));
  }
  if (saved) {
    const examName = props.exam?.examType ?? form.examType;
    if (isResultMode.value || form.resultSummary.trim()) {
      planningStore.notifyFamilyMembers({
        olderAdultId: props.exam?.olderAdultId ?? props.olderAdultId, type: 'ExamUpdate',
        title: t('planning.messages.exam-title'), message: t('planning.messages.exam-body', {name: examName})
      });
    }
    toast.add({severity: 'success', summary: t('monitoring.records.exam-saved'), life: 3000});
    visible.value = false;
  }
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :style="{width: '32rem'}" :breakpoints="{'640px': '95vw'}"
             :header="isResultMode ? $t('monitoring.records.register-result') : $t('monitoring.records.new-exam')">
    <form novalidate class="flex flex-column gap-3" @submit.prevent="save">
      <template v-if="!isResultMode">
        <div class="flex flex-column gap-2">
          <label for="exam-type" class="text-sm font-medium">{{ $t('monitoring.records.exam-type') }} *</label>
          <pv-input-text id="exam-type" v-model="form.examType" aria-required="true"/>
        </div>
        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="exam-category" class="text-sm font-medium">{{ $t('monitoring.records.category') }}</label>
            <pv-select input-id="exam-category" v-model="form.category" :options="categoryOptions" option-label="label" option-value="value"/>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="exam-date" class="text-sm font-medium">{{ $t('monitoring.records.date') }}</label>
            <pv-date-picker input-id="exam-date" v-model="form.performedAt" date-format="dd/mm/yy" show-icon/>
          </div>
        </div>
      </template>
      <p v-else class="m-0 font-semibold">{{ exam.examType }}</p>
      <div class="flex flex-column gap-2">
        <label for="exam-result" class="text-sm font-medium">{{ $t('monitoring.records.result') }}</label>
        <pv-textarea id="exam-result" v-model="form.resultSummary" rows="3" auto-resize aria-describedby="exam-result-help"/>
        <small v-if="!isResultMode" id="exam-result-help" class="text-600">{{ $t('monitoring.records.result-help') }}</small>
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
