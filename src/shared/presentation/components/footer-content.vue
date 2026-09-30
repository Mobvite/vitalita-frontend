<script setup>
const landingUrl = import.meta.env.VITE_LANDING_PAGE_URL;
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="app-footer">
    <p class="m-0">&copy; {{ currentYear }} Vitalita · Mobvite. {{ $t('footer.rights') }}</p>
    <nav :aria-label="$t('footer.legal')" class="flex gap-3">
      <a :href="`${landingUrl}/terms.html`" target="_blank" rel="noopener noreferrer">{{ $t('footer.terms') }}</a>
      <a :href="`${landingUrl}/privacy.html`" target="_blank" rel="noopener noreferrer">{{ $t('footer.privacy') }}</a>
    </nav>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between;
  padding: 1rem 1.5rem; font-size: 0.8rem; color: var(--vt-text-secondary);
  border-top: 1px solid var(--vt-border); background: var(--vt-surface);
}
.app-footer a:hover { color: var(--vt-primary); text-decoration: underline; }
</style>
