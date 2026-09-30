/**
 * Reusable endpoint client with CRUD operations over a resource collection.
 *
 * @class BaseEndpoint
 */
export class BaseEndpoint {
    /**
     * @param {import('./base-api.js').BaseApi} baseApi - Configured API client owner.
     * @param {string} endpointPath - Relative resource path.
     */
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http;
        this.endpointPath = endpointPath;
    }

    /**
     * Gets the resource collection. Filters are sent as query params,
     * for example { olderAdultId: 1 } becomes ?olderAdultId=1.
     * @param {Object} [params={}] - Optional query params.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with the collection.
     */
    getAll(params = {}) {
        return this.http.get(this.endpointPath, {params});
    }

    /**
     * @param {string|number} id - Resource identifier.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with one resource.
     */
    getById(id) {
        return this.http.get(`${this.endpointPath}/${id}`);
    }

    /**
     * @param {Object} resource - Resource payload to create.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with the created resource.
     */
    create(resource) {
        return this.http.post(this.endpointPath, resource);
    }

    /**
     * @param {string|number} id - Resource identifier.
     * @param {Object} resource - Resource payload to update.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with the updated resource.
     */
    update(id, resource) {
        return this.http.put(`${this.endpointPath}/${id}`, resource);
    }

    /**
     * Updates only the fields sent in the payload.
     * @param {string|number} id - Resource identifier.
     * @param {Object} changes - Fields to change.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response with the updated resource.
     */
    patch(id, changes) {
        return this.http.patch(`${this.endpointPath}/${id}`, changes);
    }

    /**
     * @param {string|number} id - Resource identifier.
     * @returns {Promise<import('axios').AxiosResponse>} HTTP response for the delete operation.
     */
    delete(id) {
        return this.http.delete(`${this.endpointPath}/${id}`);
    }
}
