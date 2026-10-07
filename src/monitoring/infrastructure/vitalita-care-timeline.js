/**
 * Ejemplo aislado de una línea de tiempo de cuidados de Vitalita.
 * No está integrado con Vue, Pinia, JSON Server ni datos de pacientes.
 */
export const CARE_EVENT_TYPES = Object.freeze({
    REPORT: 'daily-report',
    MEDICATION: 'medication',
    APPOINTMENT: 'appointment',
    EXAM: 'medical-exam',
    NOTE: 'patient-note'
});

const EVENT_LABELS = Object.freeze({
    'daily-report': 'Reporte diario',
    medication: 'Administración de medicamento',
    appointment: 'Cita médica',
    'medical-exam': 'Examen médico',
    'patient-note': 'Nota del paciente'
});

export function createCareEvent(attributes = {}) {
    const date = new Date(attributes.date ?? '2026-01-01T12:00:00Z');

    if (Number.isNaN(date.getTime())) {
        throw new TypeError('Fecha inválida');
    }

    const type = attributes.type ?? CARE_EVENT_TYPES.NOTE;

    if (!Object.values(CARE_EVENT_TYPES).includes(type)) {
        throw new TypeError('Tipo de evento desconocido');
    }

    return Object.freeze({
        id: String(attributes.id ?? 'demo-event'),
        patientId: String(attributes.patientId ?? 'demo-patient'),
        type,
        title: String(attributes.title ?? EVENT_LABELS[type]),
        description: String(attributes.description ?? ''),
        date: date.toISOString(),
        author: String(attributes.author ?? 'Cuidador de demostración')
    });
}

export function sortCareEvents(events, newestFirst = true) {
    return [...events].sort((left, right) => {
        const difference = Date.parse(left.date) - Date.parse(right.date);
        return newestFirst ? -difference : difference;
    });
}

export function filterCareEvents(events, filters = {}) {
    const search = String(filters.search ?? '').trim().toLowerCase();

    return events.filter(event => {
        if (filters.patientId && event.patientId !== filters.patientId) {
            return false;
        }

        if (filters.type && event.type !== filters.type) {
            return false;
        }

        if (filters.from && Date.parse(event.date) < Date.parse(filters.from)) {
            return false;
        }

        if (filters.to && Date.parse(event.date) > Date.parse(filters.to)) {
            return false;
        }

        const searchable = ${event.title} ${event.description} ${event.author};

        return !search || searchable.toLowerCase().includes(search);
    });
}

export function groupCareEventsByDay(events) {
    const groups = new Map();

    for (const event of sortCareEvents(events)) {
        const day = event.date.slice(0, 10);

        if (!groups.has(day)) {
            groups.set(day, []);
        }

        groups.get(day).push(event);
    }

    return Array.from(groups, ([day, items]) => ({day, items}));
}

export function summarizeCareEvents(events) {
    const counts = Object.fromEntries(
        Object.values(CARE_EVENT_TYPES).map(type => [type, 0])
    );

    for (const event of events) {
        counts[event.type] = (counts[event.type] ?? 0) + 1;
    }

    return {
        total: events.length,
        counts,
        latest: sortCareEvents(events)[0] ?? null
    };
}

export function buildCareTimelineExample() {
    const events = [
        {
            id: 'demo-1',
            type: CARE_EVENT_TYPES.REPORT,
            title: 'Seguimiento de la mañana'
        },
        {
            id: 'demo-2',
            type: CARE_EVENT_TYPES.EXAM,
            title: 'Perfil lipídico de ejemplo'
        },
        {
            id: 'demo-3',
            type: CARE_EVENT_TYPES.NOTE,
            description: 'Datos ficticios para demostración'
        }
    ].map(createCareEvent);

    return {
        events,
        groups: groupCareEventsByDay(events),
        summary: summarizeCareEvents(events)
    };
}
