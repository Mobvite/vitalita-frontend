<script setup>
import LanguageSwitcher from "../../../shared/presentation/components/language-switcher.vue";
const features = ['iam.brand.feature-follow-up', 'iam.brand.feature-family', 'iam.brand.feature-secure'];
</script>

<template>
  <section class="brand-panel" aria-labelledby="brand-title">
    <div class="flex align-items-center gap-2">
      <span class="brand-logo" aria-hidden="true">V</span>
      <span class="text-2xl font-bold">Vitalita</span>
    </div>
    <div>
      <span class="brand-chip">{{ $t('iam.brand.chip') }}</span>
      <h1 id="brand-title" class="brand-title">{{ $t('iam.brand.title') }}</h1>
      <p class="brand-text">{{ $t('iam.brand.text') }}</p>
      <language-switcher class="mt-4" variant="inverted"/>
    </div>
    <ul class="list-none p-0 m-0 flex flex-column gap-2">
      <li v-for="feature in features" :key="feature" class="flex align-items-center gap-2">
        <i class="pi pi-check-circle" aria-hidden="true"/>
        <span>{{ $t(feature) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.brand-panel {
  background: var(--vt-primary);
  color: #fff;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  min-height: 100vh;
}
.brand-logo {
  width: 2.25rem; height: 2.25rem; border-radius: 8px;
  background: #fff; color: var(--vt-primary);
  display: grid; place-items: center; font-weight: 700;
}
.brand-chip {
  display: inline-block; background: var(--vt-secondary); color: #fff;
  font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 999px;
}
.brand-title { color: #fff; font-size: 2.5rem; line-height: 1.15; margin-top: 1rem; }
.brand-text { color: #d1fae5; font-size: 1.05rem; max-width: 26rem; }
@media (max-width: 900px) {
  .brand-panel { min-height: auto; padding: 2rem 1.5rem; }
  .brand-title { font-size: 1.75rem; }
}
</style>
