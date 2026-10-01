const DAYS_IN_WEEK = 7;

/**
 * Read model for the care calendar (US33).
 * It shows events of other contexts (appointments) together with reminders.
 */
export class CareCalendar {
    /**
     * @param {Object} params - Calendar data.
     * @param {number} params.year - Year shown.
     * @param {number} params.month - Month shown, from 0 (January) to 11.
     * @param {Array<{id: string, date: string, type: string, title: string, detail: string}>} [params.events=[]] - Events.
     */
    constructor({year, month, events = []}) {
        this.year = year;
        this.month = month;
        this.events = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Events of one day, in time order.
     * @param {Date} day - Day to look for.
     * @returns {Array<Object>} Events of that day.
     */
    eventsOn(day) {
        return this.events.filter(event => new Date(event.date).toDateString() === day.toDateString());
    }

    /**
     * Next events from now.
     * @param {number} [limit=3] - Max number of events.
     * @returns {Array<Object>} Upcoming events.
     */
    upcoming(limit = 3) {
        const now = new Date();
        return this.events.filter(event => new Date(event.date) >= now).slice(0, limit);
    }

    /**
     * Grid of the month in weeks from Monday to Sunday.
     * Days of the previous and next month fill the first and last week.
     * @returns {Array<Array<{date: Date, inMonth: boolean, isToday: boolean, events: Array<Object>}>>} Weeks.
     */
    weeks() {
        const firstDay = new Date(this.year, this.month, 1);
        // getDay() returns 0 for Sunday; we move it so Monday is the first column
        const offset = (firstDay.getDay() + 6) % DAYS_IN_WEEK;
        const start = new Date(this.year, this.month, 1 - offset);
        const lastDay = new Date(this.year, this.month + 1, 0);
        const totalDays = Math.ceil((offset + lastDay.getDate()) / DAYS_IN_WEEK) * DAYS_IN_WEEK;
        const today = new Date().toDateString();

        const weeks = [];
        for (let index = 0; index < totalDays; index++) {
            const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
            if (index % DAYS_IN_WEEK === 0) weeks.push([]);
            weeks.at(-1).push({
                date,
                inMonth: date.getMonth() === this.month,
                isToday: date.toDateString() === today,
                events: this.eventsOn(date)
            });
        }
        return weeks;
    }
}
