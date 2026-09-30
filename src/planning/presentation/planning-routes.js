// Lazy-loaded views
const careCalendar = () => import('./views/care-calendar.vue');

const planningRoutes = [
    { path: 'calendar', name: 'planning-calendar', component: careCalendar, meta: { title: 'planning.calendar.title' } }
];

export default planningRoutes;
