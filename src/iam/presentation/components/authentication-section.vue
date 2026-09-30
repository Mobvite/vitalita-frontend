<script setup>
import {computed} from "vue";
import {useRouter} from "vue-router";
import useIamStore from "../../application/iam.store.js";

const router = useRouter();
const store = useIamStore();
const initials = computed(() => (store.currentUser?.email ?? '?').slice(0, 2).toUpperCase());
const roleKey = computed(() => store.isCaregiver ? 'iam.roles.caregiver' : 'iam.roles.family-member');
</script>

<template>
  <div v-if="store.isSignedIn" class="flex align-items-center gap-2">
    <pv-avatar :label="initials" shape="circle" class="user-avatar" aria-hidden="true"/>
    <div class="flex-1 overflow-hidden">
      <p class="m-0 text-sm font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis">{{ store.currentUser.email }}</p>
      <p class="m-0 text-xs text-600">{{ $t(roleKey) }}</p>
    </div>
    <pv-button icon="pi pi-sign-out" text rounded severity="secondary"
               :aria-label="$t('iam.sign-out')" v-tooltip.top="$t('iam.sign-out')"
               @click="store.signOut(router)"/>
  </div>
</template>

<style scoped>
.user-avatar { background: var(--vt-primary); color: #fff; }
</style>
