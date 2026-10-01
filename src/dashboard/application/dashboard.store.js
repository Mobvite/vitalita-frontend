import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {HistoryEntry} from "../domain/model/history-entry.js";
import {HistoryEntryType} from "../domain/model/history-entry-type.js";
import {PatientHistory} from "../domain/model/patient-history.js";
import {FamilyDashboard} from "../domain/model/family-dashboard.js";
import useIamStore from "../../iam/application/iam.store.js";
import useProfilesStore from "../../profiles/application/profiles.store.js";
import useMonitoringStore from "../../monitoring/application/monitoring.store.js";

/**
 * Application store for the Dashboard and Analytics context.
 * This context has no API of its own: it builds read models with the data
 * that Profiles and Monitoring already loaded. In the Vitalita API the same
 * projections will come from the Care Read Contract.
 */
const useDashboardStore = defineStore('dashboard', () => {
    const isLoading = ref(false);
    /**
     * Receives a function that translates texts, so the history titles follow the language.
     * The view sets it, because the store should not depend on vue-i18n.
     */
    const translate = ref((key) => key);

    /** Loads the data of the selected older adult. */
    async function load() {
        const iam = useIamStore();
        const profiles = useProfilesStore();
        const monitoring = useMonitoringStore();
        isLoading.value = true;
        try {
            await profiles.initialize(iam.currentUserId, iam.isCaregiver);
            await monitoring.fetchForOlderAdult(profiles.selectedOlderAdult?.id);
        } finally {
            isLoading.value = false;
        }
    }

    /** History with every record of the selected older adult (US23). */
    const patientHistory = computed(() => {
        const monitoring = useMonitoringStore();
        const t = translate.value;
        const medicationName = (id) => monitoring.medications.find(item => item.id === id)?.name ?? '';
        const entries = [
            ...monitoring.dailyReports.map(report => new HistoryEntry({
                id: `report-${report.id}`, type: HistoryEntryType.DAILY_REPORT, occurredAt: report.reportDate,
                title: `${t('dashboard.entries.daily-report')} · ${t(`monitoring.moods.${report.mood}`)}`,
                description: report.observations
            })),
            ...monitoring.vitalSigns.map(sign => new HistoryEntry({
                id: `vital-${sign.id}`, type: HistoryEntryType.VITAL_SIGN, occurredAt: sign.measuredAt,
                title: t(`monitoring.vital-types.${sign.type}`), description: `${sign.displayValue} ${sign.unit}`
            })),
            ...monitoring.administrations.map(item => new HistoryEntry({
                id: `dose-${item.id}`, type: HistoryEntryType.MEDICATION, occurredAt: item.administeredAt,
                title: `${t('dashboard.entries.dose')} · ${medicationName(item.medicationId)}`, description: item.dosageGiven
            })),
            ...monitoring.appointments.map(appointment => new HistoryEntry({
                id: `appointment-${appointment.id}`, type: HistoryEntryType.APPOINTMENT, occurredAt: appointment.scheduledAt,
                title: `${t('dashboard.entries.appointment')} · ${appointment.specialty}`,
                description: appointment.result || `${appointment.doctorName} · ${appointment.location}`
            })),
            ...monitoring.exams.map(exam => new HistoryEntry({
                id: `exam-${exam.id}`, type: HistoryEntryType.EXAM, occurredAt: exam.performedAt,
                title: `${t('dashboard.entries.exam')} · ${exam.examType}`,
                description: exam.resultSummary || t('monitoring.records.no-result')
            })),
            ...monitoring.careActivities.map(activity => new HistoryEntry({
                id: `activity-${activity.id}`, type: HistoryEntryType.CARE_ACTIVITY, occurredAt: activity.performedAt,
                title: t(`monitoring.activity-types.${activity.activityType}`), description: activity.description
            }))
        ].filter(entry => entry.occurredAt);
        return new PatientHistory({olderAdultId: monitoring.olderAdultId, entries});
    });

    /** Summary for the family member (US22). */
    const familyDashboard = computed(() => {
        const profiles = useProfilesStore();
        const monitoring = useMonitoringStore();
        const olderAdult = profiles.selectedOlderAdult;
        if (!olderAdult) return null;
        const report = monitoring.latestDailyReport;
        return new FamilyDashboard({
            olderAdultId: olderAdult.id,
            olderAdultName: olderAdult.fullName,
            lastUpdateAt: patientHistory.value.entries.find(entry => new Date(entry.occurredAt) <= new Date())?.occurredAt ?? null,
            latestMood: report?.mood ?? null,
            generalCondition: report?.generalCondition ?? null,
            latestReportText: report?.observations ?? '',
            pendingAppointments: monitoring.appointments.filter(item => item.isUpcoming()).length,
            pendingExams: monitoring.exams.filter(item => item.isPending()).length,
            dosesGivenToday: monitoring.todayDoses.filter(dose => dose.given).length,
            dosesPlannedToday: monitoring.todayDoses.length
        });
    });

    /** @param {function(string): string} translateFunction - vue-i18n t function. */
    function setTranslator(translateFunction) {
        translate.value = translateFunction;
    }

    return {isLoading, patientHistory, familyDashboard, load, setTranslator};
});

export default useDashboardStore;
