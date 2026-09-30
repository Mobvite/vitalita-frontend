import {DailyReport} from "../domain/model/daily-report.entity.js";
import {VitalSign} from "../domain/model/vital-sign.entity.js";
import {Medication} from "../domain/model/medication.entity.js";
import {MedicationAdministration} from "../domain/model/medication-administration.entity.js";
import {MedicalAppointment} from "../domain/model/medical-appointment.entity.js";
import {MedicalExam} from "../domain/model/medical-exam.entity.js";
import {CareActivity} from "../domain/model/care-activity.entity.js";

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
    const resources = response.data instanceof Array ? response.data : [];
    return resources.map(resource => new EntityClass({...resource}));
}

/**
 * Maps monitoring resources into entities and entities into resources.
 * Entities are plain objects without getters in their state, so a spread is enough
 * to build the resource. The id is removed when it is null, so json-server creates it.
 *
 * @class MonitoringAssembler
 */
export class MonitoringAssembler {
    static toDailyReports(response) { return toEntities(response, DailyReport); }
    static toVitalSigns(response) { return toEntities(response, VitalSign); }
    static toMedications(response) { return toEntities(response, Medication); }
    static toAdministrations(response) { return toEntities(response, MedicationAdministration); }
    static toAppointments(response) { return toEntities(response, MedicalAppointment); }
    static toExams(response) { return toEntities(response, MedicalExam); }
    static toCareActivities(response) { return toEntities(response, CareActivity); }

    /**
     * @param {Function} EntityClass - Entity constructor.
     * @param {import('axios').AxiosResponse} response - HTTP response with one resource.
     * @returns {Object} Entity.
     */
    static toEntity(EntityClass, response) {
        return new EntityClass({...response.data});
    }

    /**
     * @param {Object} entity - Any monitoring entity.
     * @returns {Object} Resource ready to send.
     */
    static toResource(entity) {
        const resource = {...entity};
        if (resource.id === null) delete resource.id;
        return resource;
    }
}
