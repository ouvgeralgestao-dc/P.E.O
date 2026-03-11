
import axios from 'axios';
import crypto from 'crypto';

async function getAdminToken() {
    try {
        const payload = {
            matricula: '000001',
            senha: 'admin123'
        };

        console.log("🔑 Tentando login...");
        const response = await axios.post('http://localhost:6001/api/auth/login', payload);
        const { token } = response.data;
        console.log("Token obtido:", token);

        console.log("🚀 Chamando /api/organogramas com token...");
        const orgResponse = await axios.get('http://localhost:6001/api/organogramas', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Status:", orgResponse.status);
        console.log("Total de Órgãos Retornados (com estrutura):", orgResponse.data.data.length);
        if (orgResponse.data.data.length > 0) {
            console.log("Primeiro Órgão:", orgResponse.data.data[0].orgao);
        }

    } catch (err: any) {
        console.error("Erro:", err.response?.status, err.response?.data || err.message);
    }
}

getAdminToken();
