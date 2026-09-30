import {ClinicalAsset} from "../model/clinical-asset.entity.js"
import {ExamEvidence} from "../model/exam-evidence.entity.js";
import {EmergencyReport} from "../model/emergency-report.entity.js";

/**
 * Builds entities from an HTTP response with a collection.
 * @param {import('axios').AxiosResponse} response - HTTP response.
 * @param {Function} EntityClass - Entity constructor.
 * @returns {Object[]} Entities.
 */
function toEntities(response, EntityClass) {
    if (response.status !== 200) {
        console.error(`${response.status}, ${response.statusText}`);
        return [];
    }
    return (response.data instanceof Array ? response.data : []).map(resource => new EntityClass({...resource}));
}

/**
 * Maps asset resources into entities and entities into resources.
 *
 * @class AssetManagementAssembler
 */
export class AssetManagementAssembler {
    static toClinicalAssets(response) { return toEntities(response, ClinicalAsset); }
    static toEvidences(response) { return toEntities(response, ExamEvidence); }
    static toEmergencyReports(response) { return toEntities(response, EmergencyReport); }

    static toEntity(EntityClass, response) {
        return new EntityClass({...response.data});
    }

    /**
     * @param {Object} entity - Any asset entity.
     * @returns {Object} Resource ready to send, without a null id.
     */
    static toResource(entity) {
        const resource = {...entity};
        if (resource.id === null) delete resource.id;
        return resource;
    }
}
