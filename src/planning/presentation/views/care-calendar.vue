<script setup>
import {computed, ref} from "vue";
import {usePlanningData} from "../composables/use-planning-data.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";
import UpcomingReminders from "../components/upcoming-reminders.vue";
import ReminderDialog from "../components/reminder-dialog.vue";

const {iamStore, profilesStore, planningStore} = usePlanningData();
const {formatDate, formatTime} = useDateFormat();

const today = new Date();
const year = ref(today.getFullYear());
const month = ref(today.getMonth());
const selectedDay = ref(today);
const dialogVisible = ref(false);

const calendar = computed(() => planningStore.buildCalendar(year.value, month.value));
const weeks = computed(() => calendar.value.weeks());
const selectedEvents = computed(() => calendar.value.eventsOn(selectedDay.value));
const monthLabel = computed(() => formatDate(new Date(year.value, month.value, 1), {month: 'long', year: 'numeric'}));
// Monday 2 Jan 2023 is used only to get the translated day names from Monday to Sunday
const weekDays = computed(() => Array.from({length: 7}, (_, index) => formatDate(new Date(2023, 0, 2 + index), {weekday: 'short'})));
const eventColor = {Appointment: 'orange', Therapy: 'purple', Medication: 'blue', ExamResult: 'teal', Other: 'gray'};

function moveMonth(step) {
  const date = new Date(year.value, month.value + step, 1);
  year.value = date.getFullYear();
  month.value = date.getMonth();
}

function goToday() {
  year.value = today.getFullYear();
  month.value = today.getMonth();
  selectedDay.value = new Date();
}

function isSelected(date) {
  return date.toDateString() === selectedDay.value.toDateString();
}
</script>

<template>
  <section aria-labelledby="calendar-title">
    <div class="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h2 id="calendar-title" class="vt-page-title">{{ $t('planning.calendar.heading', {name: profilesStore.selectedOlderAdult?.fullName ?? ''}) }}</h2>
        <p class="vt-page-subtitle">{{ $t('planning.calendar.subtitle') }}</p>
      </div>
      <pv-button v-if="iamStore.isCaregiver" :label="$t('planning.reminders.new')" icon="pi pi-plus"
                 :disabled="!profilesStore.selectedOlderAdult" @click="dialogVisible = true"/>
    </div>

    <div class="grid">
      <div class="col-12 xl:col-8">
        <article class="vt-card">
          <div class="flex align-items-center justify-content-between mb-3">
            <h3 class="text-xl capitalize" aria-live="polite">{{ monthLabel }}</h3>
            <div class="flex gap-2">
              <pv-button icon="pi pi-chevron-left" outlined rounded :aria-label="$t('planning.calendar.previous')" @click="moveMonth(-1)"/>
              <pv-button :label="$t('planning.calendar.today')" outlined @click="goToday"/>
              <pv-button icon="pi pi-chevron-right" outlined rounded :aria-label="$t('planning.calendar.next')" @click="moveMonth(1)"/>
            </div>
          </div>
          <div class="calendar-scroll">
            <table class="calendar" role="grid" :aria-label="monthLabel">
              <thead>
                <tr><th v-for="day in weekDays" :key="day" scope="col" class="uppercase">{{ day }}</th></tr>
              </thead>
              <tbody>
                <tr v-for="(week, index) in weeks" :key="index">
                  <td v-for="day in week" :key="day.date.toISOString()" role="gridcell" :aria-selected="isSelected(day.date)">
                    <button type="button" class="day" :class="{'day--outside': !day.inMonth, 'day--today': day.isToday, 'day--selected': isSelected(day.date)}"
                            :aria-label="`${formatDate(day.date, {weekday: 'long', day: 'numeric', month: 'long'})}, ${$t('planning.calendar.events', {count: day.events.length}, day.events.length)}`"
                            @click="selectedDay = day.date">
                      <span class="day-number">{{ day.date.getDate() }}</span>
                      <span v-for="event in day.events.slice(0, 2)" :key="event.id" class="event-chip" :class="`event--${eventColor[event.type] ?? 'gray'}`" aria-hidden="true">
                        {{ event.title }}
                      </span>
                      <span v-if="day.events.length > 2" class="text-xs text-600" aria-hidden="true">+{{ day.events.length - 2 }}</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="vt-card mt-3" aria-labelledby="day-title">
          <h3 id="day-title" class="text-lg mb-3 capitalize">{{ formatDate(selectedDay, {weekday: 'long', day: 'numeric', month: 'long'}) }}</h3>
          <p v-if="!selectedEvents.length" class="m-0 text-600">{{ $t('planning.calendar.no-events') }}</p>
          <ul v-else class="list-none p-0 m-0 flex flex-column gap-2">
            <li v-for="event in selectedEvents" :key="event.id" class="flex align-items-center gap-3">
              <span class="event-time">{{ formatTime(event.date) }}</span>
              <span class="event-chip" :class="`event--${eventColor[event.type] ?? 'gray'}`">{{ $t(`planning.types.${event.type}`) }}</span>
              <span class="flex-1">{{ event.title }} <span v-if="event.detail" class="text-600 text-sm">· {{ event.detail }}</span></span>
            </li>
          </ul>
        </article>
      </div>

      <div class="col-12 xl:col-4 flex flex-column gap-3">
        <article class="vt-card" aria-labelledby="upcoming-title">
          <h3 id="upcoming-title" class="text-lg mb-3">{{ $t('planning.calendar.upcoming') }}</h3>
          <p v-if="!calendar.upcoming().length" class="m-0 text-sm text-600">{{ $t('planning.calendar.no-upcoming') }}</p>
          <ul v-else class="list-none p-0 m-0 flex flex-column gap-2">
            <li v-for="event in calendar.upcoming()" :key="event.id" class="upcoming-row">
              <span class="upcoming-date" :class="`event--${eventColor[event.type] ?? 'gray'}`">{{ formatDate(event.date, {day: '2-digit', month: 'short'}) }}</span>
              <span>
                <strong class="block text-sm">{{ formatTime(event.date) }} · {{ event.title }}</strong>
                <span class="text-xs text-600">{{ event.detail || $t(`planning.types.${event.type}`) }}</span>
              </span>
            </li>
          </ul>
        </article>
        <upcoming-reminders :older-adult-id="profilesStore.selectedOlderAdult?.id ?? null" :limit="4"/>
      </div>
    </div>

    <reminder-dialog v-model:visible="dialogVisible" :older-adult-id="profilesStore.selectedOlderAdult?.id ?? null" :user-id="iamStore.currentUserId"/>
  </section>
</template>

<style scoped>
.calendar-scroll { overflow-x: auto; }
.calendar { width: 100%; min-width: 36rem; border-collapse: separate; border-spacing: 0.35rem; table-layout: fixed; }
.calendar th { font-size: 0.7rem; color: var(--vt-text-secondary); font-weight: 600; text-align: left; padding: 0 0.25rem; }
.calendar td { padding: 0; vertical-align: top; }
.day {
  width: 100%; min-height: 5.5rem; display: flex; flex-direction: column; align-items: stretch; gap: 0.2rem;
  border: 1px solid var(--vt-border); border-radius: 10px; background: var(--vt-surface); padding: 0.4rem;
  cursor: pointer; font: inherit; text-align: left; color: var(--vt-text);
}
.day:hover { border-color: var(--vt-secondary); }
.day--outside { background: var(--vt-background); color: #94A3B8; }
.day--today { border: 2px solid var(--vt-secondary); }
.day--selected { background: var(--vt-mint); }
.day-number { font-weight: 600; font-size: 0.85rem; }
.event-chip { font-size: 0.68rem; font-weight: 600; padding: 0.15rem 0.4rem; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.event-time { font-weight: 600; font-size: 0.85rem; min-width: 3rem; }
.event--orange { background: #FFEDD5; color: #C2410C; }
.event--purple { background: #EDE9FE; color: #6D28D9; }
.event--blue { background: var(--vt-info); color: #0369A1; }
.event--teal { background: var(--vt-mint); color: var(--vt-primary); }
.event--gray { background: #F1F5F9; color: #475569; }
.upcoming-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem; border-radius: 10px; background: var(--vt-background); }
.upcoming-date { font-size: 0.7rem; font-weight: 700; padding: 0.5rem; border-radius: 8px; text-align: center; min-width: 3.5rem; text-transform: uppercase; }
</style>
