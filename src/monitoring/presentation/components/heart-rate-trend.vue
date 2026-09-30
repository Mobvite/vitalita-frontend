<script setup>
import {computed} from "vue";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";

const props = defineProps({signs: {type: Array, default: () => []}});
const {formatTime} = useDateFormat();
const width = 480;
const height = 140;
const padding = 12;

const points = computed(() => {
  const values = props.signs.map(sign => sign.value);
  if (values.length < 2) return [];
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const stepX = (width - padding * 2) / (values.length - 1);
  return values.map((value, index) => ({
    x: padding + index * stepX,
    y: height - padding - ((value - min) / (max - min)) * (height - padding * 2)
  }));
});

const path = computed(() => points.value.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' '));
const summary = computed(() => props.signs.map(sign => `${formatTime(sign.measuredAt)}: ${sign.value} bpm`).join(', '));
</script>

<template>
  <figure class="m-0">
    <svg v-if="points.length" :viewBox="`0 0 ${width} ${height}`" class="w-full" role="img" :aria-label="summary">
      <line v-for="line in 3" :key="line" :x1="padding" :x2="width - padding"
            :y1="(height / 4) * line" :y2="(height / 4) * line" stroke="#E2E8F0"/>
      <path :d="path" fill="none" stroke="#14B8A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle v-for="(point, index) in points" :key="index" :cx="point.x" :cy="point.y" r="3.5" fill="#0F766E"/>
    </svg>
    <p v-else class="text-sm text-600">{{ $t('monitoring.summary.no-trend') }}</p>
  </figure>
</template>
