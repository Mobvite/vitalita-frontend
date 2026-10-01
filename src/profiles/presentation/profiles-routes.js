// Lazy-loaded views
const olderAdultList = () => import('./views/older-adult-list.vue');
const olderAdultForm = () => import('./views/older-adult-form.vue');
const familyMemberList = () => import('./views/family-member-list.vue');
const caregiverProfile = () => import('./views/caregiver-profile.vue');

const CAREGIVER = 'Caregiver';

const profilesRoutes = [
    { path: 'older-adults',          name: 'profiles-older-adults',     component: olderAdultList,   meta: { title: 'profiles.older-adults.title', roles: [CAREGIVER] } },
    { path: 'older-adults/new',      name: 'profiles-older-adult-new',  component: olderAdultForm,   meta: { title: 'profiles.older-adult-form.new-title', roles: [CAREGIVER] } },
    { path: 'older-adults/:id/edit', name: 'profiles-older-adult-edit', component: olderAdultForm,   meta: { title: 'profiles.older-adult-form.edit-title', roles: [CAREGIVER] } },
    { path: 'family-members',        name: 'profiles-family-members',   component: familyMemberList, meta: { title: 'profiles.family.title' } },
    { path: 'caregiver-profile',     name: 'profiles-caregiver-profile', component: caregiverProfile, meta: { title: 'profiles.caregiver.title' } }
];

export default profilesRoutes;
