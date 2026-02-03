import sqlite3
import os

# Caminho absoluto para o banco
db_path = os.path.abspath('backend/data/organograma.sqlite')
print(f"Connecting to DB: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    sql = """
        SELECT 
            c.nome_cargo,
            c.id,
            c.setor_ref, 
            c.parent_id,
            c.hierarquia
        FROM cargos_funcionais c
        JOIN diagramas_funcionais d ON c.diagrama_id = d.id
        JOIN orgaos o ON d.orgao_id = o.id
        WHERE o.id LIKE '%ouvidoria%' OR o.nome LIKE '%ouvidoria%'
    """

    cursor.execute(sql)
    rows = cursor.fetchall()
    
    print('--- RESULTADO DA CONSULTA (PYTHON) ---')
    print(f"{'NOME CARGO':<40} | {'ID':<10} | {'SETOR REF':<36} | {'PARENT ID':<10}")
    print("-" * 100)
    for row in rows:
        nome = row[0]
        cid = str(row[1])
        ref = str(row[2]) if row[2] else "NULL"
        pid = str(row[3]) if row[3] else "NULL"
        print(f"{nome:<40} | {cid:<10} | {ref:<36} | {pid:<10}")

    print(f"Total rows: {len(rows)}")
    conn.close()

except Exception as e:
    print(f"ERRO: {e}")
