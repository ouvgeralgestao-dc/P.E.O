
// Simulate Backend Data (Snake Case)
const backendCargo = {
    id: "123",
    nome_cargo: "Analista",
    setor_ref: "setor-uuid-001", // The critical field
    parent_id: "parent-uuid-999",
    simbolos: []
};

console.log("1. Backend Data:", backendCargo);

// Simulate EditarOrganograma.tsx logic

// Flatten (Mock)
const flattenCargosRecursive = (nodes) => nodes; // Simplification

// Normalize
const normalizeCargos = (cargosBackend) => {
    if (!cargosBackend) return [];
    return cargosBackend.map(c => {
        if (c.simbolos && Array.isArray(c.simbolos)) return c;
        // ... (simbolo single logic skipped)
        return { ...c, simbolos: [] };
    });
};

const cargosNormalized = normalizeCargos([backendCargo]);
console.log("2. Normalized Data (passed to Form):", cargosNormalized[0]);

// Simulate FuncoesForm.tsx logic

// handleEditCargo logic (PATCHED VERSION)
const handleEditCargo = (cargo) => {
    return {
        ...cargo,
        prefixo: "Prefix",
        complemento: "Suffix",
        // CORREÇÃO APPLIED
        setorRef: cargo.setorRef || cargo.setor_ref || null,
        parentId: cargo.parentId === 'null' ? null : (cargo.parentId || null),
        isEditing: true
    };
};

const currentCargoState = handleEditCargo(cargosNormalized[0]);
console.log("3. Form State (currentCargo):", currentCargoState);

// Check if setorRef is populated
if (currentCargoState.setorRef === "setor-uuid-001") {
    console.log("SUCCESS: setorRef is populated correctly.");
} else {
    console.error("FAILURE: setorRef is MISSING or WRONG:", currentCargoState.setorRef);
}
