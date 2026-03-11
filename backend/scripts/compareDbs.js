import sqlite3 from 'sqlite3';

const dbLocal = new sqlite3.Database('data/organograma.sqlite');
const dbRemote = new sqlite3.Database('data/organograma_remote.sqlite');

function count(db, name) {
    return new Promise((resolve) => {
        db.get('SELECT COUNT(*) as count FROM orgaos', (err, row1) => {
            if (err) console.error(`Error counting orgaos in ${name}:`, err);
            db.get('SELECT COUNT(*) as count FROM setores', (err, row2) => {
                if (err) console.error(`Error counting setores in ${name}:`, err);
                resolve({ name, orgaos: row1?.count || 0, setores: row2?.count || 0 });
            });
        });
    });
}

console.log('--- Comparison Results ---');
Promise.all([count(dbLocal, 'Local'), count(dbRemote, 'Remote')])
    .then(results => {
        console.table(results);
        dbLocal.close();
        dbRemote.close();
    })
    .catch(err => {
        console.error('Comparison died:', err);
    });
