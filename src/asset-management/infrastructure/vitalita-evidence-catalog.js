export const EVIDENCE_CATEGORIES = Object.freeze({
    LABORATORY: 'laboratory',
    PRESCRIPTION: 'prescription',
    APPOINTMENT: 'appointment',
    OTHER: 'other'
});

export const DEMO_ALLOWED_TYPES = Object.freeze([
    'image/jpeg',
    'image/png',
    'application/pdf'
]);

export function validateEvidenceMetadata(metadata = {}) {
    const errors = [];

    if (!String(metadata.name ?? '').trim()) {
        errors.push('Falta el nombre del archivo');
    }

    if (!DEMO_ALLOWED_TYPES.includes(metadata.mimeType)) {
        errors.push('Formato no admitido');
    }

    if (!Number.isFinite(metadata.size) || metadata.size <= 0) {
        errors.push('Tamaño inválido');
    }

    if (metadata.size > 5 * 1024 * 1024) {
        errors.push('El archivo supera 5 MB');
    }

    if (!Object.values(EVIDENCE_CATEGORIES).includes(metadata.category)) {
        errors.push('Categoría desconocida');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export function formatEvidenceSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) {
        return 'Sin información';
    }

    if (bytes < 1024) {
        return ${bytes} B;
    }

    if (bytes < 1024 * 1024) {
        return ${(bytes / 1024).toFixed(1)} KB;
    }

    return ${(bytes / (1024 * 1024)).toFixed(1)} MB;
}

export function createEvidenceMetadata(attributes) {
    const validation = validateEvidenceMetadata(attributes);

    if (!validation.valid) {
        throw new TypeError(validation.errors.join('; '));
    }

    return Object.freeze({
        id: String(attributes.id ?? 'demo-evidence'),
        name: attributes.name.trim(),
        mimeType: attributes.mimeType,
        size: attributes.size,
        category: attributes.category,
        description: String(attributes.description ?? ''),
        tags: [...new Set(attributes.tags ?? [])],
        demo: true
    });
}

export function searchEvidenceCatalog(catalog, query = '') {
    const term = query.trim().toLowerCase();

    return catalog.filter(item => {
        const text = ${item.name} ${item.description} ${item.tags.join(' ')};
        return text.toLowerCase().includes(term);
    });
}

export function groupEvidenceCategories(catalog) {
    return Object.values(EVIDENCE_CATEGORIES).map(category => ({
        category,
        items: catalog.filter(item => item.category === category)
    }));
}

export function describeEvidenceCatalog(catalog) {
    const totalBytes = catalog.reduce((sum, item) => sum + item.size, 0);

    return {
        count: catalog.length,
        totalBytes,
        readableSize: formatEvidenceSize(totalBytes),
        images: catalog.filter(
            item => item.mimeType.startsWith('image/')
        ).length,
        documents: catalog.filter(
            item => item.mimeType === 'application/pdf'
        ).length
    };
}

export function buildEvidenceCatalogExample() {
    return [
        createEvidenceMetadata({
            id: 'demo-lipid-profile',
            name: 'perfil-lipidico-ficticio.pdf',
            mimeType: 'application/pdf',
            size: 125000,
            category: EVIDENCE_CATEGORIES.LABORATORY,
            description: 'Metadatos ficticios; no representan un archivo almacenado',
            tags: ['demo', 'laboratorio']
        })
    ];
}
