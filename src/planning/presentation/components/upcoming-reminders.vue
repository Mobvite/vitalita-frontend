<script setup>
import {computed, onMounted, ref, watch} from "vue";
import useIamStore from "../../../iam/application/iam.store.js";
import usePlanningStore from "../../application/planning.store.js";
import useMonitoringStore from "../../../monitoring/application/monitoring.store.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";
import ReminderDialog from "./reminder-dialog.vue";

const props = defineProps({olderAdultId: {type: Number, default: null}, limit: {type: Number, default: 5}});
const iamStore = useIamStore();
const store = usePlanningStore();
const monitoringStore = useMonitoringStore();
const {formatDateTime} = useDateFormat();
const dialogVisible = ref(false);

const visibleReminders = computed(() => store.pendingReminders.slice(0, props.limit));

async function load() {
  if (!props.olderAdultId) return;
  await store.fetchReminders(props.olderAdultId);
  if (iamStore.isCaregiver) await store.syncAutomaticReminders(iamStore.currentUserId);
}

onMounted(load);
watch(() => props.olderAdultId, load);
// When monitoring loads new appointments or exams, the policy runs again
watch(() => monitoringStore.olderAdultId, load);
</script>

<template>
  <section class="vt-card" aria-labelledby="reminders-title">
    <div class="flex align-items-center justify-content-between mb-3">
      <h3 id="reminders-title" class="text-lg">{{ $t('planning.reminders.title') }}</h3>
      <span v-if="store.pendingReminders.length" class="vt-chip vt-chip--alert">{{ store.pendingReminders.length }}</span>
    </div>
    <p v-if="!visibleReminders.length" class="text-sm text-600 m-0">{{ $t('planning.reminders.empty') }}</p>
    <ul v-else class="list-none p-0 m-0 flex flex-column gap-2" aria-live="polite">
      <li v-for="reminder in visibleReminders" :key="reminder.id" class="reminder-row" :class="{'reminder-row--overdue': reminder.isOverdue()}">
        <div class="flex-1">
          <p class="m-0 text-sm font-semibold">{{ $t(`planning.types.${reminder.type}`) }} · {{ reminder.message }}</p>
          <p class="m-0 text-xs text-600">
            {{ formatDateTime(reminder.scheduledAt) }}
            <span v-if="reminder.isOverdue()" class="font-semibold overdue-label"> · {{ $t('planning.reminders.overdue') }}</span>
          </p>
        </div>
        <pv-button v-if="iamStore.isCaregiver" icon="pi pi-check" text rounded size="small"
                   :aria-label="$t('planning.reminders.review', {name: reminder.message})"
                   v-tooltip.left="$t('planning.reminders.mark-reviewed')" @click="store.markReminderReviewed(reminder)"/>
      </li>
    </ul>
    <pv-button v-if="iamStore.isCaregiver" :label="$t('planning.reminders.new')" icon="pi pi-plus" class="w-full mt-3"
               :disabled="!olderAdultId" @click="dialogVisible = true"/>
    <reminder-dialog v-model:visible="dialogVisible" :older-adult-id="olderAdultId" :user-id="iamStore.currentUserId"/>
  </section>
</template>

<style scoped>
.reminder-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem; border-radius: 10px; background: var(--vt-background); border-left: 3px solid var(--vt-secondary); }
.reminder-row--overdue { border-left-color: var(--vt-alert); background: #FFF7ED; }
.overdue-label { color: #C2410C; }
</style>
