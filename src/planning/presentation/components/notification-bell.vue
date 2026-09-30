<script setup>
import {onMounted, onUnmounted, ref, watch} from "vue";
import useIamStore from "../../../iam/application/iam.store.js";
import usePlanningStore from "../../application/planning.store.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";

const iamStore = useIamStore();
const store = usePlanningStore();
const {formatDateTime} = useDateFormat();
const open = ref(false);
const typeIcon = {HealthUpdate: 'pi-heart', AppointmentUpdate: 'pi-calendar', ExamUpdate: 'pi-folder', Emergency: 'pi-exclamation-triangle', Invitation: 'pi-user-plus'};

onMounted(() => store.startNotifications(iamStore.currentUserId));
onUnmounted(store.stopNotifications);
watch(() => iamStore.currentUserId, (userId) => userId && store.startNotifications(userId));
</script>

<template>
  <pv-button icon="pi pi-bell" text rounded :badge="store.unreadCount ? String(store.unreadCount) : undefined" badge-severity="warn"
             :aria-label="$t('planning.notifications.open', {count: store.unreadCount})" aria-haspopup="dialog"
             :aria-expanded="open" @click="open = true"/>
  <pv-drawer v-model:visible="open" position="right" :header="$t('planning.notifications.title')" class="notifications-drawer">
    <div class="flex justify-content-between align-items-center mb-3">
      <span class="vt-chip vt-chip--alert">{{ $t('planning.notifications.unread', {count: store.unreadCount}, store.unreadCount) }}</span>
      <pv-button :label="$t('planning.notifications.read-all')" text size="small" :disabled="!store.unreadCount"
                 @click="store.markAllNotificationsRead()"/>
    </div>
    <p v-if="!store.sortedNotifications.length" class="text-600">{{ $t('planning.notifications.empty') }}</p>
    <ul v-else class="list-none p-0 m-0 flex flex-column gap-2" aria-live="polite">
      <li v-for="notification in store.sortedNotifications" :key="notification.id">
        <button type="button" class="notification-item" :class="{'notification-item--unread': notification.isUnread()}"
                @click="store.markNotificationRead(notification)">
          <i :class="['pi', typeIcon[notification.type] ?? 'pi-info-circle']" aria-hidden="true"/>
          <span class="flex-1 text-left">
            <strong class="block text-sm">{{ notification.title }}</strong>
            <span class="block text-sm text-600">{{ notification.message }}</span>
            <span class="block text-xs text-500">{{ formatDateTime(notification.createdAt) }}</span>
          </span>
          <span v-if="notification.isUnread()" class="unread-dot" :aria-label="$t('planning.notifications.new')"/>
        </button>
      </li>
    </ul>
  </pv-drawer>
</template>

<style scoped>
.notification-item {
  display: flex; gap: 0.75rem; width: 100%; border: none; cursor: pointer; text-align: left;
  padding: 0.8rem; border-radius: 10px; background: var(--vt-background); color: var(--vt-text); font: inherit;
}
.notification-item--unread { background: var(--vt-mint); }
.notification-item .pi { color: var(--vt-primary); margin-top: 0.2rem; }
.unread-dot { width: 0.6rem; height: 0.6rem; border-radius: 50%; background: var(--vt-alert); margin-top: 0.35rem; }
</style>
