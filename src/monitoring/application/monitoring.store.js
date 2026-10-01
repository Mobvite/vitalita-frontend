import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {MonitoringApi} from "../infrastructure/monitoring-api.js";
import {MonitoringAssembler} from "../infrastructure/monitoring.assembler.js";
import {DailyReport} from "../domain/model/daily-report.entity.js";
import {VitalSign} from "../domain/model/vital-sign.entity.js";
import {Medication} from "../domain/model/medication.entity.js";
import {MedicationAdministration} from "../domain/model/medication-administration.entity.js";
import {MedicalAppointment} from "../domain/model/medical-appointment.entity.js";
import {MedicalExam} from "../domain/model/medical-exam.entity.js";
import {CareActivity} from "../domain/model/care-activity.entity.js";
import {VitalSignType} from "../domain/model/vital-sign-type.js";

const monitoringApi = new MonitoringApi();

/** Sorts records from the newest to the oldest. */
const newestFirst = (field) => (a, b) => new Date(b[field]) - new Date(a[field]);

/**
 * Application store for the Service Execution and Monitoring context.
 * It keeps the records of the selected older adult only.
 */
const useMonitoringStore = defineStore('monitoring', () => {
    const olderAdultId = ref(null);
    const dailyReports = ref([]);
    const vitalSigns = ref([]);
    const medications = ref([]);
    const administrations = ref([]);
    const appointments = ref([]);
    const exams = ref([]);
    const careActivities = ref([]);
    const errors = ref([]);
    const isLoading = ref(false);

    // ---------- Queries ----------

    /** Latest measurement of each vital sign type. */
    const latestVitalSigns = computed(() => {
        const latest = {};
        [...vitalSigns.value].sort(newestFirst('measuredAt')).forEach(sign => {
            if (!latest[sign.type]) latest[sign.type] = sign;
        });
        return latest;
    });

    /** Heart rate of the last 8 measurements, from oldest to newest. */
    const heartRateTrend = computed(() => vitalSigns.value
        .filter(sign => sign.type === VitalSignType.HEART_RATE)
        .sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt))
        .slice(-8));

    const sortedCareActivities = computed(() => [...careActivities.value].sort(newestFirst('performedAt')));
    const latestDailyReport = computed(() => [...dailyReports.value].sort(newestFirst('reportDate'))[0] ?? null);
    const sortedExams = computed(() => [...exams.value].sort(newestFirst('performedAt')));
    const sortedAppointments = computed(() => [...appointments.value].sort(newestFirst('scheduledAt')));
    const nextAppointment = computed(() => appointments.value
        .filter(appointment => appointment.isUpcoming())
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0] ?? null);
    const activeMedications = computed(() => medications.value.filter(medication => medication.active));

    /** Doses of today with their state, used by the medication schedule. */
    const todayDoses = computed(() => {
        const today = new Date().toDateString();
        return activeMedications.value.flatMap(medication => medication.scheduleTimes.map(time => ({
            medication,
            time,
            given: administrations.value.some(item => item.medicationId === medication.id
                && item.scheduledTime === time && new Date(item.administeredAt).toDateString() === today)
        }))).sort((a, b) => a.time.localeCompare(b.time));
    });

    // ---------- Loading ----------

    /**
     * Loads every record of an older adult.
     * @param {number} id - Older adult identifier.
     * @param {boolean} [force=false] - Reload even when the patient did not change.
     */
    async function fetchForOlderAdult(id, force = false) {
        if (!id || (!force && olderAdultId.value === id)) return;
        isLoading.value = true;
        errors.value = [];
        try {
            const [reports, signs, meds, admins, appts, examList, activities] = await Promise.all([
                monitoringApi.getDailyReports(id), monitoringApi.getVitalSigns(id), monitoringApi.getMedications(id),
                monitoringApi.getAdministrations(id), monitoringApi.getAppointments(id), monitoringApi.getExams(id),
                monitoringApi.getCareActivities(id)
            ]);
            dailyReports.value = MonitoringAssembler.toDailyReports(reports);
            vitalSigns.value = MonitoringAssembler.toVitalSigns(signs);
            medications.value = MonitoringAssembler.toMedications(meds);
            administrations.value = MonitoringAssembler.toAdministrations(admins);
            appointments.value = MonitoringAssembler.toAppointments(appts);
            exams.value = MonitoringAssembler.toExams(examList);
            careActivities.value = MonitoringAssembler.toCareActivities(activities);
            olderAdultId.value = id;
        } catch (error) {
            console.error(error);
            errors.value.push('monitoring.errors.load');
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Sends a new record and adds it to the list.
     * @param {Function} createCall - API method that creates the resource.
     * @param {Function} EntityClass - Entity constructor.
     * @param {import('vue').Ref<Array>} list - List to update.
     * @param {Object} entity - Entity to save.
     * @returns {Promise<Object|null>} Saved entity or null.
     */
    async function create(createCall, EntityClass, list, entity) {
        try {
            const response = await createCall(MonitoringAssembler.toResource(entity));
            const saved = MonitoringAssembler.toEntity(EntityClass, response);
            list.value.push(saved);
            return saved;
        } catch (error) {
            console.error(error);
            errors.value.push('monitoring.errors.save');
            return null;
        }
    }

    // ---------- Commands ----------

    /** Registers the daily report (US13). */
    async function addDailyReport(report) {
        errors.value = [];
        if (!report.isComplete()) {
            errors.value.push('monitoring.errors.incomplete-report');
            return null;
        }
        return create(monitoringApi.createDailyReport.bind(monitoringApi), DailyReport, dailyReports, report);
    }

    /**
     * Registers several vital signs. Nothing is saved if one value has a wrong format (US14).
     * @param {VitalSign[]} signs - Measurements to save.
     * @returns {Promise<boolean>} True when all were saved.
     */
    async function addVitalSigns(signs) {
        errors.value = [];
        if (signs.length === 0 || signs.some(sign => !sign.hasValidFormat())) {
            errors.value.push('monitoring.errors.invalid-vital-sign');
            return false;
        }
        for (const sign of signs) {
            const saved = await create(monitoringApi.createVitalSign.bind(monitoringApi), VitalSign, vitalSigns, sign);
            if (!saved) return false;
        }
        return true;
    }

    /** Registers a patient note (US20). */
    async function addCareActivity(activity) {
        errors.value = [];
        if (!activity.isValid()) {
            errors.value.push('monitoring.errors.invalid-note');
            return null;
        }
        return create(monitoringApi.createCareActivity.bind(monitoringApi), CareActivity, careActivities, activity);
    }

    /** Registers a new medication with its schedule. */
    async function addMedication(medication) {
        errors.value = [];
        if (!medication.isValid()) {
            errors.value.push('monitoring.errors.invalid-medication');
            return null;
        }
        return create(monitoringApi.createMedication.bind(monitoringApi), Medication, medications, medication);
    }

    /**
     * Registers a dose. The same dose cannot be registered twice on the same day (US15).
     * @param {MedicationAdministration} administration - Dose given.
     * @returns {Promise<MedicationAdministration|null>} Saved dose or null.
     */
    async function administerMedication(administration) {
        errors.value = [];
        if (administrations.value.some(item => item.isSameDoseAs(administration))) {
            errors.value.push('monitoring.errors.duplicated-dose');
            return null;
        }
        return create(monitoringApi.createAdministration.bind(monitoringApi), MedicationAdministration, administrations, administration);
    }

    /** Registers a medical appointment (US16). */
    async function addAppointment(appointment) {
        errors.value = [];
        if (!appointment.isValid()) {
            errors.value.push('monitoring.errors.invalid-appointment');
            return null;
        }
        return create(monitoringApi.createAppointment.bind(monitoringApi), MedicalAppointment, appointments, appointment);
    }

    /**
     * Saves the result of a finished appointment (US17).
     * @param {MedicalAppointment} appointment - Appointment to complete.
     * @param {string} result - What the doctor said.
     * @param {string} observations - Indications to follow.
     * @returns {Promise<boolean>} True when it was saved.
     */
    async function completeAppointment(appointment, result, observations) {
        errors.value = [];
        try {
            const updated = new MedicalAppointment({...appointment});
            updated.complete(result, observations);
            await monitoringApi.updateAppointment(MonitoringAssembler.toResource(updated));
            const index = appointments.value.findIndex(item => item.id === updated.id);
            appointments.value[index] = updated;
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('monitoring.errors.save');
            return false;
        }
    }

    /** Registers a medical exam (US18). */
    async function addExam(exam) {
        errors.value = [];
        if (!exam.examType.trim()) {
            errors.value.push('monitoring.errors.invalid-exam');
            return null;
        }
        return create(monitoringApi.createExam.bind(monitoringApi), MedicalExam, exams, exam);
    }

    /**
     * Saves the result of a pending exam.
     * @param {MedicalExam} exam - Exam to update.
     * @param {string} resultSummary - Summary of the result.
     * @returns {Promise<boolean>} True when it was saved.
     */
    async function registerExamResult(exam, resultSummary) {
        errors.value = [];
        try {
            const updated = new MedicalExam({...exam});
            updated.registerResult(resultSummary);
            await monitoringApi.updateExam(MonitoringAssembler.toResource(updated));
            const index = exams.value.findIndex(item => item.id === updated.id);
            exams.value[index] = updated;
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push('monitoring.errors.save');
            return false;
        }
    }

    return {
        olderAdultId, dailyReports, vitalSigns, medications, administrations, appointments, exams, careActivities,
        errors, isLoading,
        latestVitalSigns, heartRateTrend, sortedCareActivities, latestDailyReport, sortedExams, sortedAppointments,
        nextAppointment, activeMedications, todayDoses,
        fetchForOlderAdult, addDailyReport, addVitalSigns, addCareActivity, addMedication, administerMedication,
        addAppointment, completeAppointment, addExam, registerExamResult
    };
});

export default useMonitoringStore;
