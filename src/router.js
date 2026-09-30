import {createRouter, createWebHistory} from "vue-router";
import iamRoutes from "./iam/presentation/iam-routes.js";
import profilesRoutes from "./profiles/presentation/profiles-routes.js";
import monitoringRoutes from "./monitoring/presentation/monitoring-routes.js";
import assetManagementRoutes from "./asset-management/presentation/asset-management-routes.js";
import dashboardRoutes from "./dashboard/presentation/dashboard-routes.js";
import planningRoutes from "./planning/presentation/planning-routes.js";
import subscriptionsRoutes from "./subscriptions/presentation/subscriptions-routes.js";
import useIamStore from "./iam/application/iam.store.js";
import {authenticationGuard} from "./iam/infrastructure/authentication.guard.js";
import i18n from "./i18n.js";

// Lazy-loaded views of the shared context
const home = () => import('./shared/presentation/views/home.vue');
const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

/**
 * Sends each role to its own home page: the caregiver to the health summary
 * and the family member to the family dashboard.
 * @returns {{name: string}} Route to open.
 */
function redirectToRoleHome() {
    const iamStore = useIamStore();
    return iamStore.isCaregiver ? {name: 'monitoring-summary'} : {name: 'dashboard-home'};
}

/**
 * Route meta fields used in Vitalita:
 * - title: i18n key shown in the top bar and in the browser tab.
 * - layout: 'auth' hides the side navigation (sign-in and sign-up pages).
 * - public: true when the page does not need a signed-in user.
 * - roles: list of roles that can open the page. Empty means any signed-in user.
 */
const routes = [
    { path: '/home',             name: 'home',      component: home,         meta: { title: 'navigation.home' }, beforeEnter: redirectToRoleHome },
    { path: '/iam',              name: 'iam',       children: iamRoutes },
    { path: '/profiles',         name: 'profiles',  children: profilesRoutes },
    { path: '/monitoring',       name: 'monitoring', children: monitoringRoutes },
    { path: '/asset-management', name: 'asset-management', children: assetManagementRoutes },
    { path: '/dashboard',        name: 'dashboard', children: dashboardRoutes },
    { path: '/planning',         name: 'planning',  children: planningRoutes },
    { path: '/subscriptions',    name: 'subscriptions', children: subscriptionsRoutes },
    { path: '/',                 redirect: '/home' },
    { path: '/:pathMatch(.*)*',  name: 'not-found', component: pageNotFound, meta: { title: 'page-not-found.title', public: true } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
});

/**
 * Global guard. It updates the browser tab title and checks access rules.
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @param {import('vue-router').RouteLocationNormalized} from - Previous route.
 * @returns {{name: string}|boolean} True to continue, or a route to redirect.
 */
router.beforeEach((to, from) => {
    const baseTitle = 'Vitalita';
    const titleKey = to.meta['title'];
    document.title = titleKey ? `${baseTitle} - ${i18n.global.t(titleKey)}` : baseTitle;
    return authenticationGuard(to, from);
});

export default router;
