<script setup>
import {computed} from "vue";
import {useRoute} from "vue-router";
import Layout from "./shared/presentation/components/layout.vue";

const route = useRoute();
const usesAuthLayout = computed(() => route.meta['layout'] === 'auth');
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>
  <router-view v-if="usesAuthLayout"/>
  <layout v-else/>
</template>
