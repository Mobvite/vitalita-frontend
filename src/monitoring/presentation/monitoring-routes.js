// Lazy-loaded views
const healthSummary = () => import('../presentation/views/health-summary.vue');
const patientNotes = () => import('../presentation/views/patient-notes.vue');
const medicalRecords = () => import('../presentation/views/medical-records.vue');

//./views/medical-records.vue

const monitoringRoutes = [
    { path: 'summary', name: 'monitoring-summary', component: healthSummary,  meta: { title: 'monitoring.summary.title', roles: ['Caregiver'] } },
    { path: 'notes',   name: 'monitoring-notes',   component: patientNotes,   meta: { title: 'monitoring.notes.title' } },
    { path: 'exams',   name: 'monitoring-exams',   component: medicalRecords, meta: { title: 'monitoring.records.title' } }
];

export default monitoringRoutes;
