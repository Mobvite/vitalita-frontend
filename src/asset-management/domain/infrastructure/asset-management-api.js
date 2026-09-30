import {BaseApi} from "../../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";

const env = import.meta.env;

/**
 * Infrastructure gateway for the Resource and Asset Management context.
 * It only stores metadata. The files live in the object storage.
 *
 * @class AssetManagementApi
 * @extends BaseApi
 */
export class AssetManagementApi extends BaseApi {
    #clinicalAssets;
    #examEvidences;
    #emergencyReports;

    constructor() {
        super();
        this.#clinicalAssets = new BaseEndpoint(this, env.VITE_CLINICAL_ASSETS_ENDPOINT_PATH);
        this.#examEvidences = new BaseEndpoint(this, env.VITE_EXAM_EVIDENCES_ENDPOINT_PATH);
        this.#emergencyReports = new BaseEndpoint(this, env.VITE_EMERGENCY_REPORTS_ENDPOINT_PATH);
    }

    getClinicalAssets(olderAdultId) { return this.#clinicalAssets.getAll({olderAdultId}); }
    createClinicalAsset(resource) { return this.#clinicalAssets.create(resource); }

    getEvidencesByExamIds(examIds) { return this.#examEvidences.getAll({examId: examIds}); }
    createEvidence(resource) { return this.#examEvidences.create(resource); }

    getEmergencyReports(olderAdultId) { return this.#emergencyReports.getAll({olderAdultId}); }
    createEmergencyReport(resource) { return this.#emergencyReports.create(resource); }
}
