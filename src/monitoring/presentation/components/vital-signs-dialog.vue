<script setup>
import {reactive} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useMonitoringStore from "../../application/monitoring.store.js";
import {VitalSign} from "../../domain/model/vital-sign.entity.js";
import {VitalSignType} from "../../domain/model/vital-sign-type.js";

const props = defineProps({olderAdultId: {type: Number, default: null}});
const visible = defineModel('visible', {type: Boolean, default: false});
const {t} = useI18n();
const toast = useToast();
const store = useMonitoringStore();

const values = reactive({heartRate: null, systolic: null, diastolic: null, temperature: null, saturation: null, glucose: null});

async function save() {
  const measuredAt = new Date().toISOString();
  const base = {olderAdultId: props.olderAdultId, measuredAt};
  const signs = [];
  if (values.heartRate !== null) signs.push(new VitalSign({...base, type: VitalSignType.HEART_RATE, value: values.heartRate}));
  if (values.systolic !== null || values.diastolic !== null) {
    signs.push(new VitalSign({...base, type: VitalSignType.BLOOD_PRESSURE, value: values.systolic, secondaryValue: values.diastolic}));
  }
  if (values.temperature !== null) signs.push(new VitalSign({...base, type: VitalSignType.TEMPERATURE, value: values.temperature}));
  if (values.saturation !== null) signs.push(new VitalSign({...base, type: VitalSignType.OXYGEN_SATURATION, value: values.saturation}));
  if (values.glucose !== null) signs.push(new VitalSign({...base, type: VitalSignType.GLUCOSE, value: values.glucose}));

  if (await store.addVitalSigns(signs)) {
    toast.add({severity: 'success', summary: t('monitoring.vitals.saved'), life: 3000});
    Object.keys(values).forEach(key => values[key] = null);
    visible.value = false;
  }
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="$t('monitoring.vitals.title')" :style="{width: '34rem'}" :breakpoints="{'640px': '95vw'}">
    <form novalidate class="grid" @submit.prevent="save">
      <p class="col-12 m-0 text-600 text-sm">{{ $t('monitoring.vitals.hint') }}</p>
      <div class="col-12 md:col-6 flex flex-column gap-2">
        <label for="heart-rate">{{ $t('monitoring.vital-types.HeartRate') }} (bpm)</label>
        <pv-input-number input-id="heart-rate" v-model="values.heartRate" :use-grouping="false"/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-2">
        <label for="temperature">{{ $t('monitoring.vital-types.Temperature') }} (°C)</label>
        <pv-input-number input-id="temperature" v-model="values.temperature" :min-fraction-digits="1" :max-fraction-digits="1"/>
      </div>
      <div class="col-6 flex flex-column gap-2">
        <label for="systolic">{{ $t('monitoring.vitals.systolic') }}</label>
        <pv-input-number input-id="systolic" v-model="values.systolic" :use-grouping="false"/>
      </div>
      <div class="col-6 flex flex-column gap-2">
        <label for="diastolic">{{ $t('monitoring.vitals.diastolic') }}</label>
        <pv-input-number input-id="diastolic" v-model="values.diastolic" :use-grouping="false"/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-2">
        <label for="saturation">{{ $t('monitoring.vital-types.OxygenSaturation') }} (%)</label>
        <pv-input-number input-id="saturation" v-model="values.saturation" :use-grouping="false"/>
      </div>
      <div class="col-12 md:col-6 flex flex-column gap-2">
        <label for="glucose">{{ $t('monitoring.vital-types.Glucose') }} (mg/dL)</label>
        <pv-input-number input-id="glucose" v-model="values.glucose" :use-grouping="false"/>
      </div>
      <div class="col-12" aria-live="polite">
        <pv-message v-for="error in store.errors" :key="error" severity="error">{{ $t(error) }}</pv-message>
      </div>
      <div class="col-12 flex justify-content-end gap-2">
        <pv-button :label="$t('common.cancel')" text severity="secondary" @click="visible = false"/>
        <pv-button type="submit" :label="$t('common.save')" icon="pi pi-check"/>
      </div>
    </form>
  </pv-dialog>
</template>

<style scoped>
label { font-size: 0.875rem; font-weight: 500; }
</style>
