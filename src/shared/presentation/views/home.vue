<script setup>
import useIamStore from "../../../../../../vitalita-frontend/src/iam/application/iam.store.js";
import useProfilesStore from "../../../../../../vitalita-frontend/src/profiles/application/profiles.store.js";
const iamStore = useIamStore();
const profilesStore = useProfilesStore();
</script>

<template>
  <section class="vt-card" aria-labelledby="home-title">
    <h2 id="home-title" class="vt-page-title">{{ $t('home.title') }}</h2>
    <p class="vt-page-subtitle">{{ $t('home.content', {email: iamStore.currentUser?.email}) }}</p>
    <div v-if="iamStore.isCaregiver && profilesStore.olderAdultsLoaded && profilesStore.olderAdultsCount === 0" class="mt-4">
      <p>{{ $t('home.register-first') }}</p>
      <router-link :to="{name: 'profiles-older-adult-new'}">
        <pv-button :label="$t('home.go-patients')" icon="pi pi-arrow-right" icon-pos="right"/>
      </router-link>
    </div>
  </section>
</template>
