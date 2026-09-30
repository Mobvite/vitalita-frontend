<script setup>
import {computed} from "vue";
import {useRoute} from "vue-router";
import LanguageSwitcher from "./language-switcher.vue";
import NotificationBell from "../../../planning/presentation/components/notification-bell.vue";

defineEmits(['toggle-menu']);
const route = useRoute();
const titleKey = computed(() => route.meta['title'] ?? 'navigation.home');
</script>

<template>
  <header class="app-header">
    <div class="flex align-items-center gap-2">
      <pv-button icon="pi pi-bars" text rounded class="lg:hidden" :aria-label="$t('navigation.open-menu')"
                 aria-controls="mobile-navigation" @click="$emit('toggle-menu')"/>
      <h1 class="text-xl font-semibold">{{ $t(titleKey) }}</h1>
    </div>
    <div class="flex align-items-center gap-2">
      <notification-bell/>
      <language-switcher/>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--vt-surface); border-bottom: 1px solid var(--vt-border);
  padding: 0.9rem 1.5rem; position: sticky; top: 0; z-index: 10;
}
</style>
