export const DEMO_FEATURE_LABELS = Object.freeze({
    patients: 'Adultos mayores',
    evidence: 'Evidencias clínicas',
    emergencyExport: 'Exportación de resumen',
    calendar: 'Calendario de cuidados'
});

export const DEMO_PLANS = Object.freeze([
    Object.freeze({
        id: 'demo-basic',
        name: 'Básico de ejemplo',
        priceInCents: 0,
        currency: 'PEN',
        patients: 1,
        evidence: false,
        emergencyExport: false,
        calendar: true
    }),
    Object.freeze({
        id: 'demo-plus',
        name: 'Plus de ejemplo',
        priceInCents: 1000,
        currency: 'PEN',
        patients: 3,
        evidence: true,
        emergencyExport: true,
        calendar: true
    }),
    Object.freeze({
        id: 'demo-team',
        name: 'Equipo de ejemplo',
        priceInCents: 2500,
        currency: 'PEN',
        patients: 10,
        evidence: true,
        emergencyExport: true,
        calendar: true
    })
]);

export function formatDemoPrice(plan, locale = 'es-PE') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: plan.currency
    }).format(plan.priceInCents / 100);
}

export function describeDemoFeature(value) {
    if (typeof value === 'boolean') {
        return value ? 'Incluido' : 'No incluido';
    }

    if (typeof value === 'number') {
        return String(value);
    }

    return 'Sin información';
}

export function createDemoComparison(plans = DEMO_PLANS) {
    return Object.entries(DEMO_FEATURE_LABELS).map(([key, label]) => ({
        key,
        label,
        values: plans.map(plan => ({
            planId: plan.id,
            value: plan[key],
            description: describeDemoFeature(plan[key])
        }))
    }));
}

export function findDemoPlansForPatients(patientCount, plans = DEMO_PLANS) {
    if (!Number.isInteger(patientCount) || patientCount < 1) {
        throw new TypeError(
            'La cantidad de pacientes debe ser un entero positivo'
        );
    }

    return plans
        .filter(plan => plan.patients >= patientCount)
        .sort((left, right) => left.priceInCents - right.priceInCents);
}

export function describeDemoUpgrade(current, target) {
    return {
        currentPlan: current.name,
        targetPlan: target.name,
        priceDifferenceInCents: target.priceInCents - current.priceInCents,
        additionalPatients: target.patients - current.patients,
        newlyAvailable: Object.keys(DEMO_FEATURE_LABELS).filter(
            key => current[key] === false && target[key] === true
        ),
        demonstrationOnly: true
    };
}
