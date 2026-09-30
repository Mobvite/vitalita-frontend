/**
 * One line of the patient history. It is a projection of a record
 * that belongs to another context, so it is read-only.
 */
export class HistoryEntry {
    /**
     * @param {Object} params - Entry data.
     * @param {string} params.id - Unique key made of the type and the source identifier.
     * @param {string} params.type - One of the HistoryEntryType values.
     * @param {string} params.title - Short title.
     * @param {string} [params.description=''] - Detail of the record.
     * @param {string} params.occurredAt - Date of the record.
     */
    constructor({id, type, title, description = '', occurredAt}) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.occurredAt = occurredAt;
        Object.freeze(this);
    }

    /**
     * @param {string} keyword - Text typed by the user.
     * @returns {boolean} True when the title or the description contains the text.
     */
    matchesKeyword(keyword) {
        const text = keyword.trim().toLowerCase();
        return text === '' || `${this.title} ${this.description}`.toLowerCase().includes(text);
    }
}
