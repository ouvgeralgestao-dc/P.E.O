.header on
.mode column
.width 30 36 36 36 10

SELECT 
    c.nome_cargo,
    c.id,
    c.setor_ref, 
    c.parent_id,
    c.hierarquia
FROM cargos_funcionais c
JOIN diagramas_funcionais d ON c.diagrama_id = d.id
JOIN orgaos o ON d.orgao_id = o.id
WHERE o.id LIKE '%ouvidoria%' OR o.nome LIKE '%ouvidoria%';
