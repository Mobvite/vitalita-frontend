<script setup>
import {computed, onMounted, reactive, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useIamStore from "../../application/iam.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import {SignUpCommand} from "../../domain/model/sign-up.command.js";
import {UserRole} from "../../domain/model/user-role.js";
import AuthBrandPanel from "../components/auth-brand-panel.vue";

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const iamStore = useIamStore();
const profilesStore = useProfilesStore();

const invitationCode = ref(route.query.code ?? '');
const invitation = ref(null);
const invitationError = ref('');
const isChecking = ref(false);
const form = reactive({firstName: '', lastName: '', phoneNumber: '', password: '', confirmPassword: '', submitted: false});

const invalid = computed(() => ({
  firstName: form.submitted && !form.firstName.trim(),
  lastName: form.submitted && !form.lastName.trim(),
  password: form.submitted && form.password.length < 8,
  confirmPassword: form.submitted && form.password !== form.confirmPassword
}));

async function checkInvitation() {
  invitationError.value = '';
  if (!invitationCode.value.trim()) return;
  isChecking.value = true;
  invitation.value = await profilesStore.findValidInvitation(invitationCode.value);
  isChecking.value = false;
  if (!invitation.value) invitationError.value = 'iam.family-sign-up.invalid-invitation';
}

async function performSignUp() {
  form.submitted = true;
  if (Object.values(invalid.value).some(Boolean)) return;
  const userId = await iamStore.signUp(new SignUpCommand({
    firstName: form.firstName, lastName: form.lastName, email: invitation.value.invitedEmail,
    password: form.password, role: UserRole.FAMILY_MEMBER
  }));
  if (!userId) return;
  const registered = await profilesStore.registerFamilyMember({
    userId, firstName: form.firstName.trim(), lastName: form.lastName.trim(),
    phoneNumber: form.phoneNumber.trim(), invitation: invitation.value
  });
  if (registered) {
    toast.add({severity: 'success', summary: t('iam.sign-up.success'), life: 4000});
    await router.push({name: 'iam-sign-in', query: {role: 'family'}});
  }
}

onMounted(checkInvitation);
</script>

<template>
  <main class="grid m-0 min-h-screen">
    <div class="col-12 lg:col-5 p-0"><auth-brand-panel/></div>
    <div class="col-12 lg:col-7 flex align-items-center justify-content-center p-4 bg-white">
      <div class="w-full auth-form">
        <h2 class="text-3xl">{{ $t('iam.family-sign-up.title') }}</h2>
        <p class="vt-page-subtitle mb-4">{{ $t('iam.family-sign-up.subtitle') }}</p>

        <form v-if="!invitation" novalidate class="flex flex-column gap-2" @submit.prevent="checkInvitation">
          <label for="invitation-code" class="font-medium text-sm">{{ $t('profiles.invite.code') }}</label>
          <div class="flex gap-2">
            <pv-input-text id="invitation-code" v-model="invitationCode" class="flex-1" placeholder="VITA-XXXX"
                           aria-required="true" :invalid="!!invitationError" aria-describedby="invitation-error"/>
            <pv-button type="submit" :label="$t('iam.family-sign-up.validate')" :loading="isChecking"/>
          </div>
          <small v-if="invitationError" id="invitation-error" class="p-error" aria-live="polite">{{ $t(invitationError) }}</small>
        </form>

        <form v-else novalidate @submit.prevent="performSignUp">
          <pv-message severity="success" class="mb-3">
            {{ $t('iam.family-sign-up.valid-invitation', {email: invitation.invitedEmail}) }}
          </pv-message>
          <div class="grid">
            <div class="col-12 md:col-6 flex flex-column gap-2">
              <label for="family-first-name" class="font-medium text-sm">{{ $t('iam.fields.first-name') }}</label>
              <pv-input-text id="family-first-name" v-model="form.firstName" autocomplete="given-name" :invalid="invalid.firstName" aria-required="true"/>
              <small v-if="invalid.firstName" class="p-error">{{ $t('iam.validation.required') }}</small>
            </div>
            <div class="col-12 md:col-6 flex flex-column gap-2">
              <label for="family-last-name" class="font-medium text-sm">{{ $t('iam.fields.last-name') }}</label>
              <pv-input-text id="family-last-name" v-model="form.lastName" autocomplete="family-name" :invalid="invalid.lastName" aria-required="true"/>
              <small v-if="invalid.lastName" class="p-error">{{ $t('iam.validation.required') }}</small>
            </div>
          </div>
          <div class="flex flex-column gap-2 my-3">
            <label for="family-phone" class="font-medium text-sm">{{ $t('profiles.fields.phone') }}</label>
            <pv-input-text id="family-phone" v-model="form.phoneNumber" inputmode="tel" autocomplete="tel"/>
          </div>
          <div class="flex flex-column gap-2 mb-3">
            <label for="family-password" class="font-medium text-sm">{{ $t('iam.fields.password') }}</label>
            <pv-password input-id="family-password" v-model="form.password" toggle-mask fluid :invalid="invalid.password" autocomplete="new-password"/>
            <small v-if="invalid.password" class="p-error">{{ $t('iam.validation.password-length') }}</small>
          </div>
          <div class="flex flex-column gap-2 mb-3">
            <label for="family-confirm-password" class="font-medium text-sm">{{ $t('iam.fields.confirm-password') }}</label>
            <pv-password input-id="family-confirm-password" v-model="form.confirmPassword" :feedback="false" toggle-mask fluid
                         :invalid="invalid.confirmPassword" autocomplete="new-password"/>
            <small v-if="invalid.confirmPassword" class="p-error">{{ $t('iam.validation.password-match') }}</small>
          </div>
          <div aria-live="polite">
            <pv-message v-for="error in iamStore.errors" :key="error" severity="error" class="mb-3">{{ $t(error) }}</pv-message>
          </div>
          <pv-button type="submit" :label="$t('iam.sign-up.submit')" :loading="iamStore.isLoading" class="w-full"/>
        </form>

        <p class="text-center text-sm mt-4">
          {{ $t('iam.sign-up.has-account') }}
          <router-link :to="{name: 'iam-sign-in', query: {role: 'family'}}" class="text-primary font-semibold">{{ $t('iam.sign-in.submit') }}</router-link>
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.auth-form { max-width: 30rem; }
</style>
