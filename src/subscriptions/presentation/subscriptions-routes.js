// Lazy-loaded views
const planCatalog = () => import('./views/plan-catalog.vue');
const checkout = () => import('./views/checkout.vue');
const mySubscription = () => import('./views/my-subscription.vue');

const CAREGIVER = 'Caregiver';

const subscriptionsRoutes = [
    { path: 'plans',            name: 'subscriptions-plans',           component: planCatalog,    meta: { title: 'subscriptions.plans.title', roles: [CAREGIVER] } },
    { path: 'checkout/:planId', name: 'subscriptions-checkout',        component: checkout,       meta: { title: 'subscriptions.checkout.title', roles: [CAREGIVER] } },
    { path: 'my-subscription',  name: 'subscriptions-my-subscription', component: mySubscription, meta: { title: 'subscriptions.mine.title', roles: [CAREGIVER] } }
];

export default subscriptionsRoutes;
