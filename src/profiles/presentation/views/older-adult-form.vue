<script setup>
import {computed, onMounted, reactive} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../application/profiles.store.js";
import {OlderAdult} from "src/profiles/domain/model/older-adult.entity.js";
import {FamilyRelationship} from "src/profiles/domain/model/family-relationship.js";
import TagListInput from "../components/tag-list-input.vue";

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const iamStore = useIamStore();
const store = useProfilesStore();

const isEdit = computed(() => route.name === 'profiles-older-adult-edit');
const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const relationshipOptions = computed(() => Object.values(FamilyRelationship)
    .map(value => ({label: t(`profiles.relationships.${value}`), value})));

const form = reactive({
  firstName: '', lastName: '', birthDate: null, documentNumber: '', bloodType: '',
  allergies: [], chronicConditions: [], observations: '',
  contactName: '', contactPhone: '', contactRelationship: FamilyRelationship.SON,
  submitted: false
});

const invalid = computed(() => ({
  firstName: form.submitted && !form.firstName.trim(),
  lastName: form.submitted && !form.lastName.trim(),
  birthDate: form.submitted && !form.birthDate,
  documentNumber: form.submitted && form.documentNumber !== '' && !/^\d{8}$/.test(form.documentNumber)
}));

onMounted(async () => {
  await store.initialize(iamStore.currentUserId, iamStore.isCaregiver);
  if (!isEdit.value) return;
  const olderAdult = store.getOlderAdultById(route.params.id);
  if (!olderAdult) return router.replace({name: 'profiles-older-adults'});
  Object.assign(form, {
    firstName: olderAdult.firstName, lastName: olderAdult.lastName,
    birthDate: olderAdult.birthDate ? new Date(`${olderAdult.birthDate}T00:00:00`) : null,
    documentNumber: olderAdult.documentNumber, bloodType: olderAdult.bloodType,
    allergies: [...olderAdult.allergies], chronicConditions: [...olderAdult.chronicConditions],
    observations: olderAdult.observations, contactName: olderAdult.emergencyContact.name,
    contactPhone: olderAdult.emergencyContact.phoneNumber,
    contactRelationship: olderAdult.emergencyContact.relationship || FamilyRelationship.SON
  });
});

function toIsoDate(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}

async function save() {
  form.submitted = true;
  if (Object.values(invalid.value).some(Boolean)) return;
  const current = isEdit.value ? store.getOlderAdultById(route.params.id) : null;
  const olderAdult = new OlderAdult({
    id: current?.id ?? null,
    caregiverId: current?.caregiverId ?? null,
    status: current?.status ?? 'Active',
    firstName: form.firstName, lastName: form.lastName, birthDate: toIsoDate(form.birthDate),
    documentNumber: form.documentNumber, bloodType: form.bloodType,
    allergies: form.allergies, chronicConditions: form.chronicConditions, observations: form.observations,
    emergencyContact: {name: form.contactName, phoneNumber: form.contactPhone, relationship: form.contactRelationship}
  });
  const saved = isEdit.value ? await store.updateOlderAdult(olderAdult) : await store.addOlderAdult(olderAdult);
  if (saved) {
    toast.add({severity: 'success', summary: t('profiles.older-adult-form.saved'), life: 3000});
    await router.push({name: 'profiles-older-adults'});
  }
}
</script>

<template>
  <form class="vt-card form-card" novalidate aria-labelledby="older-adult-form-title" @submit.prevent="save">
    <h2 id="older-adult-form-title" class="vt-page-title">
      {{ $t(isEdit ? 'profiles.older-adult-form.edit-title' : 'profiles.older-adult-form.new-title') }}
    </h2>
    <p class="vt-page-subtitle mb-4">{{ $t('profiles.older-adult-form.subtitle') }}</p>

    <fieldset class="form-section">
      <legend>{{ $t('profiles.older-adult-form.basic-data') }}</legend>
      <div class="grid">
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label for="first-name">{{ $t('iam.fields.first-name') }} *</label>
          <pv-input-text id="first-name" v-model="form.firstName" :invalid="invalid.firstName" aria-required="true"/>
          <small v-if="invalid.firstName" class="p-error">{{ $t('iam.validation.required') }}</small>
        </div>
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label for="last-name">{{ $t('iam.fields.last-name') }} *</label>
          <pv-input-text id="last-name" v-model="form.lastName" :invalid="invalid.lastName" aria-required="true"/>
          <small v-if="invalid.lastName" class="p-error">{{ $t('iam.validation.required') }}</small>
        </div>
        <div class="col-12 md:col-4 flex flex-column gap-2">
          <label for="birth-date">{{ $t('profiles.fields.birth-date') }} *</label>
          <pv-date-picker input-id="birth-date" v-model="form.birthDate" date-format="dd/mm/yy" :max-date="new Date()"
                          show-icon :invalid="invalid.birthDate" aria-required="true"/>
          <small v-if="invalid.birthDate" class="p-error">{{ $t('iam.validation.required') }}</small>
        </div>
        <div class="col-12 md:col-4 flex flex-column gap-2">
          <label for="document-number">DNI</label>
          <pv-input-text id="document-number" v-model="form.documentNumber" maxlength="8" inputmode="numeric" :invalid="invalid.documentNumber"/>
          <small v-if="invalid.documentNumber" class="p-error">{{ $t('profiles.validation.document') }}</small>
        </div>
        <div class="col-12 md:col-4 flex flex-column gap-2">
          <label for="blood-type">{{ $t('profiles.fields.blood-type') }}</label>
          <pv-select input-id="blood-type" v-model="form.bloodType" :options="bloodTypes" show-clear/>
        </div>
      </div>
    </fieldset>

    <fieldset class="form-section">
      <legend>{{ $t('profiles.older-adult-form.health-data') }}</legend>
      <div class="grid">
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label for="allergies">{{ $t('profiles.fields.allergies') }}</label>
          <tag-list-input v-model="form.allergies" input-id="allergies" :placeholder="$t('profiles.fields.allergies-placeholder')"/>
        </div>
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label for="chronic-conditions">{{ $t('profiles.fields.chronic-conditions') }}</label>
          <tag-list-input v-model="form.chronicConditions" input-id="chronic-conditions" :placeholder="$t('profiles.fields.conditions-placeholder')"/>
        </div>
        <div class="col-12 flex flex-column gap-2">
          <label for="observations">{{ $t('profiles.fields.observations') }}</label>
          <pv-textarea id="observations" v-model="form.observations" rows="3" auto-resize/>
        </div>
      </div>
    </fieldset>

    <fieldset class="form-section">
      <legend>{{ $t('profiles.fields.emergency-contact') }}</legend>
      <div class="grid">
        <div class="col-12 md:col-5 flex flex-column gap-2">
          <label for="contact-name">{{ $t('profiles.fields.contact-name') }}</label>
          <pv-input-text id="contact-name" v-model="form.contactName" autocomplete="off"/>
        </div>
        <div class="col-12 md:col-4 flex flex-column gap-2">
          <label for="contact-phone">{{ $t('profiles.fields.phone') }}</label>
          <pv-input-text id="contact-phone" v-model="form.contactPhone" inputmode="tel"/>
        </div>
        <div class="col-12 md:col-3 flex flex-column gap-2">
          <label for="contact-relationship">{{ $t('profiles.family.relationship') }}</label>
          <pv-select input-id="contact-relationship" v-model="form.contactRelationship" :options="relationshipOptions"
                     option-label="label" option-value="value"/>
        </div>
      </div>
    </fieldset>

    <div aria-live="polite">
      <pv-message v-for="error in store.errors" :key="error" severity="error" class="mb-3">{{ $t(error) }}</pv-message>
    </div>

    <div class="flex justify-content-end gap-2">
      <pv-button :label="$t('common.cancel')" text severity="secondary" @click="router.back()"/>
      <pv-button type="submit" :label="$t('common.save')" icon="pi pi-check"/>
    </div>
  </form>
</template>

<style scoped>
.form-card { max-width: 60rem; }
.form-section { border: none; padding: 0; margin: 0 0 1.5rem; }
.form-section legend { font-weight: 700; margin-bottom: 0.75rem; color: var(--vt-primary); }
label { font-size: 0.875rem; font-weight: 500; }
</style>
