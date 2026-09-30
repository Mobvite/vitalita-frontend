<script setup>
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";

defineProps({
  type: {type: String, required: true},
  sign: {type: Object, default: null},
  icon: {type: String, required: true},
  tone: {type: String, default: 'red'}
});
const {formatTime} = useDateFormat();
</script>

<template>
  <article class="vt-card h-full" :aria-label="$t(`monitoring.vital-types.${type}`)">
    <div class="flex align-items-center gap-3">
      <span class="vital-icon" :class="`vital-icon--${tone}`" aria-hidden="true"><i :class="icon"/></span>
      <p class="m-0 text-sm text-600">{{ $t(`monitoring.vital-types.${type}`) }}</p>
    </div>
    <p v-if="sign" class="vital-value">
      {{ sign.displayValue }}<span class="vital-unit">{{ sign.unit }}</span>
    </p>
    <p v-else class="vital-value text-400">--</p>
    <span v-if="sign" class="vt-chip">{{ $t('monitoring.summary.measured-at', {time: formatTime(sign.measuredAt)}) }}</span>
  </article>
</template>

<style scoped>
.vital-icon { width: 2.25rem; height: 2.25rem; border-radius: 10px; display: grid; place-items: center; }
.vital-icon--red { background: #FEE2E2; color: #DC2626; }
.vital-icon--orange { background: #FFEDD5; color: var(--vt-alert); }
.vital-icon--blue { background: var(--vt-info); color: #0369A1; }
.vital-icon--teal { background: var(--vt-mint); color: var(--vt-primary); }
.vital-value { font-size: 2rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
.vital-unit { font-size: 0.85rem; font-weight: 500; color: var(--vt-text-secondary); margin-left: 0.25rem; }
</style>
