import {jsPDF} from "jspdf";

const PRIMARY = [15, 118, 110];
const TEXT = [17, 24, 39];
const SECONDARY = [71, 85, 105];
const MARGIN = 18;

/**
 * PDF adapter for the emergency summary (the QuestPDF role in the backend).
 * It receives translated labels, so the document follows the active language.
 *
 * @class EmergencyReportPdf
 */
export class EmergencyReportPdf {
    /**
     * Builds the PDF and starts the download.
     * @param {import('../domain/model/emergency-summary.js').EmergencySummary} summary - Data of the summary.
     * @param {Object<string, string>} labels - Translated texts.
     * @param {function(string): string} formatDate - Date formatter of the active language.
     * @returns {string} Name of the downloaded file.
     */
    static download(summary, labels, formatDate) {
        const doc = new jsPDF({unit: 'mm', format: 'a4'});
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - MARGIN * 2;
        let y = MARGIN;

        // Starts a new page when the next block does not fit
        const ensureSpace = (height) => {
            if (y + height > pageHeight - MARGIN) {
                doc.addPage();
                y = MARGIN;
            }
        };

        const title = (text) => {
            ensureSpace(14);
            y += 4;
            doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...PRIMARY).text(text, MARGIN, y);
            y += 2;
            doc.setDrawColor(...PRIMARY).line(MARGIN, y, pageWidth - MARGIN, y);
            y += 6;
        };

        const line = (text, options = {}) => {
            const lines = doc.splitTextToSize(text, contentWidth);
            ensureSpace(lines.length * 5.5);
            doc.setFont('helvetica', options.bold ? 'bold' : 'normal').setFontSize(10).setTextColor(...(options.muted ? SECONDARY : TEXT));
            doc.text(lines, MARGIN, y);
            y += lines.length * 5.5;
        };

        const list = (items, emptyText) => {
            if (items.length === 0) line(emptyText, {muted: true});
            else items.forEach(item => line(`• ${item}`));
        };

        // Header band
        doc.setFillColor(...PRIMARY).rect(0, 0, pageWidth, 28, 'F');
        doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(255, 255, 255).text(labels.title, MARGIN, 14);
        doc.setFont('helvetica', 'normal').setFontSize(9).text(`${labels.generatedAt}: ${formatDate(summary.generatedAt)}`, MARGIN, 21);
        y = 38;

        const {patient} = summary;
        title(labels.patient);
        line(patient.fullName, {bold: true});
        line(`${labels.age}: ${patient.age ?? '—'} · DNI: ${patient.documentNumber || '—'} · ${labels.bloodType}: ${patient.bloodType || '—'}`);

        title(labels.allergies);
        list(summary.allergies, labels.noRecords);

        title(labels.chronicConditions);
        list(summary.chronicConditions, labels.noRecords);

        title(labels.medications);
        list(summary.medications.map(m => `${m.name} ${m.dosage} — ${m.schedule}`), labels.noRecords);

        title(labels.vitalSigns);
        list(summary.vitalSigns.map(v => `${v.type}: ${v.value} ${v.unit} (${formatDate(v.measuredAt)})`), labels.noRecords);

        title(labels.recentExams);
        list(summary.recentExams.map(e => `${e.examType} (${formatDate(e.performedAt)}): ${e.result || labels.pendingResult}`), labels.noRecords);

        title(labels.emergencyContact);
        const contact = summary.emergencyContact;
        line(contact.name ? `${contact.name} · ${contact.phoneNumber} · ${contact.relationship}` : labels.noRecords, {muted: !contact.name});

        title(labels.caregiver);
        const caregiver = summary.caregiver;
        line(caregiver.fullName ? `${caregiver.fullName} · ${caregiver.professionalTitle || ''} · ${caregiver.phoneNumber || ''}` : labels.noRecords,
            {muted: !caregiver.fullName});

        if (summary.observations) {
            title(labels.observations);
            line(summary.observations);
        }

        // Footer on every page
        const pages = doc.getNumberOfPages();
        for (let page = 1; page <= pages; page++) {
            doc.setPage(page);
            doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...SECONDARY);
            doc.text(`${labels.disclaimer} · ${page}/${pages}`, MARGIN, pageHeight - 8);
        }

        const fileName = `vitalita-emergency-${patient.fullName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        return fileName;
    }
}
