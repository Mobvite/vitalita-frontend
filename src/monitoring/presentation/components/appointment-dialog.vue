<script setup>
import {computed, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useMonitoringStore from "../../application/monitoring.store.js";
import {MedicalAppointment} from "../../domain/model/medical-appointment.entity.js";

const props = defineProps({
  olderAdultId: {type: Number, default: null},
  appointment: {type: Object, default: null}
});
const visible = defineModel('visible', {type: Boolean, default: false});
const {t} = useI18n();
const toast = useToast();
const store = useMonitoringStore();

const isResultMode = computed(() => props.appointment !== null);
const form = reactive({specialty: '', doctorName: '', location: '', scheduledAt: null, result: '', observations: ''});

watch(visible, (open) => {
  if (open) Object.assign(form, {specialty: '', doctorName: '', location: '', scheduledAt: null, result: '', observations: ''});
});

async function save() {
  const saved = isResultMode.value
      ? await store.completeAppointment(props.appointment, form.result, form.observations)
      : await store.addAppointment(new MedicalAppointment({
          olderAdultId: props.olderAdultId, specialty: form.specialty, doctorName: form.doctorName,
          location: form.location, scheduledAt: form.scheduledAt?.toISOString() ?? null
        }));
  if (saved) {
    toast.add({severity: 'success', summary: t('monitoring.records.appointment-saved'), life: 3000});
    visible.value = false;
  }
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :style="{width: '32rem'}" :breakpoints="{'640px': '95vw'}"
             :header="isResultMode ? $t('monitoring.records.register-outcome') : $t('monitoring.records.new-appointment')">
    <form novalidate class="flex flex-column gap-3" @submit.prevent="save">
      <template v-if="!isResultMode">
        <div class="flex flex-column gap-2">
          <label for="specialty" class="text-sm font-medium">{{ $t('monitoring.records.specialty') }} *</label>
          <pv-input-text id="specialty" v-model="form.specialty" aria-required="true"/>
        </div>
        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="doctor" class="text-sm font-medium">{{ $t('monitoring.records.doctor') }}</label>
            <pv-input-text id="doctor" v-model="form.doctorName"/>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="location" class="text-sm font-medium">{{ $t('monitoring.records.location') }}</label>
            <pv-input-text id="location" v-model="form.location"/>
          </div>
        </div>
        <div class="flex flex-column gap-2">
          <label for="scheduled-at" class="text-sm font-medium">{{ $t('monitoring.records.date') }} *</label>
          <pv-date-picker input-id="scheduled-at" v-model="form.scheduledAt" show-time hour-format="24"
                          date-format="dd/mm/yy" show-icon aria-required="true"/>
        </div>
      </template>
      <template v-else>
        <p class="m-0 font-semibold">{{ appointment.specialty }} · {{ appointment.doctorName }}</p>
        <div class="flex flex-column gap-2">
          <label for="appointment-result" class="text-sm font-medium">{{ $t('monitoring.records.result') }}</label>
          <pv-textarea id="appointment-result" v-model="form.result" rows="3" auto-resize/>
        </div>
        <div class="flex flex-column gap-2">
          <label for="appointment-observations" class="text-sm font-medium">{{ $t('monitoring.records.indications') }}</label>
          <pv-textarea id="appointment-observations" v-model="form.observations" rows="2" auto-resize/>
        </div>
      </template>
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
