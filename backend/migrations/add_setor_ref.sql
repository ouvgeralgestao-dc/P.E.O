-- Migration: Adiciona coluna setor_ref para correlacionar cargos com setores
-- Data: 2026-01-21
-- Objetivo: Permitir cross-filtering entre organogramas estruturais e funcionais

-- A coluna setor_ref armazena o ID do setor estrutural ao qual o cargo pertence
-- Isso permite que ao filtrar por um setor no Dashboard, os cargos relacionados apareçam

-- Adicionar coluna setor_ref se não existir
-- SQLite não suporta IF NOT EXISTS em ALTER TABLE, então usamos PRAGMA para verificar
-- e executamos apenas se a coluna não existir

ALTER TABLE cargos_funcionais ADD COLUMN setor_ref TEXT;

-- Após executar esta migração, os cargos existentes terão setor_ref = NULL
-- Eles precisarão ser atualizados via interface ou script adicional
