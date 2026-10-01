// Lazy-loaded views
const familyHome = () => import('./views/family-home.vue');
const patientHistory = () => import('./views/patient-history.vue');

const dashboardRoutes = [
    { path: 'home',    name: 'dashboard-home',    component: familyHome,     meta: { title: 'dashboard.home.title', roles: ['FamilyMember'] } },
    { path: 'history', name: 'dashboard-history', component: patientHistory, meta: { title: 'dashboard.history.title' } }
];

export default dashboardRoutes;
