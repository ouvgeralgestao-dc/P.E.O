
import sqlite3
import os

# Caminho absoluto para o banco
db_path = os.path.abspath('backend/data/organograma.sqlite')
print(f"Connecting to DB: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Find Orgao
    cursor.execute("SELECT id, nome FROM orgaos WHERE id LIKE '%ouvidoria%'")
    orgao = cursor.fetchone()
    if not orgao:
        print("Orgao not found")
        exit(1)
    
    orgao_id, orgao_nome = orgao
    print(f"Checking Orgao: {orgao_nome} ({orgao_id})")

    # 2. Fetch Structural Sectors
    cursor.execute("SELECT id, nome FROM setores WHERE orgao_id = ?", (orgao_id,))
    setores = cursor.fetchall()
    setor_map = {row[0]: row[1] for row in setores}
    
    print(f"Structural Sectors Found: {len(setores)}")
    for sid, snome in setores:
        print(f"   [STRUCT] {snome:<30} ID: {sid}")

    # 3. Fetch Functional Cargos
    cursor.execute("SELECT id FROM diagramas_funcionais WHERE orgao_id = ?", (orgao_id,))
    diag = cursor.fetchone()
    if not diag:
        print("No Functional Diagram found")
        exit(1)
    
    diag_id = diag[0]
    cursor.execute("SELECT nome_cargo, setor_ref FROM cargos_funcionais WHERE diagrama_id = ?", (diag_id,))
    cargos = cursor.fetchall()
    print(f"Functional Cargos Found: {len(cargos)}")

    # 4. Cross-Check
    print('\n--- INTEGRITY CHECK ---')
    for nome, ref in cargos:
        if not ref:
            print(f"[FAIL] {nome:<30}: NULL reference")
        elif ref in setor_map:
            s_name = setor_map[ref]
            print(f"[OK]   {nome:<30}: Linked to '{s_name}'")
        else:
            print(f"[BROKEN] {nome:<30}: Reference ID {ref} NOT FOUND in Sectors!")

    conn.close()

except Exception as e:
    print(f"ERRO: {e}")
