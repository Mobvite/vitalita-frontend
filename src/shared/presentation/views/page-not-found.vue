<script setup>
import {useRoute} from "vue-router";

const route = useRoute();
const unavailableRoute = route.path;
</script>

<template>
  <section class="flex flex-column align-items-center justify-content-center text-center gap-3 p-6 min-h-screen">
    <i class="pi pi-map text-6xl text-primary" aria-hidden="true"/>
    <h1 class="text-4xl">{{ $t('page-not-found.title') }}</h1>
    <p class="m-0 text-600">{{ $t('page-not-found.content', {'unavailable-route': unavailableRoute}) }}</p>
    <router-link to="/home">
      <pv-button :label="$t('page-not-found.go-home')" icon="pi pi-home"/>
    </router-link>
  </section>
</template>
