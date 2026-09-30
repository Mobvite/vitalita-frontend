<script setup>
import {ref} from "vue";
import SideNavigation from "./side-navigation.vue";
import HeaderContent from "./header-content.vue";
import FooterContent from "./footer-content.vue";

const drawer = ref(false);
</script>

<template>
  <a href="#main-content" class="skip-link">{{ $t('navigation.skip-to-content') }}</a>
  <div class="app-shell">
    <aside class="app-sidebar hidden lg:block">
      <side-navigation/>
    </aside>
    <pv-drawer id="mobile-navigation" v-model:visible="drawer" :header="$t('navigation.menu')">
      <side-navigation @navigate="drawer = false"/>
    </pv-drawer>
    <div class="app-content">
      <header-content @toggle-menu="drawer = !drawer"/>
      <main id="main-content" class="app-main" tabindex="-1">
        <router-view/>
      </main>
      <footer-content/>
    </div>
  </div>
</template>

<style scoped>
.app-shell { display: flex; min-height: 100vh; }
.app-sidebar {
  width: 16rem; flex-shrink: 0; background: var(--vt-surface);
  border-right: 1px solid var(--vt-border); position: sticky; top: 0; height: 100vh;
}
.app-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.app-main { flex: 1; padding: 1.5rem; }
.skip-link {
  position: absolute; left: -999px; top: 0.5rem; z-index: 100;
  background: var(--vt-primary); color: #fff; padding: 0.5rem 1rem; border-radius: 8px;
}
.skip-link:focus { left: 0.5rem; }
</style>
