<script setup>
import {computed, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useProfilesStore from "../../../../../../vitalita-frontend/src/profiles/application/profiles.store.js";
import {FamilyRelationship} from "../../../../../../vitalita-frontend/src/profiles/domain/model/family-relationship.js";
import {Email} from "../../../../../../vitalita-frontend/src/shared/domain/model/email.js";

const visible = defineModel('visible', {type: Boolean, default: false});
const {t} = useI18n();
const toast = useToast();
const store = useProfilesStore();

const form = reactive({invitedEmail: '', relationship: FamilyRelationship.SON, submitted: false});
const invitation = ref(null);

const relationshipOptions = computed(() => Object.values(FamilyRelationship)
    .map(value => ({label: t(`profiles.relationships.${value}`), value})));
const emailInvalid = computed(() => form.submitted && !Email.isValid(form.invitedEmail));
const invitationLink = computed(() => invitation.value
    ? `${window.location.origin}/iam/family-sign-up?code=${invitation.value.invitationCode}` : '');
const whatsappLink = computed(() =>
    `https://wa.me/?text=${encodeURIComponent(t('profiles.invite.whatsapp-message', {link: invitationLink.value}))}`);

async function sendInvitation() {
  form.submitted = true;
  if (emailInvalid.value) return;
  invitation.value = await store.inviteFamilyMember(form);
}

async function copyLink() {
  await navigator.clipboard.writeText(invitationLink.value);
  toast.add({severity: 'success', summary: t('profiles.invite.copied'), life: 3000});
}

function close() {
  visible.value = false;
  invitation.value = null;
  Object.assign(form, {invitedEmail: '', relationship: FamilyRelationship.SON, submitted: false});
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="$t('profiles.invite.title')" :style="{width: '32rem'}"
             :breakpoints="{'640px': '95vw'}" @hide="close">
    <form v-if="!invitation" novalidate class="flex flex-column gap-3" @submit.prevent="sendInvitation">
      <p class="m-0 text-600">{{ $t('profiles.invite.description') }}</p>
      <div class="flex flex-column gap-2">
        <label for="invited-email" class="font-medium text-sm">{{ $t('iam.fields.email') }}</label>
        <pv-input-text id="invited-email" v-model="form.invitedEmail" type="email" :invalid="emailInvalid"
                       aria-required="true" aria-describedby="invited-email-error"/>
        <small v-if="emailInvalid" id="invited-email-error" class="p-error">{{ $t('iam.validation.email') }}</small>
      </div>
      <div class="flex flex-column gap-2">
        <label for="relationship" class="font-medium text-sm">{{ $t('profiles.family.relationship') }}</label>
        <pv-select input-id="relationship" v-model="form.relationship" :options="relationshipOptions"
                   option-label="label" option-value="value"/>
      </div>
      <div aria-live="polite">
        <pv-message v-for="error in store.errors" :key="error" severity="error">{{ $t(error) }}</pv-message>
      </div>
      <div class="flex justify-content-end gap-2">
        <pv-button :label="$t('common.cancel')" text severity="secondary" @click="close"/>
        <pv-button type="submit" :label="$t('profiles.invite.submit')" icon="pi pi-send"/>
      </div>
    </form>

    <div v-else class="flex flex-column gap-3" aria-live="polite">
      <pv-message severity="success">{{ $t('profiles.invite.created', {email: invitation.invitedEmail}) }}</pv-message>
      <div class="code-box">
        <span class="text-sm text-600">{{ $t('profiles.invite.code') }}</span>
        <strong class="text-2xl">{{ invitation.invitationCode }}</strong>
      </div>
      <p class="m-0 text-sm text-600">{{ $t('profiles.invite.expires', {date: new Date(invitation.expiresAt).toLocaleDateString()}) }}</p>
      <div class="flex flex-wrap gap-2">
        <pv-button :label="$t('profiles.invite.copy-link')" icon="pi pi-copy" outlined @click="copyLink"/>
        <a :href="whatsappLink" target="_blank" rel="noopener noreferrer">
          <pv-button :label="$t('profiles.invite.share-whatsapp')" icon="pi pi-whatsapp" severity="success"/>
        </a>
      </div>
      <div class="flex justify-content-end">
        <pv-button :label="$t('common.close')" @click="close"/>
      </div>
    </div>
  </pv-dialog>
</template>

<style scoped>
.code-box { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 1rem; background: var(--vt-mint); border-radius: 12px; color: var(--vt-primary); }
</style>
