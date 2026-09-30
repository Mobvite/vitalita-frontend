import {defineStore} from "pinia";
import {ref} from "vue";
import {AssetManagementApi} from "../infrastructure/asset-management-api.js";
import {AssetManagementAssembler} from "../infrastructure/asset-management.assembler.js";
import {FileStorage} from "../infrastructure/file-storage.js";
import {EmergencyReportPdf} from "../infrastructure/emergency-report-pdf.js";
import {ClinicalAsset} from "../domain/model/clinical-asset.entity.js";
import {ExamEvidence} from "../domain/model/exam-evidence.entity.js";
import {EmergencyReport} from "../domain/model/emergency-report.entity.js";
import {EmergencySummary} from "../domain/model/emergency-summary.js";
import {AssetType} from "../domain/model/asset-type.js";
import useProfilesStore from "../../profiles/application/profiles.store.js";
import useMonitoringStore from "../../monitoring/application/monitoring.store.js";
import useSubscriptionsStore from "../../subscriptions/application/subscriptions.store.js";

const assetManagementApi = new AssetManagementApi();
const RECENT_EXAMS = 5;

/**
 * Application store for the Resource and Asset Management context.
 * It reads other contexts only through their stores, never through their APIs.
 */
const useAssetManagementStore = defineStore('asset-management', () => {
    const clinicalAssets = ref([]);
    const evidences = ref([]);
    const emergencyReports = ref([]);
    const errors = ref([]);
    const isUploading = ref(false);
    const isLoading = ref(false);

    // ---------- Evidences (US19) ----------

    /**
     * Loads the files of an older adult and the evidences of the given exams.
     * @param {number} olderAdultId - Older adult identifier.
     * @param {number[]} examIds - Exams of the Monitoring context.
     */
    async function fetchEvidences(olderAdultId, examIds) {
        if (!olderAdultId) return;
        try {
            clinicalAssets.value = AssetManagementAssembler.toClinicalAssets(await assetManagementApi.getClinicalAssets(olderAdultId));
            evidences.value = examIds.length > 0
                ? AssetManagementAssembler.toEvidences(await assetManagementApi.getEvidencesByExamIds(examIds))
                : [];
        } catch (error) {
            console.error(error);
            errors.value.push('asset-management.errors.load');
        }
    }

    /**
     * @param {number} examId - Exam identifier.
     * @returns {Array<{evidence: ExamEvidence, asset: ClinicalAsset}>} Evidences with their file.
     */
    function getEvidencesForExam(examId) {
        return evidences.value
            .filter(evidence => evidence.examId === examId)
            .map(evidence => ({evidence, asset: clinicalAssets.value.find(asset => asset.id === evidence.assetId)}))
            .filter(item => item.asset);
    }

    /**
     * Uploads a photo or PDF and links it to an exam.
     * The exam stays saved even if the upload fails (US19, scenario 2).
     * @param {Object} params - Evidence data.
     * @param {number} params.olderAdultId - Older adult owner of the file.
     * @param {number} params.examId - Exam to link.
     * @param {File} params.file - File selected by the user.
     * @param {string} [params.description=''] - Short description.
     * @returns {Promise<boolean>} True when the evidence was saved.
     */
    async function attachEvidence({olderAdultId, examId, file, description = ''}) {
        errors.value = [];
        const fileError = ClinicalAsset.validateFile(file);
        if (fileError) {
            errors.value.push(fileError);
            return false;
        }
        isUploading.value = true;
        try {
            const storageUrl = await FileStorage.upload(file);
            const asset = new ClinicalAsset({
                olderAdultId, fileName: file.name, storageUrl, contentType: file.type,
                assetType: file.type === 'application/pdf' ? AssetType.CLINICAL_DOCUMENT : AssetType.EXAM_IMAGE
            });
            const savedAsset = AssetManagementAssembler.toEntity(ClinicalAsset,
                await assetManagementApi.createClinicalAsset(AssetManagementAssembler.toResource(asset)));
            const evidence = new ExamEvidence({examId, assetId: savedAsset.id, description});
            const savedEvidence = AssetManagementAssembler.toEntity(ExamEvidence,
                await assetManagementApi.createEvidence(AssetManagementAssembler.toResource(evidence)));
            clinicalAssets.value.push(savedAsset);
            evidences.value.push(savedEvidence);
            return true;
        } catch (error) {
            console.error(error);
            errors.value.push(FileStorage.isCloudConfigured() ? 'asset-management.errors.upload' : 'asset-management.errors.local-size');
            return false;
        } finally {
            isUploading.value = false;
        }
    }

    // ---------- Emergency summary (US26, US37) ----------

    /**
     * Loads everything the summary needs: profiles, monitoring records and the plan.
     * @param {number} userId - Signed-in user.
     * @param {boolean} isCaregiver - True for caregivers.
     */
    async function prepareEmergencyData(userId, isCaregiver) {
        isLoading.value = true;
        const profiles = useProfilesStore();
        const monitoring = useMonitoringStore();
        const subscriptions = useSubscriptionsStore();
        try {
            await profiles.initialize(userId, isCaregiver);
            await monitoring.fetchForOlderAdult(profiles.selectedOlderAdult?.id);
            if (isCaregiver) {
                await subscriptions.fetchCurrentSubscription(userId);
            } else {
                // The plan belongs to the caregiver, so the family member uses the caregiver plan
                await profiles.fetchResponsibleCaregiver();
                if (profiles.responsibleCaregiver) await subscriptions.fetchCurrentSubscription(profiles.responsibleCaregiver.userId);
            }
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Builds the summary of the selected older adult with data of other contexts.
     * @param {function(string): string} translateVitalType - Translates a vital sign type.
     * @returns {EmergencySummary|null} Summary, or null when there is no patient.
     */
    function buildEmergencySummary(translateVitalType) {
        const profiles = useProfilesStore();
        const monitoring = useMonitoringStore();
        const olderAdult = profiles.selectedOlderAdult;
        if (!olderAdult) return null;
        const caregiver = profiles.caregiverProfile ?? profiles.responsibleCaregiver;
        return new EmergencySummary({
            patient: {
                fullName: olderAdult.fullName, age: olderAdult.age, documentNumber: olderAdult.documentNumber,
                bloodType: olderAdult.bloodType, birthDate: olderAdult.birthDate
            },
            allergies: olderAdult.allergies,
            chronicConditions: olderAdult.chronicConditions,
            medications: monitoring.activeMedications.map(medication => ({
                name: medication.name, dosage: medication.dosage, schedule: medication.scheduleTimes.join(', ')
            })),
            vitalSigns: Object.values(monitoring.latestVitalSigns).map(sign => ({
                type: translateVitalType(sign.type), value: sign.displayValue, unit: sign.unit, measuredAt: sign.measuredAt
            })),
            recentExams: monitoring.sortedExams.slice(0, RECENT_EXAMS).map(exam => ({
                examType: exam.examType, performedAt: exam.performedAt, result: exam.resultSummary
            })),
            emergencyContact: {...olderAdult.emergencyContact},
            caregiver: caregiver ? {
                fullName: caregiver.fullName, professionalTitle: caregiver.professionalTitle, phoneNumber: caregiver.phoneNumber
            } : {},
            observations: olderAdult.observations
        });
    }

    /**
     * Downloads the PDF and records the generated report (US37).
     * @param {EmergencySummary} summary - Summary to export.
     * @param {Object<string, string>} labels - Translated texts for the document.
     * @param {function(string): string} formatDate - Date formatter.
     * @param {number} userId - User that generates the report.
     * @returns {Promise<boolean>} True when the PDF was generated.
     */
    async function exportEmergencyReport(summary, labels, formatDate, userId) {
        errors.value = [];
        const subscriptions = useSubscriptionsStore();
        if (!subscriptions.canExportPdf()) {
            errors.value.push('asset-management.errors.plan-pdf');
            return false;
        }
        const report = new EmergencyReport({olderAdultId: useProfilesStore().selectedOlderAdult?.id, generatedByUserId: userId});
        try {
            EmergencyReportPdf.download(summary, labels, formatDate);
            report.markGenerated();
        } catch (error) {
            console.error(error);
            report.markFailed();
            errors.value.push('asset-management.errors.pdf');
        }
        try {
            const saved = await assetManagementApi.createEmergencyReport(AssetManagementAssembler.toResource(report));
            emergencyReports.value.push(AssetManagementAssembler.toEntity(EmergencyReport, saved));
        } catch (error) {
            console.error(error);
        }
        return report.status === 'Generated';
    }

    return {
        clinicalAssets, evidences, emergencyReports, errors, isUploading, isLoading,
        fetchEvidences, getEvidencesForExam, attachEvidence,
        prepareEmergencyData, buildEmergencySummary, exportEmergencyReport
    };
});

export default useAssetManagementStore;
