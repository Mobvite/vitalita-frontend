<script setup>
import {watch} from "vue";
import {useI18n} from "vue-i18n";
import {LOCALE_STORAGE_KEY} from "../../../i18n.js";

defineProps({variant: {type: String, default: 'default'}});
const {locale, availableLocales} = useI18n();

watch(locale, (value) => {
  localStorage.setItem(LOCALE_STORAGE_KEY, value);
  document.documentElement.lang = value;
}, {immediate: true});
</script>

<template>
  <pv-select-button v-model="locale" :options="availableLocales" :allow-empty="false"
                    :class="{'inverted': variant === 'inverted'}" :aria-label="$t('language.label')">
    <template #option="slotProps">
      <span :lang="slotProps.option">{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>
