
async function test() {
    try {
        console.log("🔑 Tentando login via Fetch...");
        const loginRes = await fetch('http://localhost:6001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricula: '370517', senha: 'admin123' })
        });

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Token obtido:", token ? "SUCESSO" : "FALHA");

        if (!token) {
            console.error("Erro no login:", loginData);
            return;
        }

        console.log("🚀 Chamando /api/organogramas...");
        const apiRes = await fetch('http://localhost:6001/api/organogramas', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const apiData = await apiRes.json();
        console.log("Status API:", apiRes.status);
        console.log("Total de Órgãos Retornados:", apiData.data?.length || 0);

        if (apiData.data && apiData.data.length > 0) {
            apiData.data.forEach(org => {
                const temSetores = org.organogramaEstrutural?.setores?.length > 0;
                console.log(`Órgão: ${org.orgao} | Estrutura: ${temSetores ? "SIM" : "NÃO"}`);
            });
        } else {
            console.warn("⚠️ Nenhum órgão retornado pela API!");
        }

    } catch (e) {
        console.error("Erro fatal:", e.message);
    }
}

test();
