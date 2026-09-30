<script setup>
import {computed, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import usePlanningStore from "../../application/planning.store.js";
import {ReminderType} from "../../domain/model/reminder-type.js";

const props = defineProps({olderAdultId: {type: Number, default: null}, userId: {type: Number, default: null}});
const visible = defineModel('visible', {type: Boolean, default: false});
const {t} = useI18n();
const toast = useToast();
const store = usePlanningStore();

const form = reactive({message: '', type: ReminderType.OTHER, scheduledAt: null});
const typeOptions = computed(() => [ReminderType.MEDICATION, ReminderType.THERAPY, ReminderType.OTHER]
    .map(value => ({label: t(`planning.types.${value}`), value})));

watch(visible, (isOpen) => {
  if (isOpen) Object.assign(form, {message: '', type: ReminderType.OTHER, scheduledAt: null});
});

async function save() {
  const saved = await store.createPersonalReminder({...form, olderAdultId: props.olderAdultId, userId: props.userId});
  if (saved) {
    toast.add({severity: 'success', summary: t('planning.reminders.saved'), life: 3000});
    visible.value = false;
  }
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="$t('planning.reminders.new')" :style="{width: '30rem'}" :breakpoints="{'640px': '95vw'}">
    <form novalidate class="flex flex-column gap-3" @submit.prevent="save">
      <div class="flex flex-column gap-2">
        <label for="reminder-message" class="text-sm font-medium">{{ $t('planning.reminders.detail') }} *</label>
        <pv-input-text id="reminder-message" v-model="form.message" aria-required="true"/>
      </div>
      <div class="flex flex-column gap-2">
        <label for="reminder-type" class="text-sm font-medium">{{ $t('monitoring.records.category') }}</label>
        <pv-select input-id="reminder-type" v-model="form.type" :options="typeOptions" option-label="label" option-value="value"/>
      </div>
      <div class="flex flex-column gap-2">
        <label for="reminder-date" class="text-sm font-medium">{{ $t('planning.reminders.when') }} *</label>
        <pv-date-picker input-id="reminder-date" v-model="form.scheduledAt" show-time hour-format="24" date-format="dd/mm/yy"
                        :min-date="new Date()" show-icon aria-required="true"/>
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
