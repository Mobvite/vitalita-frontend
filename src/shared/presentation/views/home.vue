<script setup>
import useIamStore from "../../../../../../../../Downloads/vitalita-frontend/src/iam/application/iam.store.js";
const iamStore = useIamStore();
</script>

<template>
  <section class="vt-card" aria-labelledby="home-title">
    <h2 id="home-title" class="vt-page-title">{{ $t('home.title') }}</h2>
    <p class="vt-page-subtitle">{{ $t('home.content', {email: iamStore.currentUser?.email}) }}</p>
  </section>
</template>
