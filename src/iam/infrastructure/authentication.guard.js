import useIamStore from "../application/iam.store.js";

/**
 * Navigation guard for Vitalita.
 * 1. Anonymous users can only open public routes.
 * 2. Signed-in users do not see the sign-in page again.
 * 3. A route with meta.roles is only open for those roles.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @param {import('vue-router').RouteLocationNormalized} from - Current route.
 * @returns {{name: string, query?: Object}|boolean} True to continue, or a route to redirect.
 */
export const authenticationGuard = (to, from) => {
    const store = useIamStore();
    store.validateSession();
    const isPublicRoute = to.meta['public'] === true;

    if (!store.isSignedIn && !isPublicRoute) {
        return {name: 'iam-sign-in', query: {redirect: to.fullPath}};
    }

    const isAuthPage = ['iam-sign-in', 'iam-sign-up', 'iam-family-sign-up'].includes(to.name);
    if (store.isSignedIn && isAuthPage) {
        return {name: 'home'};
    }

    const allowedRoles = to.meta['roles'] ?? [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(store.currentRole)) {
        return {name: 'home'};
    }
    return true;
}
