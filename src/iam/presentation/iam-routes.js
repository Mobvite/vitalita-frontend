// Lazy-loaded views
const signInForm = () => import('./views/sign-in-form.vue');
const signUpForm = () => import('./views/sign-up-form.vue');

const iamRoutes = [
    { path: 'sign-in', name: 'iam-sign-in', component: signInForm, meta: { title: 'iam.sign-in.title', layout: 'auth', public: true } },
    { path: 'sign-up', name: 'iam-sign-up', component: signUpForm, meta: { title: 'iam.sign-up.title', layout: 'auth', public: true } }
];

export default iamRoutes;
