import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const env = import.meta.env;

/**
 * Infrastructure gateway for the Service Execution and Monitoring context.
 * Every record is filtered by older adult, so each patient keeps its own data (US10).
 *
 * @class MonitoringApi
 * @extends BaseApi
 */
export class MonitoringApi extends BaseApi {
    #dailyReports;
    #vitalSigns;
    #medications;
    #administrations;
    #appointments;
    #exams;
    #careActivities;

    constructor() {
        super();
        this.#dailyReports = new BaseEndpoint(this, env.VITE_DAILY_REPORTS_ENDPOINT_PATH);
        this.#vitalSigns = new BaseEndpoint(this, env.VITE_VITAL_SIGNS_ENDPOINT_PATH);
        this.#medications = new BaseEndpoint(this, env.VITE_MEDICATIONS_ENDPOINT_PATH);
        this.#administrations = new BaseEndpoint(this, env.VITE_MEDICATION_ADMINISTRATIONS_ENDPOINT_PATH);
        this.#appointments = new BaseEndpoint(this, env.VITE_MEDICAL_APPOINTMENTS_ENDPOINT_PATH);
        this.#exams = new BaseEndpoint(this, env.VITE_MEDICAL_EXAMS_ENDPOINT_PATH);
        this.#careActivities = new BaseEndpoint(this, env.VITE_CARE_ACTIVITIES_ENDPOINT_PATH);
    }

    getDailyReports(olderAdultId) { return this.#dailyReports.getAll({olderAdultId}); }
    createDailyReport(resource) { return this.#dailyReports.create(resource); }

    getVitalSigns(olderAdultId) { return this.#vitalSigns.getAll({olderAdultId}); }
    createVitalSign(resource) { return this.#vitalSigns.create(resource); }

    getMedications(olderAdultId) { return this.#medications.getAll({olderAdultId}); }
    createMedication(resource) { return this.#medications.create(resource); }

    getAdministrations(olderAdultId) { return this.#administrations.getAll({olderAdultId}); }
    createAdministration(resource) { return this.#administrations.create(resource); }

    getAppointments(olderAdultId) { return this.#appointments.getAll({olderAdultId}); }
    createAppointment(resource) { return this.#appointments.create(resource); }
    updateAppointment(resource) { return this.#appointments.update(resource.id, resource); }

    getExams(olderAdultId) { return this.#exams.getAll({olderAdultId}); }
    createExam(resource) { return this.#exams.create(resource); }
    updateExam(resource) { return this.#exams.update(resource.id, resource); }

    getCareActivities(olderAdultId) { return this.#careActivities.getAll({olderAdultId}); }
    createCareActivity(resource) { return this.#careActivities.create(resource); }
}
