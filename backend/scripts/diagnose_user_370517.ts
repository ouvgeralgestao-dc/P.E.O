
import { client } from '../src/db/index.js';

const matricula = '370517';

console.log(`Diagnosing user with matricula: ${matricula}`);

try {
    const user = client.prepare('SELECT * FROM usuarios WHERE matricula = ?').get(matricula);

    if (!user) {
        console.error('❌ User not found!');
    } else {
        console.log('✅ User found:');
        console.log(JSON.stringify(user, null, 2));

        if (user.tipo !== 'admin') {
            console.warn('⚠️ User is NOT admin in database (tipo = ' + user.tipo + ')');
        } else {
            console.log('✅ User is admin.');
        }

        // Check assigned orgao if any
        if (user.orgao_id) {
            console.log(`Checking assigned orgao_id: ${user.orgao_id}`);
            const orgao = client.prepare('SELECT * FROM orgaos WHERE id = ?').get(user.orgao_id);
            if (orgao) {
                console.log('✅ Assigned orgao found:', orgao.orgao);
            } else {
                console.error('❌ Assigned orgao_id NOT found in orgaos table!');
            }
        }
    }

} catch (err) {
    console.error('❌ Error executing diagnosis:', err);
}
