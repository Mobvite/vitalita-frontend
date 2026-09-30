<script setup>
import {reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useMonitoringStore from "../../application/monitoring.store.js";
import {Medication} from "../../domain/model/medication.entity.js";
import {MedicationAdministration} from "../../domain/model/medication-administration.entity.js";

const props = defineProps({olderAdultId: {type: Number, default: null}, readOnly: {type: Boolean, default: false}});
const {t} = useI18n();
const toast = useToast();
const store = useMonitoringStore();

const dialogVisible = ref(false);
const form = reactive({name: '', dosage: '', frequency: '', scheduleTimes: '', instructions: ''});

async function registerDose(dose) {
  const administration = new MedicationAdministration({
    medicationId: dose.medication.id, olderAdultId: props.olderAdultId,
    scheduledTime: dose.time, dosageGiven: dose.medication.dosage
  });
  if (await store.administerMedication(administration)) {
    toast.add({severity: 'success', summary: t('monitoring.medication.dose-saved', {name: dose.medication.name}), life: 3000});
  } else {
    toast.add({severity: 'warn', summary: t(store.errors[0] ?? 'monitoring.errors.save'), life: 4000});
  }
}

async function saveMedication() {
  const medication = new Medication({
    ...form, olderAdultId: props.olderAdultId,
    scheduleTimes: form.scheduleTimes.split(',').map(time => time.trim()).filter(Boolean)
  });
  if (await store.addMedication(medication)) {
    Object.assign(form, {name: '', dosage: '', frequency: '', scheduleTimes: '', instructions: ''});
    dialogVisible.value = false;
  }
}
</script>

<template>
  <section class="vt-card" aria-labelledby="medication-title">
    <div class="flex align-items-center justify-content-between mb-3">
      <h3 id="medication-title" class="text-lg">{{ $t('monitoring.medication.today') }}</h3>
      <pv-button v-if="!readOnly" icon="pi pi-plus" text rounded :aria-label="$t('monitoring.medication.add')"
                 v-tooltip.left="$t('monitoring.medication.add')" @click="dialogVisible = true"/>
    </div>
    <p v-if="!store.todayDoses.length" class="text-sm text-600 m-0">{{ $t('monitoring.medication.empty') }}</p>
    <ul v-else class="list-none p-0 m-0 flex flex-column gap-2">
      <li v-for="dose in store.todayDoses" :key="`${dose.medication.id}-${dose.time}`" class="dose-row">
        <span class="dose-time">{{ dose.time }}</span>
        <div class="flex-1">
          <p class="m-0 font-semibold text-sm">{{ dose.medication.name }} {{ dose.medication.dosage }}</p>
          <p class="m-0 text-xs text-600">{{ dose.medication.instructions }}</p>
        </div>
        <pv-tag v-if="dose.given" severity="success" :value="$t('monitoring.medication.given')"/>
        <pv-button v-else-if="!readOnly" :label="$t('monitoring.medication.register-dose')" size="small" outlined
                   :aria-label="$t('monitoring.medication.register-dose-for', {name: dose.medication.name, time: dose.time})"
                   @click="registerDose(dose)"/>
        <pv-tag v-else severity="warn" :value="$t('profiles.status.Pending')"/>
      </li>
    </ul>

    <pv-dialog v-model:visible="dialogVisible" modal :header="$t('monitoring.medication.add')" :style="{width: '30rem'}" :breakpoints="{'640px': '95vw'}">
      <form novalidate class="flex flex-column gap-3" @submit.prevent="saveMedication">
        <div class="flex flex-column gap-2">
          <label for="medication-name" class="text-sm font-medium">{{ $t('monitoring.medication.name') }} *</label>
          <pv-input-text id="medication-name" v-model="form.name" aria-required="true"/>
        </div>
        <div class="grid">
          <div class="col-6 flex flex-column gap-2">
            <label for="medication-dosage" class="text-sm font-medium">{{ $t('monitoring.medication.dosage') }} *</label>
            <pv-input-text id="medication-dosage" v-model="form.dosage" placeholder="50 mg" aria-required="true"/>
          </div>
          <div class="col-6 flex flex-column gap-2">
            <label for="medication-frequency" class="text-sm font-medium">{{ $t('monitoring.medication.frequency') }}</label>
            <pv-input-text id="medication-frequency" v-model="form.frequency"/>
          </div>
        </div>
        <div class="flex flex-column gap-2">
          <label for="medication-times" class="text-sm font-medium">{{ $t('monitoring.medication.times') }} *</label>
          <pv-input-text id="medication-times" v-model="form.scheduleTimes" placeholder="08:00, 20:00"
                         aria-required="true" aria-describedby="medication-times-help"/>
          <small id="medication-times-help" class="text-600">{{ $t('monitoring.medication.times-help') }}</small>
        </div>
        <div class="flex flex-column gap-2">
          <label for="medication-instructions" class="text-sm font-medium">{{ $t('monitoring.medication.instructions') }}</label>
          <pv-textarea id="medication-instructions" v-model="form.instructions" rows="2" auto-resize/>
        </div>
        <div aria-live="polite">
          <pv-message v-for="error in store.errors" :key="error" severity="error">{{ $t(error) }}</pv-message>
        </div>
        <div class="flex justify-content-end gap-2">
          <pv-button :label="$t('common.cancel')" text severity="secondary" @click="dialogVisible = false"/>
          <pv-button type="submit" :label="$t('common.save')" icon="pi pi-check"/>
        </div>
      </form>
    </pv-dialog>
  </section>
</template>

<style scoped>
.dose-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem; border-radius: 10px; background: var(--vt-background); }
.dose-time { background: var(--vt-mint); color: var(--vt-primary); font-weight: 600; font-size: 0.8rem; padding: 0.3rem 0.55rem; border-radius: 999px; }
</style>
