/**
 * Read model with the history of an older adult in chronological order (US23).
 */
export class PatientHistory {
    /**
     * @param {Object} params - History data.
     * @param {?number} params.olderAdultId - Older adult.
     * @param {import('./history-entry.js').HistoryEntry[]} [params.entries=[]] - Entries in any order.
     */
    constructor({olderAdultId, entries = []}) {
        this.olderAdultId = olderAdultId;
        this.entries = [...entries].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
        this.generatedAt = new Date().toISOString();
    }

    /**
     * Filters the history by type, date range and keyword (US36).
     * All the given filters must match at the same time.
     * @param {Object} [filters={}] - Filters.
     * @param {string[]} [filters.types=[]] - Types to keep. Empty means all.
     * @param {?Date} [filters.from=null] - First day included.
     * @param {?Date} [filters.to=null] - Last day included.
     * @param {string} [filters.keyword=''] - Text to look for.
     * @returns {import('./history-entry.js').HistoryEntry[]} Matching entries.
     */
    filter({types = [], from = null, to = null, keyword = ''} = {}) {
        const start = from ? new Date(from).setHours(0, 0, 0, 0) : null;
        const end = to ? new Date(to).setHours(23, 59, 59, 999) : null;
        return this.entries.filter(entry => {
            const time = new Date(entry.occurredAt).getTime();
            return (types.length === 0 || types.includes(entry.type))
                && (start === null || time >= start)
                && (end === null || time <= end)
                && entry.matchesKeyword(keyword);
        });
    }
}
