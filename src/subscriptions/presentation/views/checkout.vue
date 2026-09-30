<script setup>
import {computed, onMounted, reactive, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useIamStore from "../../../iam/application/iam.store.js";
import useSubscriptionsStore from "../../application/subscriptions.store.js";
import {PaymentGateway} from "../../infrastructure/payment-gateway.js";
import {PaymentMethod} from "../../domain/model/payment-method.js";

const {t, locale} = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();
const store = useSubscriptionsStore();

const result = ref(null);
const form = reactive({paymentMethod: PaymentMethod.CREDIT_CARD, cardNumber: '', cardHolder: '', expiry: '', cvv: '', phone: '', yapeCode: '', submitted: false});
const usesCulqi = PaymentGateway.isCulqiConfigured();

const plan = computed(() => store.plans.find(item => item.id === Number(route.params.planId)) ?? null);
const methodOptions = computed(() => [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.YAPE]
    .map(value => ({label: t(`subscriptions.methods.${value}`), value})));
const isYape = computed(() => form.paymentMethod === PaymentMethod.YAPE);
const invalid = computed(() => ({
  cardNumber: form.submitted && !isYape.value && !PaymentGateway.isValidCardNumber(form.cardNumber),
  cardHolder: form.submitted && !isYape.value && !form.cardHolder.trim(),
  expiry: form.submitted && !isYape.value && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry),
  cvv: form.submitted && !isYape.value && !/^\d{3,4}$/.test(form.cvv),
  phone: form.submitted && isYape.value && !/^9\d{8}$/.test(form.phone),
  yapeCode: form.submitted && isYape.value && !/^\d{6}$/.test(form.yapeCode)
}));

async function pay() {
  form.submitted = true;
  if (!usesCulqi && plan.value.isPaid() && Object.values(invalid.value).some(Boolean)) return;
  const gatewayData = usesCulqi
      ? {title: `Vitalita ${t(`subscriptions.plan-names.${plan.value.type}`)}`, email: iamStore.currentUser.email, lang: locale.value}
      : {paymentMethod: form.paymentMethod, cardNumber: form.cardNumber, yapeCode: form.yapeCode};
  result.value = await store.subscribe({userId: iamStore.currentUserId, plan: plan.value, gatewayData});
}

onMounted(async () => {
  if (!store.plansLoaded) await store.fetchPlans();
  await store.fetchCurrentSubscription(iamStore.currentUserId);
  if (!plan.value) await router.replace({name: 'subscriptions-plans'});
});
</script>

<template>
  <section v-if="plan" class="grid" aria-labelledby="checkout-title">
    <div class="col-12 lg:col-7">
      <article class="vt-card">
        <h2 id="checkout-title" class="vt-page-title">{{ $t('subscriptions.checkout.heading') }}</h2>

        <div v-if="result === 'approved'" class="text-center py-4" role="status">
          <i class="pi pi-check-circle text-6xl text-primary" aria-hidden="true"/>
          <h3 class="text-xl mt-3">{{ $t('subscriptions.checkout.approved') }}</h3>
          <p class="text-600">{{ $t('subscriptions.checkout.approved-detail', {plan: $t(`subscriptions.plan-names.${plan.type}`)}) }}</p>
          <pv-button :label="$t('subscriptions.mine.title')" @click="router.push({name: 'subscriptions-my-subscription'})"/>
        </div>

        <template v-else>
          <p class="vt-page-subtitle mb-4">{{ usesCulqi ? $t('subscriptions.checkout.culqi-hint') : $t('subscriptions.checkout.simulated-hint') }}</p>

          <form v-if="plan.isPaid() && !usesCulqi" novalidate class="flex flex-column gap-3" @submit.prevent="pay">
            <div class="flex flex-column gap-2">
              <span id="method-label" class="text-sm font-medium">{{ $t('subscriptions.checkout.method') }}</span>
              <pv-select-button v-model="form.paymentMethod" :options="methodOptions" option-label="label" option-value="value"
                                :allow-empty="false" aria-labelledby="method-label" class="flex-wrap"/>
            </div>
            <template v-if="!isYape">
              <div class="flex flex-column gap-2">
                <label for="card-number" class="text-sm font-medium">{{ $t('subscriptions.checkout.card-number') }}</label>
                <pv-input-text id="card-number" v-model="form.cardNumber" inputmode="numeric" autocomplete="cc-number" maxlength="19"
                               placeholder="4111 1111 1111 1111" :invalid="invalid.cardNumber" aria-required="true"/>
                <small v-if="invalid.cardNumber" class="p-error">{{ $t('subscriptions.validation.card') }}</small>
              </div>
              <div class="flex flex-column gap-2">
                <label for="card-holder" class="text-sm font-medium">{{ $t('subscriptions.checkout.card-holder') }}</label>
                <pv-input-text id="card-holder" v-model="form.cardHolder" autocomplete="cc-name" :invalid="invalid.cardHolder" aria-required="true"/>
              </div>
              <div class="grid">
                <div class="col-6 flex flex-column gap-2">
                  <label for="card-expiry" class="text-sm font-medium">{{ $t('subscriptions.checkout.expiry') }}</label>
                  <pv-input-text id="card-expiry" v-model="form.expiry" placeholder="MM/AA" autocomplete="cc-exp" maxlength="5" :invalid="invalid.expiry" aria-required="true"/>
                </div>
                <div class="col-6 flex flex-column gap-2">
                  <label for="card-cvv" class="text-sm font-medium">CVV</label>
                  <pv-input-text id="card-cvv" v-model="form.cvv" inputmode="numeric" autocomplete="cc-csc" maxlength="4" :invalid="invalid.cvv" aria-required="true"/>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="flex flex-column gap-2">
                <label for="yape-phone" class="text-sm font-medium">{{ $t('subscriptions.checkout.phone') }}</label>
                <pv-input-text id="yape-phone" v-model="form.phone" inputmode="tel" maxlength="9" :invalid="invalid.phone" aria-required="true"/>
                <small v-if="invalid.phone" class="p-error">{{ $t('subscriptions.validation.phone') }}</small>
              </div>
              <div class="flex flex-column gap-2">
                <label for="yape-code" class="text-sm font-medium">{{ $t('subscriptions.checkout.yape-code') }}</label>
                <pv-input-text id="yape-code" v-model="form.yapeCode" inputmode="numeric" maxlength="6" :invalid="invalid.yapeCode"
                               aria-required="true" aria-describedby="yape-code-help"/>
                <small id="yape-code-help" class="text-600">{{ $t('subscriptions.checkout.yape-help') }}</small>
              </div>
            </template>
            <div aria-live="assertive">
              <pv-message v-for="error in store.errors" :key="error" severity="error">{{ $t(error) }}</pv-message>
            </div>
            <pv-button type="submit" :label="$t('subscriptions.checkout.pay', {amount: plan.formattedPrice})" icon="pi pi-lock" :loading="store.isProcessing"/>
          </form>

          <div v-else class="flex flex-column gap-3">
            <div aria-live="assertive">
              <pv-message v-for="error in store.errors" :key="error" severity="error">{{ $t(error) }}</pv-message>
            </div>
            <pv-button :label="plan.isPaid() ? $t('subscriptions.checkout.pay', {amount: plan.formattedPrice}) : $t('subscriptions.checkout.activate-free')"
                       icon="pi pi-lock" :loading="store.isProcessing" @click="pay"/>
          </div>
        </template>
      </article>
    </div>

    <div class="col-12 lg:col-5">
      <aside class="vt-card" aria-labelledby="order-title">
        <h3 id="order-title" class="text-lg mb-3">{{ $t('subscriptions.checkout.summary') }}</h3>
        <dl class="order-list">
          <div><dt>{{ $t('subscriptions.checkout.plan') }}</dt><dd>{{ $t(`subscriptions.plan-names.${plan.type}`) }}</dd></div>
          <div><dt>{{ $t('subscriptions.plans.period') }}</dt><dd>{{ $t(plan.billingPeriod === 'Annual' ? 'subscriptions.plans.annual' : 'subscriptions.plans.monthly') }}</dd></div>
          <div class="order-total"><dt>{{ $t('subscriptions.checkout.total') }}</dt><dd>S/ {{ plan.formattedPrice }}</dd></div>
        </dl>
        <p class="text-xs text-600 mt-3 mb-0"><i class="pi pi-shield mr-1" aria-hidden="true"/>{{ $t('subscriptions.checkout.secure') }}</p>
        <router-link :to="{name: 'subscriptions-plans'}" class="text-sm text-primary font-semibold mt-3 inline-block">{{ $t('subscriptions.checkout.change-plan') }}</router-link>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.order-list { margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.order-list div { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--vt-border); }
.order-list dt { color: var(--vt-text-secondary); }
.order-list dd { margin: 0; font-weight: 600; }
.order-total dd { font-size: 1.25rem; color: var(--vt-primary); }
</style>
