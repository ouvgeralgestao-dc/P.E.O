
import axios from 'axios';

async function testApi() {
    try {
        console.log("🚀 Testando API /api/organogramas...");
        // O backend roda na 6001. Em dev, a rota é direto /api/organogramas?
        // No server.ts vimos app.use('/api/organogramas', organogramaRoutes)
        const response = await axios.get('http://localhost:6001/api/organogramas');
        console.log("Status:", response.status);
        console.log("Data size:", response.data.data.length);
        console.log("Primeiro item:", JSON.stringify(response.data.data[0], null, 2));
    } catch (err: any) {
        console.error("Erro na API:", err.response?.status, err.response?.data || err.message);
    }
}

testApi();
