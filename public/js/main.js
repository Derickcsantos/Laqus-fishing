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
            // Tentativa com api.ipify.org (fallback para ipapi.co se falhar)
            try {
                const respostaIp = await fetch('https://api.ipify.org?format=json');
                if (!respostaIp.ok) throw new Error('API ipify falhou');
                const dataIp = await respostaIp.json();
                ipInfo.ip = dataIp.ip || 'Indisponível';
            } catch (e) {
                console.warn('⚠️ Fallback para ipapi.co');
                const respostaFallback = await fetch('https://ipapi.co/json/');
                const dataFallback = await respostaFallback.json();
                ipInfo.ip = dataFallback.ip || 'Indisponível';
            }

            // Se conseguimos o IP, buscamos informações adicionais
            if (ipInfo.ip !== 'Indisponível' && ipInfo.ip !== '127.0.0.1') {
                try {
                    // Usando HTTPS para a API do ipstack
                    const respostaGeo = await fetch(`https://api.ipstack.com/${ipInfo.ip}?access_key=01694e500153bce0c24eac4a89ef8442`);
                    if (!respostaGeo.ok) throw new Error('API ipstack falhou');
                    
                    const dataGeo = await respostaGeo.json();
                    
                    ipInfo = {
                        ...ipInfo,
                        pais: dataGeo.country_name || dataGeo.country_code || 'Indisponível',
                        regiao: dataGeo.region_name || dataGeo.region_code || 'Indisponível',
                        cidade: dataGeo.city || 'Indisponível',
                        cep: dataGeo.zip || 'Indisponível',
                        latitude: dataGeo.latitude || 'Indisponível',
                        longitude: dataGeo.longitude || 'Indisponível',
                        provedor: dataGeo.connection?.isp || 'Indisponível'
                    };
                } catch (error) {
                    console.warn('⚠️ Erro ao obter geolocalização:', error);
                    // Tentativa com ipapi.co como fallback
                    try {
                        const respostaFallback = await fetch(`https://ipapi.co/${ipInfo.ip}/json/`);
                        const dataFallback = await respostaFallback.json();
                        
                        ipInfo = {
                            ...ipInfo,
                            pais: dataFallback.country_name || dataFallback.country || 'Indisponível',
                            regiao: dataFallback.region || dataFallback.region_code || 'Indisponível',
                            cidade: dataFallback.city || 'Indisponível',
                            cep: dataFallback.postal || 'Indisponível',
                            latitude: dataFallback.latitude || 'Indisponível',
                            longitude: dataFallback.longitude || 'Indisponível',
                            provedor: dataFallback.org || 'Indisponível'
                        };
                    } catch (fallbackError) {
                        console.warn('⚠️ Fallback de geolocalização falhou:', fallbackError);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Erro ao obter informações de IP:', error);
        }

        // Obter nível da bateria
        let nivelBateria = 'Indisponível';
        if ('getBattery' in navigator) {
            try {
                const bateria = await navigator.getBattery();
                nivelBateria = `${Math.round(bateria.level * 100)}%`;
                if (bateria.charging) nivelBateria += ' (carregando)';
            } catch (error) {
                console.warn('⚠️ Erro ao obter nível da bateria:', error);
            }
        }

        // Obter informações de rede melhoradas
        let tipoConexao = 'Indisponível';
        let downlink = 'Indisponível';
        let rtt = 'Indisponível';
        
        if ('connection' in navigator) {
            const conexao = navigator.connection;
            tipoConexao = conexao.effectiveType || 'Indisponível';
            downlink = conexao.downlink ? `${conexao.downlink} Mbps` : 'Indisponível';
            rtt = conexao.rtt ? `${conexao.rtt} ms` : 'Indisponível';
        }

        // Obter informações do dispositivo
        const memoriaDisponivel = 'deviceMemory' in navigator ? `${navigator.deviceMemory} GB` : 'Indisponível';
        const coresCPU = 'hardwareConcurrency' in navigator ? navigator.hardwareConcurrency : 'Indisponível';

        // Montar objeto com os dados
        const dados = {
            ipInfo,
            navegador: navigator.userAgent,
            plataforma: navigator.platform,
            idioma: navigator.language,
            resolucao: `${window.screen.width}x${window.screen.height}`,
            coresCPU,
            memoriaDisponivel,
            bateria: nivelBateria,
            conexao: {
                tipo: tipoConexao,
                velocidade: downlink,
                latencia: rtt
            },
            dataHora: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookiesHabilitados: navigator.cookieEnabled ? 'Sim' : 'Não',
            touchscreen: 'ontouchstart' in window ? 'Sim' : 'Não'
        };

        // Enviar para o servidor
        try {
            const resposta = await fetch('/dados-cliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (resposta.ok) {
                localStorage.setItem('dadosClienteEnviados', 'true');
                console.log('📤 Dados enviados com sucesso:', dados);
            } else {
                console.error('❌ Erro ao enviar dados para o servidor:', await resposta.text());
            }
        } catch (erroEnvio) {
            console.error('❌ Erro na requisição para o servidor:', erroEnvio);
        }
    } catch (erroGeral) {
        console.error('❌ Erro ao coletar ou enviar dados do cliente:', erroGeral);
    }
}
