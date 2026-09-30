<script setup>
import {computed, reactive} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useIamStore from "../../application/iam.store.js";
import {SignInCommand} from "../../domain/model/sign-in.command.js";
import {UserRole} from "../../domain/model/user-role.js";
import {Email} from "../../../shared/domain/model/email.js";
import AuthBrandPanel from "../components/auth-brand-panel.vue";

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const store = useIamStore();

const form = reactive({
  role: route.query.role === 'family' ? UserRole.FAMILY_MEMBER : UserRole.CAREGIVER,
  email: '',
  password: '',
  submitted: false
});

const roleOptions = computed(() => [
  {label: t('iam.roles.caregiver'), value: UserRole.CAREGIVER},
  {label: t('iam.roles.family-member'), value: UserRole.FAMILY_MEMBER}
]);
const emailInvalid = computed(() => form.submitted && !Email.isValid(form.email));
const passwordInvalid = computed(() => form.submitted && !form.password);

function performSignIn() {
  form.submitted = true;
  if (emailInvalid.value || passwordInvalid.value) return;
  const command = new SignInCommand({email: form.email.trim().toLowerCase(), password: form.password, role: form.role});
  store.signIn(command, router, route.query.redirect ?? '/home');
}
</script>

<template>
  <main class="grid m-0 min-h-screen">
    <div class="col-12 lg:col-5 p-0"><auth-brand-panel/></div>
    <div class="col-12 lg:col-7 flex align-items-center justify-content-center p-4 bg-white">
      <form class="w-full auth-form" novalidate @submit.prevent="performSignIn">
        <span class="vt-chip">{{ $t('iam.sign-in.chip') }}</span>
        <h2 class="text-3xl mt-3">{{ $t('iam.sign-in.title') }}</h2>
        <p class="vt-page-subtitle mb-4">{{ $t('iam.sign-in.subtitle') }}</p>

        <pv-select-button v-model="form.role" :options="roleOptions" option-label="label" option-value="value"
                          :allow-empty="false" class="w-full mb-4 role-toggle" :aria-label="$t('iam.sign-in.role-label')"/>

        <div class="flex flex-column gap-2 mb-3">
          <label for="email" class="font-medium text-sm">{{ $t('iam.fields.email') }}</label>
          <pv-input-text id="email" v-model="form.email" type="email" autocomplete="email" :invalid="emailInvalid"
                         :placeholder="$t('iam.fields.email-placeholder')" aria-required="true"
                         :aria-invalid="emailInvalid" aria-describedby="email-error"/>
          <small v-if="emailInvalid" id="email-error" class="p-error">{{ $t('iam.validation.email') }}</small>
        </div>

        <div class="flex flex-column gap-2 mb-4">
          <label for="password" class="font-medium text-sm">{{ $t('iam.fields.password') }}</label>
          <pv-password input-id="password" v-model="form.password" :feedback="false" toggle-mask fluid
                       :invalid="passwordInvalid" autocomplete="current-password"
                       :input-props="{'aria-required': 'true', 'aria-describedby': 'password-error'}"/>
          <small v-if="passwordInvalid" id="password-error" class="p-error">{{ $t('iam.validation.required') }}</small>
        </div>

        <div aria-live="polite">
          <pv-message v-for="error in store.errors" :key="error" severity="error" class="mb-3">{{ $t(error) }}</pv-message>
        </div>

        <pv-button type="submit" :label="$t('iam.sign-in.submit')" :loading="store.isLoading" class="w-full"/>

        <p class="security-note">{{ $t('iam.sign-in.security-note') }}</p>

        <p v-if="form.role === UserRole.CAREGIVER" class="text-center text-sm mt-4">
          {{ $t('iam.sign-in.no-account') }}
          <router-link :to="{name: 'iam-sign-up'}" class="text-primary font-semibold">{{ $t('iam.sign-in.create-account') }}</router-link>
        </p>
        <p v-else class="text-center text-sm mt-4 text-600">{{ $t('iam.sign-in.family-hint') }}</p>
      </form>
    </div>
  </main>
</template>

<style scoped>
.auth-form { max-width: 26rem; }
.role-toggle :deep(.p-togglebutton) { flex: 1; }
.security-note {
  background: var(--vt-mint); color: var(--vt-primary);
  border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.85rem; margin-top: 1rem;
}
</style>
