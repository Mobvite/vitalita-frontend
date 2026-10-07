export const DEMO_REMINDER_STATUS = Object.freeze({
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
});

export function createDemoReminder(attributes = {}) {
    const scheduledAt = new Date(
        attributes.scheduledAt ?? '2026-01-01T10:00:00Z'
    );

    if (Number.isNaN(scheduledAt.getTime())) {
        throw new TypeError('Fecha inválida');
    }

    const status = attributes.status ?? DEMO_REMINDER_STATUS.PENDING;

    if (!Object.values(DEMO_REMINDER_STATUS).includes(status)) {
        throw new TypeError('Estado inválido');
    }

    return Object.freeze({
        id: String(attributes.id ?? 'demo-reminder'),
        title: String(attributes.title ?? 'Recordatorio de ejemplo'),
        description: String(attributes.description ?? ''),
        scheduledAt: scheduledAt.toISOString(),
        patientId: String(attributes.patientId ?? 'demo-patient'),
        status,
        demo: true
    });
}

export function changeDemoReminderStatus(reminder, status) {
    return createDemoReminder({...reminder, status});
}

export function classifyDemoReminder(reminder, referenceTime) {
    const now = new Date(referenceTime).getTime();

    if (!Number.isFinite(now)) {
        throw new TypeError('Fecha de referencia inválida');
    }

    if (reminder.status !== DEMO_REMINDER_STATUS.PENDING) {
        return reminder.status;
    }

    const remaining = Date.parse(reminder.scheduledAt) - now;

    if (remaining < 0) {
        return 'overdue';
    }

    if (remaining <= 60 * 60 * 1000) {
        return 'upcoming';
    }

    return 'scheduled';
}

export function sortDemoReminders(reminders) {
    return [...reminders].sort(
        (left, right) =>
            Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt)
    );
}

export function groupDemoReminders(reminders, referenceTime) {
    const groups = {
        overdue: [],
        upcoming: [],
        scheduled: [],
        completed: [],
        cancelled: []
    };

    for (const reminder of sortDemoReminders(reminders)) {
        groups[classifyDemoReminder(reminder, referenceTime)].push(reminder);
    }

    return groups;
}

export function formatDemoReminderDate(reminder, locale = 'es-PE') {
    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Lima'
    }).format(new Date(reminder.scheduledAt));
}

export function summarizeDemoReminders(reminders, referenceTime) {
    const groups = groupDemoReminders(reminders, referenceTime);

    return {
        total: reminders.length,
        pending:
            groups.overdue.length +
            groups.upcoming.length +
            groups.scheduled.length,
        completed: groups.completed.length,
        cancelled: groups.cancelled.length,
        next: groups.upcoming[0] ?? groups.scheduled[0] ?? null
    };
}

export function buildReminderPreviewExample() {
    const reminders = [
        {
            id: 'demo-a',
            title: 'Cita de ejemplo',
            scheduledAt: '2026-01-01T14:00:00Z'
        },
        {
            id: 'demo-b',
            title: 'Examen de ejemplo',
            scheduledAt: '2026-01-02T14:00:00Z'
        },
        {
            id: 'demo-c',
            title: 'Actividad de ejemplo',
            status: DEMO_REMINDER_STATUS.COMPLETED
        }
    ].map(createDemoReminder);

    return summarizeDemoReminders(
        reminders,
        '2026-01-01T13:30:00Z'
    );
}
