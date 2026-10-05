<script setup>
import {computed, onMounted, onUnmounted, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import Layout from "./shared/presentation/components/layout.vue";
import useIamStore from './iam/application/iam.store.js';
import {startSessionActivity} from './iam/application/session-activity.js';

const route = useRoute();
const usesAuthLayout = computed(() => route.meta['layout'] === 'auth');
const router = useRouter();
const iamStore = useIamStore();
let sessionActivity;

onMounted(() => {
  sessionActivity = startSessionActivity(iamStore, () => router.replace({name: 'iam-sign-in'}));
});
watch(() => iamStore.isSignedIn, () => sessionActivity?.check());
onUnmounted(() => sessionActivity?.stop());
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>
  <router-view v-if="usesAuthLayout"/>
  <layout v-else/>
</template>
