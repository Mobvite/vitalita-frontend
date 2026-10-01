// Lazy-loaded views
const emergencySummary = () => import('./views/emergency-summary.vue');

const assetManagementRoutes = [
    { path: 'emergency-summary', name: 'asset-management-emergency-summary', component: emergencySummary, meta: { title: 'asset-management.emergency.title' } }
];

export default assetManagementRoutes;
