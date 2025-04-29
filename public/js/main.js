let horarioEntradaSite = new Date().toISOString();

document.addEventListener('DOMContentLoaded', () => {
    const jaEnviado = localStorage.getItem('dadosClienteEnviados');
    if (!jaEnviado) {
        coletarDadosDoCliente(horarioEntradaSite);
    } else {
        console.log('✅ Dados do cliente já foram enviados anteriormente.');
    }
});


async function coletarDadosDoCliente(horarioEntrada) {
    
    try {
        let localPrecisa = await obterLocalizacaoAltaPrecisao();
        let ipInfo = await obterInformacoesIP();

        // Se não conseguir geolocalização precisa, usa do IP
        if (localPrecisa.latitude && localPrecisa.longitude) {
            ipInfo.latitude = localPrecisa.latitude;
            ipInfo.longitude = localPrecisa.longitude;
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

        // Obter informações de rede
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
            horarioEntrada,
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
            tipoDispositivo: detectarTipoDispositivo(),
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

function obterLocalizacaoAltaPrecisao() {
    return new Promise((resolve) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    const { latitude, longitude } = posicao.coords;
                    console.log('📍 Localização precisa obtida:', latitude, longitude);
                    resolve({ latitude, longitude });
                },
                (erro) => {
                    console.warn('⚠️ Permissão de geolocalização negada ou erro:', erro);
                    resolve({}); // Retorna vazio para indicar erro
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            console.warn('⚠️ Geolocalização não suportada no navegador.');
            resolve({});
        }
    });
}

async function obterInformacoesIP() {
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
        // Primeiro, tenta pegar apenas o IP
        const respostaIp = await fetch('https://api.ipify.org?format=json');
        const dataIp = await respostaIp.json();
        ipInfo.ip = dataIp.ip || 'Indisponível';

        if (ipInfo.ip !== 'Indisponível' && ipInfo.ip !== '127.0.0.1') {
            // Depois tenta buscar informações detalhadas
            try {
                const respostaGeo = await fetch(`https://ipapi.co/${ipInfo.ip}/json/`);
                const dataGeo = await respostaGeo.json();
                ipInfo = {
                    ...ipInfo,
                    pais: dataGeo.country_name || dataGeo.country || 'Indisponível',
                    regiao: dataGeo.region || 'Indisponível',
                    cidade: dataGeo.city || 'Indisponível',
                    cep: dataGeo.postal || 'Indisponível',
                    latitude: dataGeo.latitude || 'Indisponível',
                    longitude: dataGeo.longitude || 'Indisponível',
                    provedor: dataGeo.org || 'Indisponível'
                };
            } catch (fallbackError) {
                console.warn('⚠️ Erro ao buscar informações detalhadas pelo IP:', fallbackError);
            }
        }
    } catch (error) {
        console.warn('⚠️ Erro ao obter IP público:', error);
    }

    function detectarTipoDispositivo() {
        const ua = navigator.userAgent;
    
        if (/tablet|ipad|playbook|silk/i.test(ua)) {
            return 'Tablet';
        }
        if (/mobile|iphone|ipod|android|blackberry|phone/i.test(ua)) {
            return 'Celular';
        }
        return 'Desktop';
    }
    

    return ipInfo;
}
