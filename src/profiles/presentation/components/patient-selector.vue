<script setup>
import {computed, onMounted} from "vue";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../../../../../vitalita-frontend/src/profiles/application/profiles.store.js";
import useSubscriptionsStore from "../../../subscriptions/application/subscriptions.store.js";
import useCareContextStore from "../../../../../../vitalita-frontend/src/shared/application/care-context.store.js";

const iamStore = useIamStore();
const profilesStore = useProfilesStore();
const subscriptionsStore = useSubscriptionsStore();
const careContext = useCareContextStore();

const selectedId = computed({
  get: () => careContext.selectedOlderAdultId,
  set: (value) => careContext.selectOlderAdult(value)
});

onMounted(async () => {
  await profilesStore.initialize(iamStore.currentUserId, iamStore.isCaregiver);
  if (iamStore.isCaregiver) await subscriptionsStore.fetchCurrentSubscription(iamStore.currentUserId);
});
</script>

<template>
  <section class="patient-card" aria-labelledby="patient-card-title" aria-live="polite">
    <p id="patient-card-title" class="patient-label">{{ $t('profiles.selector.label') }}</p>
    <pv-skeleton v-if="profilesStore.isLoading" height="2.5rem"/>
    <template v-else-if="profilesStore.selectedOlderAdult">
      <pv-select v-if="profilesStore.olderAdultsCount > 1" v-model="selectedId" :options="profilesStore.olderAdults"
                 option-label="fullName" option-value="id" class="w-full" :aria-label="$t('profiles.selector.change')"/>
      <p v-else class="m-0 font-semibold">{{ profilesStore.selectedOlderAdult.fullName }}</p>
      <p class="m-0 mt-1 text-xs text-600">
        {{ $t('profiles.selector.count', {count: profilesStore.olderAdultsCount}, profilesStore.olderAdultsCount) }}
      </p>
    </template>
    <router-link v-else-if="iamStore.isCaregiver" :to="{name: 'profiles-older-adult-new'}" class="text-sm font-semibold text-primary">
      {{ $t('profiles.selector.register-first') }}
    </router-link>
    <p v-else class="m-0 text-sm text-600">{{ $t('profiles.selector.no-access') }}</p>
  </section>
</template>

<style scoped>
.patient-card { background: var(--vt-mint); border-radius: 12px; padding: 0.9rem; margin-top: 1rem; }
.patient-label { margin: 0 0 0.4rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; color: var(--vt-primary); text-transform: uppercase; }
</style>
