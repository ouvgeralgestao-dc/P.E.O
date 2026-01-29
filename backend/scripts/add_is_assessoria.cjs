
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/organograma.sqlite');
const db = new sqlite3.Database(dbPath);

const addColumn = () => {
    db.run("ALTER TABLE sandbox_setores ADD COLUMN is_assessoria BOOLEAN DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Coluna is_assessoria já existe em sandbox_setores.');
            } else {
                console.error('Erro ao adicionar coluna:', err.message);
            }
        } else {
            console.log('Coluna is_assessoria adicionada com sucesso em sandbox_setores.');
        }
    });

    db.run("ALTER TABLE sandbox_cargos_funcionais ADD COLUMN is_assessoria BOOLEAN DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Coluna is_assessoria já existe em sandbox_cargos_funcionais.');
            } else {
                console.error('Erro ao adicionar coluna:', err.message);
            }
        } else {
            console.log('Coluna is_assessoria adicionada com sucesso em sandbox_cargos_funcionais.');
        }
    });
};

addColumn();

setTimeout(() => {
    db.close();
}, 2000);
