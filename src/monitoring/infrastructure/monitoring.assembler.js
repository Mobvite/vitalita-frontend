import {DailyReport} from "../domain/model/daily-report.entity.js";
import {VitalSign} from "../domain/model/vital-sign.entity.js";
import {Medication} from "../domain/model/medication.entity.js";
import {MedicationAdministration} from "../domain/model/medication-administration.entity.js";
import {MedicalAppointment} from "../domain/model/medical-appointment.entity.js";
import {MedicalExam} from "../domain/model/medical-exam.entity.js";
import {CareActivity} from "../domain/model/care-activity.entity.js";
import {VitalSignType} from "../domain/model/vital-sign-type.js";

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
    /**
     * Builds the SaveDailyReportResource of the API. ReportDate is an ISO 8601 instant;
     * the author is taken from the token, so recordedByUserId is not sent.
     * @param {DailyReport} report - Daily report.
     * @returns {Object} Request body.
     */
    static toDailyReportResource(report) {
        return {
            olderAdultId: report.olderAdultId,
            reportDate: new Date(report.reportDate).toISOString(),
            mood: report.mood,
            generalCondition: report.generalCondition,
            observations: report.observations.trim()
        };
    }

    /**
     * Builds the SaveVitalSignResource of the API. For BloodPressure, value is the systolic
     * and secondaryValue the diastolic pressure; the other types send no secondaryValue.
     * The unit is derived by the API from the type.
     * @param {VitalSign} sign - Vital sign.
     * @returns {Object} Request body.
     */
    static toVitalSignResource(sign) {
        return {
            olderAdultId: sign.olderAdultId,
            type: sign.type,
            value: sign.value,
            secondaryValue: sign.type === VitalSignType.BLOOD_PRESSURE ? sign.secondaryValue : null,
            measuredAt: new Date(sign.measuredAt).toISOString()
        };
    }

    /**
     * Builds the SaveMedicationResource of the API (POST and PUT). There is no DELETE:
     * a medication is deactivated with active false.
     * @param {Medication} medication - Medication.
     * @returns {Object} Request body.
     */
    static toMedicationResource(medication) {
        return {
            olderAdultId: medication.olderAdultId,
            name: medication.name.trim(),
            dosage: medication.dosage.trim(),
            frequency: medication.frequency?.trim() ?? '',
            scheduleTimes: [...medication.scheduleTimes],
            instructions: medication.instructions?.trim() ?? '',
            active: medication.active
        };
    }

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
