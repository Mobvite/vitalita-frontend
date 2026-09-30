<script setup>
import {computed, onMounted} from "vue";
import {useRouter} from "vue-router";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../application/profiles.store.js";
import useSubscriptionsStore from "../../../subscriptions/application/subscriptions.store.js";
import useCareContextStore from "../../../shared/application/care-context.store.js";

const router = useRouter();
const iamStore = useIamStore();
const store = useProfilesStore();
const subscriptionsStore = useSubscriptionsStore();
const careContext = useCareContextStore();

const canAddOlderAdult = computed(() => subscriptionsStore.canManageAnotherOlderAdult(store.olderAdultsCount));

onMounted(() => store.initialize(iamStore.currentUserId, iamStore.isCaregiver));
</script>

<template>
  <section aria-labelledby="older-adults-title">
    <div class="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h2 id="older-adults-title" class="vt-page-title">{{ $t('profiles.older-adults.title') }}</h2>
        <p class="vt-page-subtitle">
          {{ $t('profiles.older-adults.subtitle', {count: store.olderAdultsCount, max: subscriptionsStore.currentPlan.maxOlderAdults}) }}
        </p>
      </div>
      <pv-button :label="$t('profiles.older-adults.new')" icon="pi pi-plus" :disabled="!canAddOlderAdult"
                 @click="router.push({name: 'profiles-older-adult-new'})"/>
    </div>

    <pv-message v-if="!canAddOlderAdult" severity="warn" class="mb-3">
      {{ $t('profiles.errors.plan-limit') }}
    </pv-message>

    <div v-if="store.isLoading" class="grid">
      <div v-for="index in 2" :key="index" class="col-12 md:col-6"><pv-skeleton height="11rem"/></div>
    </div>

    <p v-else-if="store.olderAdultsCount === 0" class="vt-card text-600">{{ $t('profiles.older-adults.empty') }}</p>

    <ul v-else class="grid list-none p-0 m-0">
      <li v-for="olderAdult in store.olderAdults" :key="olderAdult.id" class="col-12 md:col-6">
        <article class="vt-card h-full flex flex-column gap-3"
                 :class="{'selected-card': olderAdult.id === careContext.selectedOlderAdultId}"
                 :aria-label="olderAdult.fullName">
          <div class="flex align-items-center gap-3">
            <pv-avatar :label="olderAdult.initials" size="large" shape="circle" class="patient-avatar" aria-hidden="true"/>
            <div class="flex-1">
              <h3 class="text-lg">{{ olderAdult.fullName }}</h3>
              <p class="m-0 text-sm text-600">
                {{ $t('profiles.older-adults.age', {age: olderAdult.age}) }} · DNI {{ olderAdult.documentNumber || '—' }}
                · {{ $t('profiles.fields.blood-type') }} {{ olderAdult.bloodType || '—' }}
              </p>
            </div>
            <span v-if="olderAdult.id === careContext.selectedOlderAdultId" class="vt-chip">{{ $t('profiles.older-adults.active') }}</span>
          </div>
          <div>
            <p class="m-0 text-xs font-semibold text-600 mb-1">{{ $t('profiles.fields.allergies') }}</p>
            <div class="flex flex-wrap gap-1">
              <pv-tag v-for="allergy in olderAdult.allergies" :key="allergy" severity="danger" :value="allergy"/>
              <span v-if="!olderAdult.allergies.length" class="text-sm text-600">{{ $t('common.no-records') }}</span>
            </div>
          </div>
          <div class="flex gap-2 mt-auto">
            <pv-button :label="$t('profiles.older-adults.select')" size="small" outlined
                       :disabled="olderAdult.id === careContext.selectedOlderAdultId"
                       @click="careContext.selectOlderAdult(olderAdult.id)"/>
            <pv-button :label="$t('common.edit')" icon="pi pi-pencil" size="small" text
                       @click="router.push({name: 'profiles-older-adult-edit', params: {id: olderAdult.id}})"/>
          </div>
        </article>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.patient-avatar { background: var(--vt-mint); color: var(--vt-primary); font-weight: 700; }
.selected-card { border-color: var(--vt-secondary); box-shadow: 0 0 0 2px var(--vt-mint); }
</style>
