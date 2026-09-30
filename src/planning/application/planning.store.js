import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {PlanningApi} from "../infrastructure/planning-api.js";
import {PlanningAssembler} from "../infrastructure/planning.assembler.js";
import {Reminder} from "../domain/model/reminder.entity.js";
import {Notification} from "../domain/model/notification.entity.js";
import {ReminderType} from "../domain/model/reminder-type.js";
import {CareCalendar} from "../domain/model/care-calendar.js";
import useMonitoringStore from "../../monitoring/application/monitoring.store.js";
import useProfilesStore from "../../profiles/application/profiles.store.js";

const planningApi = new PlanningApi();
const NOTIFICATIONS_REFRESH_MS = 60 * 1000;

/**
 * Application store for the Service Design and Planning context.
 */
const usePlanningStore = defineStore('planning', () => {
    const reminders = ref([]);
    const notifications = ref([]);
    const remindersForOlderAdultId = ref(null);
    const errors = ref([]);
    let refreshTimer = null;

    const pendingReminders = computed(() => reminders.value
        .filter(reminder => reminder.isPending())
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)));
    const sortedNotifications = computed(() => [...notifications.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    const unreadCount = computed(() => notifications.value.filter(notification => notification.isUnread()).length);

    // ---------- Reminders ----------

    /**
     * Loads the reminders of an older adult.
     * @param {number} olderAdultId - Older adult identifier.
     */
    async function fetchReminders(olderAdultId) {
        if (!olderAdultId) return;
        try {
            reminders.value = PlanningAssembler.toReminders(await planningApi.getReminders(olderAdultId));
            remindersForOlderAdultId.value = olderAdultId;
        } catch (error) {
            console.error(error);
            errors.value.push('planning.errors.load');
        }
    }

    /**
     * Saves a new reminder and adds it to the list.
     * @param {Reminder} reminder - Reminder to save.
     * @returns {Promise<Reminder|null>} Saved reminder.
     */
    async function saveReminder(reminder) {
        const saved = PlanningAssembler.toEntity(Reminder, await planningApi.createReminder(PlanningAssembler.toResource(reminder)));
        reminders.value.push(saved);
        return saved;
    }

    /**
     * Automatic reminders policy (US25).
     * Upcoming appointments and exams without result get a reminder when they
     * do not have one yet. Reminders of completed activities are cancelled,
     * so they are not shown as pending anymore (US25, scenario 2).
     * In the Vitalita API this will react to AppointmentScheduled and ExamRegistered.
     * @param {number} userId - Caregiver that receives the reminders.
     */
    async function syncAutomaticReminders(userId) {
        const monitoring = useMonitoringStore();
        const hasReminder = (type, recordId) => reminders.value.some(reminder =>
            reminder.type === type && reminder.relatedRecordId === recordId && reminder.status !== 'Cancelled');
        try {
            for (const appointment of monitoring.appointments) {
                if (appointment.isUpcoming() && !hasReminder(ReminderType.APPOINTMENT, appointment.id)) {
                    await saveReminder(Reminder.forAppointment(appointment, userId));
                }
            }
            for (const exam of monitoring.exams) {
                if (exam.isPending() && exam.performedAt && !hasReminder(ReminderType.EXAM_RESULT, exam.id)) {
                    await saveReminder(Reminder.forPendingExam(exam, userId));
                }
            }
            const finished = reminders.value.filter(reminder => reminder.isPending() && (
                (reminder.type === ReminderType.APPOINTMENT && monitoring.appointments.some(item => item.id === reminder.relatedRecordId && item.status !== 'Scheduled')) ||
                (reminder.type === ReminderType.EXAM_RESULT && monitoring.exams.some(item => item.id === reminder.relatedRecordId && !item.isPending()))
            ));
            for (const reminder of finished) {
                reminder.cancel();
                await planningApi.updateReminder(PlanningAssembler.toResource(reminder));
            }
        } catch (error) {
            console.error(error);
            errors.value.push('planning.errors.save');
        }
    }

    /**
     * Creates a personal reminder (US34).
     * @param {Object} data - Reminder data: olderAdultId, userId, message, scheduledAt and type.
     * @returns {Promise<boolean>} True when it was saved.
     */
    async function createPersonalReminder(data) {
        errors.value = [];
        let reminder;
        try {
            reminder = Reminder.createPersonal(data);
        } catch (error) {
            errors.value.push(error.message);
            return false;
        }
        try {
            await saveReminder(reminder);
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('planning.errors.save');
            return false;
        }
    }

    /**
     * Marks a reminder as reviewed (US25, scenario 3).
     * @param {Reminder} reminder - Reminder to update.
     */
    async function markReminderReviewed(reminder) {
        const updated = new Reminder({...reminder});
        updated.markReviewed();
        try {
            await planningApi.updateReminder(PlanningAssembler.toResource(updated));
            const index = reminders.value.findIndex(item => item.id === updated.id);
            reminders.value[index] = updated;
        } catch (error) {
            console.error(error);
            errors.value.push('planning.errors.save');
        }
    }

    // ---------- Calendar (US33) ----------

    /**
     * Builds the calendar of a month with appointments, therapies and reminders.
     * Appointment reminders are skipped because the appointment itself is shown.
     * @param {number} year - Year.
     * @param {number} month - Month from 0 to 11.
     * @returns {CareCalendar} Calendar read model.
     */
    function buildCalendar(year, month) {
        const monitoring = useMonitoringStore();
        const events = [
            ...monitoring.appointments.filter(item => item.status !== 'Cancelled').map(appointment => ({
                id: `appointment-${appointment.id}`, date: appointment.scheduledAt, type: 'Appointment',
                title: appointment.specialty, detail: appointment.location
            })),
            ...monitoring.careActivities.filter(activity => activity.activityType === 'Therapy').map(activity => ({
                id: `therapy-${activity.id}`, date: activity.performedAt, type: 'Therapy',
                title: activity.description, detail: ''
            })),
            ...reminders.value.filter(reminder => reminder.type !== ReminderType.APPOINTMENT && reminder.status !== 'Cancelled').map(reminder => ({
                id: `reminder-${reminder.id}`, date: reminder.scheduledAt, type: reminder.type,
                title: reminder.message, detail: ''
            }))
        ];
        return new CareCalendar({year, month, events});
    }

    // ---------- Notifications (US24) ----------

    /**
     * Loads the notifications of a user and refreshes them every minute.
     * @param {number} userId - Signed-in user.
     */
    async function startNotifications(userId) {
        const load = async () => {
            try {
                notifications.value = PlanningAssembler.toNotifications(await planningApi.getNotifications(userId));
            } catch (error) {
                console.error(error);
            }
        };
        stopNotifications();
        await load();
        refreshTimer = setInterval(load, NOTIFICATIONS_REFRESH_MS);
    }

    function stopNotifications() {
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = null;
        notifications.value = [];
    }

    /** @param {Notification} notification - Notification to mark as read. */
    async function markNotificationRead(notification) {
        if (!notification.isUnread()) return;
        const updated = new Notification({...notification});
        updated.markRead();
        await planningApi.updateNotification(PlanningAssembler.toResource(updated));
        const index = notifications.value.findIndex(item => item.id === updated.id);
        notifications.value[index] = updated;
    }

    async function markAllNotificationsRead() {
        for (const notification of notifications.value.filter(item => item.isUnread())) {
            await markNotificationRead(notification);
        }
    }

    /**
     * Sends a notification to every family member with active access (US24).
     * People without access never receive it (US24, scenario 2).
     * @param {Object} params - Notification data.
     * @param {number} params.olderAdultId - Older adult related.
     * @param {string} params.type - Notification type.
     * @param {string} params.title - Short title.
     * @param {string} params.message - Detail.
     */
    async function notifyFamilyMembers({olderAdultId, type, title, message}) {
        try {
            const recipientIds = await useProfilesStore().getActiveFamilyUserIds(olderAdultId);
            for (const recipientUserId of recipientIds) {
                await planningApi.createNotification(PlanningAssembler.toResource(
                    new Notification({recipientUserId, olderAdultId, type, title, message})));
            }
        } catch (error) {
            console.error(error);
        }
    }

    return {
        reminders, notifications, remindersForOlderAdultId, errors, pendingReminders, sortedNotifications, unreadCount,
        fetchReminders, syncAutomaticReminders, createPersonalReminder, markReminderReviewed, buildCalendar,
        startNotifications, stopNotifications, markNotificationRead, markAllNotificationsRead, notifyFamilyMembers
    };
});

export default usePlanningStore;
