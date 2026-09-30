<script setup>
import {computed, reactive} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useIamStore from "../../application/iam.store.js";
import {SignUpCommand} from "../../domain/model/sign-up.command.js";
import {Email} from "../../../shared/domain/model/email.js";
import AuthBrandPanel from "../components/auth-brand-panel.vue";

const {t} = useI18n();
const router = useRouter();
const toast = useToast();
const store = useIamStore();
const landingUrl = import.meta.env.VITE_LANDING_PAGE_URL;

const form = reactive({firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptsTerms: false, submitted: false});

const invalid = computed(() => ({
  firstName: form.submitted && !form.firstName.trim(),
  lastName: form.submitted && !form.lastName.trim(),
  email: form.submitted && !Email.isValid(form.email),
  password: form.submitted && form.password.length < 8,
  confirmPassword: form.submitted && form.password !== form.confirmPassword,
  acceptsTerms: form.submitted && !form.acceptsTerms
}));

async function performSignUp() {
  form.submitted = true;
  if (Object.values(invalid.value).some(Boolean)) return;
  const created = await store.signUp(new SignUpCommand(form));
  if (created) {
    toast.add({severity: 'success', summary: t('iam.sign-up.success'), life: 4000});
    await router.push({name: 'iam-sign-in'});
  }
}
</script>

<template>
  <main class="grid m-0 min-h-screen">
    <div class="col-12 lg:col-5 p-0"><auth-brand-panel/></div>
    <div class="col-12 lg:col-7 flex align-items-center justify-content-center p-4 bg-white">
      <form class="w-full auth-form" novalidate @submit.prevent="performSignUp">
        <h2 class="text-3xl">{{ $t('iam.sign-up.title') }}</h2>
        <p class="vt-page-subtitle mb-4">{{ $t('iam.sign-up.subtitle') }}</p>

        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="first-name" class="font-medium text-sm">{{ $t('iam.fields.first-name') }}</label>
            <pv-input-text id="first-name" v-model="form.firstName" autocomplete="given-name" :invalid="invalid.firstName" aria-required="true"/>
            <small v-if="invalid.firstName" class="p-error">{{ $t('iam.validation.required') }}</small>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="last-name" class="font-medium text-sm">{{ $t('iam.fields.last-name') }}</label>
            <pv-input-text id="last-name" v-model="form.lastName" autocomplete="family-name" :invalid="invalid.lastName" aria-required="true"/>
            <small v-if="invalid.lastName" class="p-error">{{ $t('iam.validation.required') }}</small>
          </div>
        </div>

        <div class="flex flex-column gap-2 my-3">
          <label for="email" class="font-medium text-sm">{{ $t('iam.fields.email') }}</label>
          <pv-input-text id="email" v-model="form.email" type="email" autocomplete="email" :invalid="invalid.email" aria-required="true"/>
          <small v-if="invalid.email" class="p-error">{{ $t('iam.validation.email') }}</small>
        </div>

        <div class="flex flex-column gap-2 mb-3">
          <label for="password" class="font-medium text-sm">{{ $t('iam.fields.password') }}</label>
          <pv-password input-id="password" v-model="form.password" toggle-mask fluid :invalid="invalid.password" autocomplete="new-password"/>
          <small v-if="invalid.password" class="p-error">{{ $t('iam.validation.password-length') }}</small>
        </div>

        <div class="flex flex-column gap-2 mb-3">
          <label for="confirm-password" class="font-medium text-sm">{{ $t('iam.fields.confirm-password') }}</label>
          <pv-password input-id="confirm-password" v-model="form.confirmPassword" :feedback="false" toggle-mask fluid
                       :invalid="invalid.confirmPassword" autocomplete="new-password"/>
          <small v-if="invalid.confirmPassword" class="p-error">{{ $t('iam.validation.password-match') }}</small>
        </div>

        <div class="flex align-items-center gap-2 mb-3">
          <pv-checkbox v-model="form.acceptsTerms" input-id="terms" binary :invalid="invalid.acceptsTerms"/>
          <label for="terms" class="text-sm">
            {{ $t('iam.sign-up.accept') }}
            <a :href="`${landingUrl}/terms.html`" target="_blank" rel="noopener noreferrer" class="text-primary font-semibold">{{ $t('footer.terms') }}</a>
          </label>
        </div>

        <div aria-live="polite">
          <pv-message v-for="error in store.errors" :key="error" severity="error" class="mb-3">{{ $t(error) }}</pv-message>
        </div>

        <pv-button type="submit" :label="$t('iam.sign-up.submit')" :loading="store.isLoading" class="w-full"/>

        <p class="text-center text-sm mt-4">
          {{ $t('iam.sign-up.has-account') }}
          <router-link :to="{name: 'iam-sign-in'}" class="text-primary font-semibold">{{ $t('iam.sign-in.submit') }}</router-link>
        </p>
      </form>
    </div>
  </main>
</template>

<style scoped>
.auth-form { max-width: 30rem; }
</style>
