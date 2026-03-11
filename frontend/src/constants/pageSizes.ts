/**
 * Constantes de Tamanhos de Página
 * Dimensões em pixels para 300 DPI
 */

export const PAGE_SIZES = {
    A0: {
        width: 9933,
        height: 14043,
        label: 'A0 (841 × 1189 mm)',
        mm: { width: 841, height: 1189 }
    },
    A1: {
        width: 7016,
        height: 9933,
        label: 'A1 (594 × 841 mm)',
        mm: { width: 594, height: 841 }
    },
    A2: {
        width: 4961,
        height: 7016,
        label: 'A2 (420 × 594 mm)',
        mm: { width: 420, height: 594 }
    },
    A3: {
        width: 3508,
        height: 4961,
        label: 'A3 (297 × 420 mm)',
        mm: { width: 297, height: 420 }
    },
    A4: {
        width: 2480,
        height: 3508,
        label: 'A4 (210 × 297 mm)',
        mm: { width: 210, height: 297 }
    },
    A5: {
        width: 1748,
        height: 2480,
        label: 'A5 (148 × 210 mm)',
        mm: { width: 148, height: 210 }
    },
    A6: {
        width: 1240,
        height: 1748,
        label: 'A6 (105 × 148 mm)',
        mm: { width: 105, height: 148 }
    }
};

// Array de tamanhos para seleção em formulários
export const PAGE_SIZE_OPTIONS = [
    { value: 'A0', label: PAGE_SIZES.A0.label },
    { value: 'A1', label: PAGE_SIZES.A1.label },
    { value: 'A2', label: PAGE_SIZES.A2.label },
    { value: 'A3', label: PAGE_SIZES.A3.label },
    { value: 'A4', label: PAGE_SIZES.A4.label },
    { value: 'A5', label: PAGE_SIZES.A5.label },
    { value: 'A6', label: PAGE_SIZES.A6.label }
];

// DPI padrão para exportação
export const EXPORT_DPI = 300;
