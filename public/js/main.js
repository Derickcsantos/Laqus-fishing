document.addEventListener('DOMContentLoaded', () => {
    const jaEnviado = localStorage.getItem('dadosClienteEnviados');
    if (!jaEnviado) {
        coletarDadosDoCliente();
    } else {
        console.log('✅ Dados do cliente já foram enviados anteriormente.');
    }
});

async function coletarDadosDoCliente() {
    try {
        // Obter IP público e informações geográficas
        let ipInfo = {
            ip: 'Indisponível',
            pais: 'Indisponível',
            regiao: 'Indisponível',
            cidade: 'Indisponível',
            cep: 'Indisponível',
            latitude: 'Indisponível',
            longitude: 'Indisponível',
            provedor: 'Indisponível'
        };

        try {
            // Primeiro obtemos o IP público
            const respostaIp = await fetch('https://api.ipify.org?format=json');
            const dataIp = await respostaIp.json();
            ipInfo.ip = dataIp.ip || 'Indisponível';

            // Se conseguimos o IP, buscamos informações adicionais
            if (ipInfo.ip !== 'Indisponível') {
                const respostaGeo = await fetch(`http://api.ipstack.com/${ipInfo.ip}?access_key=01694e500153bce0c24eac4a89ef8442`);
                const dataGeo = await respostaGeo.json();
                
                ipInfo = {
                    ...ipInfo,
                    pais: dataGeo.country_name || 'Indisponível',
                    regiao: dataGeo.region_name || 'Indisponível',
                    cidade: dataGeo.city || 'Indisponível',
                    cep: dataGeo.zip || 'Indisponível',
                    latitude: dataGeo.latitude || 'Indisponível',
                    longitude: dataGeo.longitude || 'Indisponível',
                    provedor: dataGeo.connection?.isp || 'Indisponível'
                };
            }
        } catch (error) {
            console.warn('⚠️ Erro ao obter informações de IP:', error);
        }

        // Obter nível da bateria
        let nivelBateria = 'Indisponível';
        if (navigator.getBattery) {
            try {
                const bateria = await navigator.getBattery();
                nivelBateria = `${(bateria.level * 100).toFixed(0)}%`;
            } catch (error) {
                console.warn('⚠️ Erro ao obter nível da bateria:', error);
            }
        }

        // Obter tipo de conexão e mais informações de rede
        const tipoConexao = navigator.connection?.effectiveType || 'Indisponível';
        const memoriaDisponivel = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Indisponível';
        const coresCPU = navigator.hardwareConcurrency || 'Indisponível';

        // Montar objeto com os dados
        const dados = {
            ipInfo,
            navegador: navigator.userAgent,
            plataforma: navigator.platform,
            idioma: navigator.language,
            resolucao: `${screen.width}x${screen.height}`,
            coresCPU,
            memoriaDisponivel,
            bateria: nivelBateria,
            conexao: tipoConexao,
            dataHora: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookiesHabilitados: navigator.cookieEnabled ? 'Sim' : 'Não',
            touchscreen: 'ontouchstart' in window ? 'Sim' : 'Não'
        };

        // Enviar para o servidor
        const resposta = await fetch('/dados-cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            localStorage.setItem('dadosClienteEnviados', 'true');
            console.log('📤 Dados enviados com sucesso:', dados);
        } else {
            console.error('❌ Erro ao enviar dados para o servidor.');
        }
    } catch (erroGeral) {
        console.error('❌ Erro ao coletar ou enviar dados do cliente:', erroGeral);
    }
}
