<script setup>
import {computed} from "vue";
import {useRouter} from "vue-router";
import useIamStore from "../../../iam/application/iam.store.js";
import AuthenticationSection from "../../../iam/presentation/components/authentication-section.vue";

defineEmits(['navigate']);
const router = useRouter();
const iamStore = useIamStore();

// Items are shown only when their route exists and the user role can open it.
// New bounded contexts appear in the menu as soon as their routes are added.
const items = [
  {label: 'navigation.home', icon: 'pi pi-home', route: 'home', caregiverRoute: 'monitoring-summary', familyRoute: 'dashboard-home'},
  {label: 'navigation.patients', icon: 'pi pi-heart', route: 'profiles-older-adults'},
  {label: 'navigation.notes', icon: 'pi pi-file-edit', route: 'monitoring-notes'},
  {label: 'navigation.exams', icon: 'pi pi-folder-open', route: 'monitoring-exams'},
  {label: 'navigation.history', icon: 'pi pi-history', route: 'dashboard-history'},
  {label: 'navigation.calendar', icon: 'pi pi-calendar', route: 'planning-calendar'},
  {label: 'navigation.family', icon: 'pi pi-users', route: 'profiles-family-members'},
  {label: 'navigation.emergency', icon: 'pi pi-exclamation-circle', route: 'asset-management-emergency-summary'},
  {label: 'navigation.subscription', icon: 'pi pi-credit-card', route: 'subscriptions-my-subscription'},
  {label: 'navigation.profile', icon: 'pi pi-id-card', route: 'profiles-caregiver-profile'}
];

// Some items open a different page depending on the role, like Home.
const routeFor = (item) => {
  const roleRoute = iamStore.isCaregiver ? item.caregiverRoute : item.familyRoute;
  return roleRoute && router.hasRoute(roleRoute) ? roleRoute : item.route;
};

const visibleItems = computed(() => items.map(item => ({...item, route: routeFor(item)})).filter(item => {
  if (!router.hasRoute(item.route)) return false;
  const roles = router.resolve({name: item.route}).meta['roles'] ?? [];
  return roles.length === 0 || roles.includes(iamStore.currentRole);
}));
</script>

<template>
  <div class="side-navigation">
    <router-link to="/home" class="flex align-items-center gap-2 mb-5" :aria-label="$t('navigation.go-home')">
      <span class="brand-logo" aria-hidden="true">V</span>
      <span class="text-2xl font-bold">Vitalita</span>
    </router-link>
    <nav :aria-label="$t('navigation.main')" class="flex-1">
      <ul class="list-none p-0 m-0 flex flex-column gap-1">
        <li v-for="item in visibleItems" :key="item.route">
          <router-link :to="{name: item.route}" class="nav-link" active-class="nav-link--active" @click="$emit('navigate')">
            <i :class="item.icon" aria-hidden="true"/>
            <span>{{ $t(item.label) }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
    <slot name="context"/>
    <pv-divider/>
    <authentication-section/>
  </div>
</template>

<style scoped>
.side-navigation { display: flex; flex-direction: column; height: 100%; padding: 1.5rem 1rem; }
.brand-logo {
  width: 2.25rem; height: 2.25rem; border-radius: 8px; background: var(--vt-primary);
  color: #fff; display: grid; place-items: center; font-weight: 700;
}
.nav-link {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0.9rem;
  border-radius: 10px; color: var(--vt-text-secondary); font-weight: 500;
}
.nav-link:hover { background: var(--vt-background); color: var(--vt-text); }
.nav-link--active { background: var(--vt-mint); color: var(--vt-primary); font-weight: 600; }
</style>
